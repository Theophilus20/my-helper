import http from "node:http";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

async function loadEnv() {
  const values = {};
  try {
    const text = await readFile(join(process.cwd(), ".env"), "utf8");
    for (const line of text.split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
      if (match) values[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
    }
  } catch { /* /health describes missing configuration. */ }
  return values;
}

const fileEnv = await loadEnv();
const config = {
  key: Object.hasOwn(fileEnv, "OPENROUTER_API_KEY") ? fileEnv.OPENROUTER_API_KEY : (process.env.OPENROUTER_API_KEY || ""),
  model: Object.hasOwn(fileEnv, "OPENROUTER_MODEL") ? fileEnv.OPENROUTER_MODEL : (process.env.OPENROUTER_MODEL || "openai/gpt-5.4-mini"),
  openaiKey: Object.hasOwn(fileEnv, "OPENAI_API_KEY") ? fileEnv.OPENAI_API_KEY : (process.env.OPENAI_API_KEY || ""),
  ttsModel: Object.hasOwn(fileEnv, "OPENAI_TTS_MODEL") ? fileEnv.OPENAI_TTS_MODEL : (process.env.OPENAI_TTS_MODEL || "tts-1"),
  ttsVoice: Object.hasOwn(fileEnv, "OPENAI_TTS_VOICE") ? fileEnv.OPENAI_TTS_VOICE : (process.env.OPENAI_TTS_VOICE || "nova"),
  supabaseUrl: String(Object.hasOwn(fileEnv, "SUPABASE_URL") ? fileEnv.SUPABASE_URL : (process.env.SUPABASE_URL || "")).replace(/\/+$/, ""),
  supabasePublishableKey: Object.hasOwn(fileEnv, "SUPABASE_PUBLISHABLE_KEY") ? fileEnv.SUPABASE_PUBLISHABLE_KEY : (process.env.SUPABASE_PUBLISHABLE_KEY || ""),
  port: Number(Object.hasOwn(fileEnv, "PORT") ? fileEnv.PORT : (process.env.PORT || 8787))
};

const OFFICIAL_COACHING_CUES = [
  { match: /codex|terminal|command|file|repo|code|debug/, cue: "Explain plans, file changes, testing, approvals, and review in calm, plain language. Never suggest blindly running commands." },
  { match: /voice|speak|audio|transcri/, cue: "Keep spoken guidance short, clear, captionable, and easy to stop." },
  { match: /agent|automate|workflow|tool/, cue: "Explain that an agent needs a clear goal, permitted tools, human checkpoints, and an evaluation plan." },
  { match: /api|key|endpoint|developer|integration/, cue: "Teach the user to keep keys server-side, start with a minimal request, and verify the result before expanding." },
  { match: /safe|private|privacy|verify|medical|legal|financial/, cue: "Encourage human review, privacy awareness, and appropriate verification. Do not provide professional advice as fact." },
  { match: /model|gpt|reasoning|fast|cheap/, cue: "Help the user begin with the task and choose a model according to capability, speed, and cost only when that choice matters." },
  { match: /.*/, cue: "Help the user state a clear outcome, useful context, constraints, and the output format they want." }
];

const interfaceCache = new Map();
const speechCache = new Map();
const MAX_SPEECH_CACHE_ITEMS = 80;
const sessionCache = new Map();
const SESSION_CACHE_TTL_MS = 10_000;
const MAX_SESSION_CACHE_ITEMS = 200;
const userRequestWindows = new Map();
const USER_REQUEST_WINDOW_MS = 15 * 60_000;
const MAX_USER_REQUEST_WINDOWS = 2_000;
const PUBLIC_TRANSLATION_LANGUAGES = new Set(["Spanish", "French", "German", "Italian", "Portuguese", "Dutch", "Polish", "Turkish", "Arabic", "Hindi", "Bengali", "Japanese", "Korean", "Simplified Chinese", "Traditional Chinese", "Vietnamese", "Thai", "Indonesian", "Malay", "Russian", "Ukrainian", "Swahili", "Igbo", "Hausa", "Yoruba"]);
const publicTranslationWindows = new Map();
const PUBLIC_TRANSLATION_LIMIT = 10;
const PUBLIC_TRANSLATION_WINDOW_MS = 15 * 60_000;

function reply(res, status, body) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer",
    "X-Frame-Options": "DENY",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()"
  });
  res.end(JSON.stringify(body));
}

function replyAudio(res, status, audio, contentType = "audio/mpeg") {
  res.writeHead(status, {
    "Content-Type": contentType,
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer",
    "X-Frame-Options": "DENY"
  });
  res.end(audio);
}

// Some providers return raw 24 kHz, 16-bit mono PCM. Browsers cannot reliably
// play raw PCM from a data URL, so add a WAV header before sending it back.
function pcmToWav(pcm, sampleRate) {
  const channels = 1;
  const bitsPerSample = 16;
  const blockAlign = channels * bitsPerSample / 8;
  const byteRate = sampleRate * blockAlign;
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write("data", 36);
  header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]);
}

function jsonFrom(text) {
  const candidate = String(text || "").replace(/```json|```/g, "").trim().match(/\{[\s\S]*\}/)?.[0];
  if (!candidate) throw httpError(502, "We could not finish that right now. Please try again in a moment.");
  try {
    return JSON.parse(candidate);
  } catch {
    throw httpError(502, "We could not finish that right now. Please try again in a moment.");
  }
}

function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  error.publicMessage = message;
  return error;
}

function coachServiceMessage(status) {
  if (status === 429) return "My Helper is busy right now. Please wait a moment and try again.";
  if (status === 401 || status === 403) return "My Helper is temporarily unavailable. Please try again later.";
  if (status >= 500) return "My Helper is unavailable right now. Nothing on your ChatGPT page was changed. Please try again shortly.";
  return "We could not finish that right now. Nothing on your ChatGPT page was changed. Please try again in a moment.";
}

async function authenticate(req) {
  if (!config.supabaseUrl || !config.supabasePublishableKey) {
    throw httpError(503, "My Helper authentication is not configured yet.");
  }

  const token = String(req.headers.authorization || "").match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) throw httpError(401, "Sign in with Google to use My Helper coaching.");

  const cached = sessionCache.get(token);
  if (cached && cached.expiresAt > Date.now()) return cached.user;

  let response;
  try {
    response = await fetch(`${config.supabaseUrl}/auth/v1/user`, {
      headers: {
        apikey: config.supabasePublishableKey,
        Authorization: `Bearer ${token}`
      }
    });
  } catch {
    throw httpError(503, "My Helper could not verify your sign-in session.");
  }
  const user = await response.json().catch(() => ({}));
  if (!response.ok || !user?.id) throw httpError(401, "Your sign-in session is no longer valid. Please sign in again.");

  sessionCache.set(token, { user, expiresAt: Date.now() + SESSION_CACHE_TTL_MS });
  if (sessionCache.size > MAX_SESSION_CACHE_ITEMS) sessionCache.delete(sessionCache.keys().next().value);
  return user;
}

function requestLimitFor(pathname) {
  if (pathname === "/speech") return 50;
  if (pathname === "/explain") return 30;
  return 60;
}

function allowAuthenticatedRequest(userId, pathname) {
  const key = `${userId}:${pathname}`;
  const now = Date.now();
  const active = userRequestWindows.get(key);
  const window = active && now - active.startedAt < USER_REQUEST_WINDOW_MS
    ? active
    : { startedAt: now, count: 0 };
  if (window.count >= requestLimitFor(pathname)) return false;

  window.count += 1;
  userRequestWindows.set(key, window);
  if (userRequestWindows.size > MAX_USER_REQUEST_WINDOWS) {
    const oldest = userRequestWindows.keys().next().value;
    if (oldest) userRequestWindows.delete(oldest);
  }
  return true;
}

function isAllowedPublicTranslation(input) {
  const strings = input?.strings;
  if (input?.publicLanding !== true || !PUBLIC_TRANSLATION_LANGUAGES.has(input?.language)) return false;
  if (!strings || typeof strings !== "object" || Array.isArray(strings)) return false;
  const entries = Object.entries(strings);
  return entries.length > 0 && entries.length <= 50
    && entries.every(([key, value]) => /^[a-zA-Z][a-zA-Z0-9]*$/.test(key) && typeof value === "string" && value.length <= 1200)
    && JSON.stringify(strings).length <= 14_000;
}

function allowPublicTranslation(req) {
  const client = req.socket.remoteAddress || "local";
  const now = Date.now();
  const window = publicTranslationWindows.get(client);
  const active = window && now - window.startedAt < PUBLIC_TRANSLATION_WINDOW_MS
    ? window
    : { startedAt: now, count: 0 };
  if (active.count >= PUBLIC_TRANSLATION_LIMIT) return false;
  active.count += 1;
  publicTranslationWindows.set(client, active);
  return true;
}

async function askModel(system, user, temperature = 0.35, screenshot = "", maxTokens = 0) {
  const visualMessage = screenshot ? [{ type: "text", text: user }, { type: "image_url", image_url: { url: screenshot } }] : user;
  let response;
  try {
    response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${config.key}`,
        "Content-Type": "application/json",
        "X-OpenRouter-Title": "My Helper"
      },
      body: JSON.stringify({
        model: config.model,
        temperature,
        response_format: { type: "json_object" },
        ...(maxTokens ? { max_tokens: maxTokens } : {}),
        messages: [{ role: "system", content: system }, { role: "user", content: visualMessage }]
      })
    });
  } catch (error) {
    console.error("[My Helper] Coach connection failed:", error?.cause?.code || error?.message || "unknown error");
    throw httpError(503, "We could not connect right now. Nothing on your ChatGPT page was changed. Please try again in a moment.");
  }
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    console.error("[My Helper] Coach service returned:", response.status);
    throw httpError(response.status, coachServiceMessage(response.status));
  }
  const answer = payload?.choices?.[0]?.message?.content;
  if (!answer) throw httpError(502, "We could not finish that right now. Please try again in a moment.");
  return answer;
}

async function createSpeech(input) {
  if (!config.openaiKey) throw httpError(503, "Voice is unavailable right now. You can still read My Helper's guidance.");
  const text = String(input.text || "").trim().slice(0, 4096);
  if (!text) throw httpError(400, "There is no guidance to speak yet.");
  const speechKey = `${config.ttsModel}|${config.ttsVoice}|${input.language || "English"}|${input.voiceStyle || "natural"}|${text}`;
  const cached = speechCache.get(speechKey);
  if (cached) return cached;
  let response;
  try {
    response = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${config.openaiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: config.ttsModel,
        input: text,
        voice: config.ttsVoice,
        response_format: "mp3",
        speed: 0.98
      })
    });
  } catch (error) {
    console.error("[My Helper] Voice connection failed:", error?.cause?.code || error?.message || "unknown error");
    throw httpError(503, "Voice is unavailable right now. You can still read My Helper's guidance.");
  }
  if (!response.ok) {
    console.error("[My Helper] Voice service returned:", response.status);
    throw httpError(response.status, "Voice is unavailable right now. You can still read My Helper's guidance.");
  }
  const audio = Buffer.from(await response.arrayBuffer());
  const contentType = response.headers.get("content-type") || "audio/mpeg";
  const speech = { audio, contentType };
  speechCache.set(speechKey, speech);
  if (speechCache.size > MAX_SPEECH_CACHE_ITEMS) speechCache.delete(speechCache.keys().next().value);
  return speech;
}

function coachingCue(draft, pageContext) {
  const text = `${draft} ${pageContext}`.toLowerCase();
  return OFFICIAL_COACHING_CUES.find((item) => item.match.test(text)).cue;
}

async function buildPlan(input) {
  const system = `You are My Helper: an encouraging, patient, non-judgmental AI onboarding coach for ChatGPT and Codex. Coaching style: ${input.style || "friendly"}. Reply entirely in ${input.language || "English"}. Every natural-language field must use that language only. Do not copy a different language from the input or the current page into prose. The only exception is an exact ChatGPT, Codex, My Helper, or on-screen control name, which must be wrapped in quotation marks. Preserve the natural language of the user's draft in improvedPrompt. Help people learn while they work; never shame them, never claim to control ChatGPT, and never ask for secrets or private data. Curriculum principle: ${coachingCue(input.draft, input.pageContext)} Score prompt quality VERY strictly: give 0 for fewer than six meaningful words, no clear goal, or keyboard-smash text; keep vague requests below 35; only give 70+ when the goal, context/audience, concrete details, and requested result are all present. Return ONLY a valid JSON object with exactly: {"message":string,"improvedPrompt":string,"strengths":[string,string],"missing":[string,string,string],"nextStep":string,"qualityScore":number}. Keep it concise, practical, and understandable to a beginner.`;
  const plan = jsonFrom(await askModel(system, `Current screen: ${input.pageContext || "ChatGPT"}. Coach this user draft:\n\n${input.draft}`));
  if (!plan.message || !plan.improvedPrompt) throw new Error("The model returned an incomplete coaching plan.");
  const modelScore = Math.max(0, Math.min(100, Number(plan.qualityScore) || 0));
  return {
    message: String(plan.message),
    improvedPrompt: String(plan.improvedPrompt),
    strengths: Array.isArray(plan.strengths) ? plan.strengths.slice(0, 3).map(String) : [],
    missing: Array.isArray(plan.missing) ? plan.missing.slice(0, 3).map(String) : [],
    nextStep: String(plan.nextStep || "Try the improved prompt and change it until it sounds like you."),
    qualityScore: modelScore
  };
}

function screenEvidence(input) {
  const raw = input.screen && typeof input.screen === "object" ? input.screen : {};
  const page = raw.page && typeof raw.page === "object" ? raw.page : { context: input.pageContext || "ChatGPT" };
  const controls = Array.isArray(raw.controls) ? raw.controls.slice(0, 100).map((control) => ({
    id: String(control.id || ""),
    label: String(control.label || "").slice(0, 90),
    role: String(control.role || "control").slice(0, 30),
    bounds: control.bounds && typeof control.bounds === "object" ? control.bounds : {}
  })).filter((control) => control.id && control.label) : [];
  return { page, controls, byId: new Map(controls.map((control) => [control.id, control])) };
}

async function explainPage(input) {
  const evidence = screenEvidence(input);
  const screenshot = typeof input.screenshot === "string" && /^data:image\/(?:jpeg|png);base64,/.test(input.screenshot) && input.screenshot.length <= 3_200_000 ? input.screenshot : "";
  const system = `You are My Helper, a calm on-screen guide for ChatGPT. Reply entirely in ${input.language || "English"}. Every summary, purpose, nextStep, and spoken field must use that language only. Do not copy any other language from a page title, chat title, or screenshot into prose. The only exception is an exact visible control label, which must be wrapped in quotation marks; do not use chat titles as feature labels. You receive a real screen map with visible UI targets, exact IDs, and bounds. You may also receive a temporary screenshot of the same visible page. Use the screenshot only to understand the current page's layout and text. For every feature, copy controlId exactly from the supplied screen-map targets; never estimate an on-page location from the image and never invent an ID. Prefer the most useful currently visible controls and cover distinct actions rather than duplicates. Do not infer features, chat history, a ChatGPT Home page, or navigation that are not present in the screen map. If the evidence is insufficient, say that plainly. Return ONLY JSON: {"summary":string,"features":[{"controlId":string,"label":string,"purpose":string,"nextStep":string}],"spoken":string}. Give up to eight features.`;
  const prompt = `Screen evidence:\n${JSON.stringify({ page: evidence.page, controls: evidence.controls })}\nExplain this exact page. ${screenshot ? "A temporary screenshot of this same visible page is attached." : ""}`;
  let output;
  let visualUsed = Boolean(screenshot);
  try {
    output = jsonFrom(await askModel(system, prompt, 0.35, screenshot));
  } catch (error) {
    if (!screenshot) throw error;
    visualUsed = false;
    output = jsonFrom(await askModel(system, prompt, 0.35));
  }
  return {
    summary: String(output.summary || "Here is what is visible on this screen."),
    features: Array.isArray(output.features) ? output.features.slice(0, 8).map((feature) => {
      const control = evidence.byId.get(String(feature.controlId || ""));
      return { controlId: control ? control.id : "", label: control ? control.label : String(feature.label || "Visible feature"), purpose: String(feature.purpose || ""), nextStep: String(feature.nextStep || "") };
    }) : [],
    spoken: String(output.spoken || output.summary || "Here is what I found on this page."),
    visualUsed
  };
}

async function answerVoiceQuestion(input) {
  const evidence = screenEvidence(input);
  const system = `You are My Helper, a patient voice coach for ChatGPT and Codex. Reply entirely in ${input.language || "English"}, matching the user's spoken language. Do not mix English into the answer except for an exact visible control label or product name. Explain features in plain, friendly language. For navigation advice, use ONLY the exact target IDs in the real screen map—never invent a control or location. If a target is not visible, say that it is not visible on this screen. Preserve the current page; never tell the user they are on ChatGPT Home unless the supplied evidence says so. If the user asks a general feature question, answer it directly without links. Do not claim to click, submit, change settings, or read private chat content. Return ONLY JSON: {"answer":string,"suggestedAction":"none"|"open_coach"|"explain_page"|"highlight_control","controlId":string}. Keep answer below 90 words so it can be spoken clearly.`;
  const output = jsonFrom(await askModel(system, `Screen evidence:\n${JSON.stringify({ page: evidence.page, controls: evidence.controls })}\nUser says: ${input.question}`));
  const control = evidence.byId.get(String(output.controlId || ""));
  const suggestedAction = ["none", "open_coach", "explain_page", "highlight_control"].includes(output.suggestedAction) ? output.suggestedAction : "none";
  return { answer: String(output.answer || "I can help explain this screen."), suggestedAction: suggestedAction === "highlight_control" && !control ? "none" : suggestedAction, controlId: control ? control.id : "", controlLabel: control ? control.label : "" };
}

async function guideUser(input) {
  const mode = input.mode === "build" ? "building a project" : "learning ChatGPT and Codex";
  const system = `You are My Helper, a patient, encouraging personal AI coach. You are ${mode}. Reply entirely in ${input.language || "English"} and preserve the user's natural language. Do not mix English into title, message, question, steps, or spoken output except for product names. Guide one small step at a time. Ask one clear question, explain why it matters, and offer no more than three practical next steps. Do not use generic placeholders such as [type of app]. Do not send the user to documentation or links. Return ONLY JSON: {"title":string,"message":string,"question":string,"steps":[string],"spoken":string,"skill":"chatgpt"|"codex"|"automation"|"build","complete":boolean}.`;
  const prompt = `Current screen: ${input.pageContext || "ChatGPT"}. Topic: ${String(input.topic || "Getting started")}. What the user has said so far: ${String(input.answer || "They have not answered yet.")}. Give the next coaching turn.`;
  const output = jsonFrom(await askModel(system, prompt));
  return {
    title: String(output.title || "Your next small step"),
    message: String(output.message || "Let’s make this simple and practical."),
    question: String(output.question || "What would you like to accomplish first?"),
    steps: Array.isArray(output.steps) ? output.steps.slice(0, 3).map(String) : [],
    spoken: String(output.spoken || output.message || "Let’s take this one step at a time."),
    skill: ["chatgpt", "codex", "automation", "build"].includes(output.skill) ? output.skill : "chatgpt",
    complete: Boolean(output.complete)
  };
}

async function translateInterface(input) {
  const strings = input.strings && typeof input.strings === "object" ? input.strings : {};
  if ((input.language || "English") === "English") return { strings };
  const cacheKey = `v${Number(input.cacheRevision) || 1}:${input.language}:${JSON.stringify(strings)}`;
  if (interfaceCache.has(cacheKey)) return { strings: interfaceCache.get(cacheKey) };
  const system = `Translate every interface value entirely into ${input.language}. Preserve JSON keys exactly and return every input key with a non-empty string value. Keep UI labels concise. Do not leave any English words or sentences, except product names ChatGPT, Codex, My Helper, and OpenRouter. Return ONLY a JSON object whose values are strings.`;
  // UI copy is deliberately bounded: this keeps a first-time language switch
  // responsive while the extension stores the completed translation locally.
  const translated = jsonFrom(await askModel(system, JSON.stringify(strings), 0.1, "", 4096));
  const safe = Object.fromEntries(Object.keys(strings).map((key) => [key, typeof translated[key] === "string" ? translated[key] : strings[key]]));
  interfaceCache.set(cacheKey, safe);
  return { strings: safe };
}

async function readInput(req, res) {
  let raw = "";
  for await (const part of req) {
    raw += part;
    if (raw.length > 3_500_000) { reply(res, 413, { error: "The visual page image was too large. Try again with fewer browser windows or zoom out slightly." }); return null; }
  }
  return JSON.parse(raw || "{}");
}

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") return reply(res, 204, {});
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (req.method === "GET" && url.pathname === "/health") {
    return reply(res, 200, { ready: Boolean(config.key && config.supabaseUrl && config.supabasePublishableKey) });
  }
  if (req.method !== "POST" || !["/coach", "/explain", "/ask", "/guide", "/interface", "/public-interface", "/speech"].includes(url.pathname)) return reply(res, 404, { error: "Not found." });
  try {
    const input = await readInput(req, res);
    if (!input) return;
    if (!config.key) return reply(res, 503, { error: "My Helper coach is not configured yet." });
    const publicTranslation = url.pathname === "/public-interface";
    if (publicTranslation) {
      if (!isAllowedPublicTranslation(input)) return reply(res, 400, { error: "That public translation request is not allowed." });
      if (!allowPublicTranslation(req)) return reply(res, 429, { error: "Please wait a few minutes before changing the public language again." });
    } else {
      // Every coaching, voice, and full-interface request requires a verified
      // session. The only exception is the bounded public landing-page copy.
      const user = await authenticate(req);
      if (!allowAuthenticatedRequest(user.id, url.pathname)) {
        return reply(res, 429, { error: "You've made several requests. Please wait a few minutes, then try again." });
      }
    }
    if (url.pathname === "/speech") {
      const speech = await createSpeech(input);
      return replyAudio(res, 200, speech.audio, speech.contentType);
    }
    if (url.pathname === "/coach") {
      input.draft = String(input.draft || "").trim();
      if (!input.draft) return reply(res, 400, { error: "Write or say a prompt for My Helper to coach." });
      return reply(res, 200, await buildPlan(input));
    }
    if (url.pathname === "/explain") return reply(res, 200, await explainPage(input));
    if (url.pathname === "/ask") return reply(res, 200, await answerVoiceQuestion(input));
    if (url.pathname === "/guide") return reply(res, 200, await guideUser(input));
    return reply(res, 200, await translateInterface(input));
  } catch (error) {
    const status = Number(error.status) || 500;
    if (!error?.publicMessage) console.error("[My Helper] Request failed:", error?.message || "unknown error");
    return reply(res, status, { error: error?.publicMessage || "We could not finish that right now. Please try again in a moment." });
  }
});

server.listen(config.port, "0.0.0.0", () => console.log(`My Helper coach is ready on port ${config.port}`));
