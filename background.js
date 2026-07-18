import { AUTH_CONFIG } from "./auth-config.js";
import { BACKEND_CONFIG } from "./backend-config.js";

const API = String(BACKEND_CONFIG?.coachApiBaseUrl || "http://127.0.0.1:8787").replace(/\/+$/, "");
const SESSION_KEY = "myHelperSession";
const DELETION_CONFIRMATION_KEY = "myHelperRequireGoogleChoice";
const visualCaptures = new Map();

const configured = () => {
  const url = String(AUTH_CONFIG?.supabaseUrl || "");
  const key = String(AUTH_CONFIG?.supabasePublishableKey || "");
  return url.startsWith("https://") && !url.includes("YOUR-PROJECT") && key.length > 20 && !key.includes("YOUR_KEY");
};

const supabaseUrl = () => String(AUTH_CONFIG?.supabaseUrl || "").replace(/\/+$/, "");

function storageGet(key) {
  return new Promise((resolve) => {
    chrome.storage.local.get(key, (value) => resolve(chrome.runtime.lastError ? {} : (value || {})));
  });
}

function storageSet(value) {
  return new Promise((resolve) => {
    chrome.storage.local.set(value, () => resolve(!chrome.runtime.lastError));
  });
}

function storageClear() {
  return new Promise((resolve) => {
    chrome.storage.local.clear(() => resolve(!chrome.runtime.lastError));
  });
}

function notifyAccountChanged() {
  chrome.tabs.query({
    url: ["https://chatgpt.com/*", "https://*.chatgpt.com/*", "https://chat.openai.com/*"]
  }, (tabs) => {
    for (const tab of tabs) {
      if (!tab.id) continue;
      chrome.tabs.sendMessage(tab.id, { type: "MY_HELPER_ACCOUNT_CHANGED" }, () => {
        void chrome.runtime.lastError;
      });
    }
  });
}

async function clearSession() {
  await storageSet({ [SESSION_KEY]: null });
}

async function loadSession() {
  const stored = await storageGet(SESSION_KEY);
  return stored[SESSION_KEY] || null;
}

function sessionFrom(data, previous = {}) {
  const expiresAt = Number(data.expires_at) || Math.floor(Date.now() / 1000) + Math.max(60, Number(data.expires_in) || 3600);
  return {
    access_token: String(data.access_token || previous.access_token || ""),
    refresh_token: String(data.refresh_token || previous.refresh_token || ""),
    expires_at: expiresAt,
    user: data.user || previous.user || null
  };
}

async function fetchUser(accessToken) {
  const response = await fetch(`${supabaseUrl()}/auth/v1/user`, {
    headers: {
      apikey: AUTH_CONFIG.supabasePublishableKey,
      Authorization: `Bearer ${accessToken}`
    }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data?.id) throw new Error("Your sign-in session is no longer valid.");
  return {
    id: data.id,
    email: String(data.email || ""),
    displayName: String(data.user_metadata?.full_name || data.user_metadata?.name || "")
  };
}

async function refreshSession(previous) {
  if (!previous?.refresh_token || !configured()) return null;
  const response = await fetch(`${supabaseUrl()}/auth/v1/token?grant_type=refresh_token`, {
    method: "POST",
    headers: {
      apikey: AUTH_CONFIG.supabasePublishableKey,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ refresh_token: previous.refresh_token })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data?.access_token) return null;
  const session = sessionFrom(data, previous);
  await storageSet({ [SESSION_KEY]: session });
  return session;
}

async function currentSession() {
  if (!configured()) return null;
  const session = await loadSession();
  if (!session?.access_token) return null;
  const expiresAt = Number(session.expires_at || 0);
  if (!expiresAt || expiresAt > Math.floor(Date.now() / 1000) + 60) return session;
  const refreshed = await refreshSession(session);
  if (!refreshed) await clearSession();
  return refreshed;
}

async function accountStatus() {
  const session = await currentSession();
  if (!session) return { signedIn: false };
  try {
    const user = await fetchUser(session.access_token);
    await storageSet({ [SESSION_KEY]: { ...session, user } });
    return { signedIn: true, email: user.email, displayName: user.displayName };
  } catch {
    await clearSession();
    return { signedIn: false };
  }
}

async function clearGoogleIdentityCache() {
  // The extension does not normally use Chrome's cached Google tokens, but
  // clearing them after permanent deletion prevents a cached identity result
  // from bypassing the deliberate new-account sign-in flow.
  try {
    await chrome.identity.clearAllCachedAuthTokens();
  } catch {
    // This is an extra safeguard. The OAuth prompt below still requests a
    // visible Google confirmation when Chrome has no cached identity result.
  }
}

async function signIn() {
  if (!configured()) throw new Error("Add your Supabase Project URL and publishable key to auth-config.js first.");
  const redirectTo = chrome.identity.getRedirectURL("supabase");
  const url = new URL(`${supabaseUrl()}/auth/v1/authorize`);
  url.searchParams.set("provider", "google");
  url.searchParams.set("redirect_to", redirectTo);
  url.searchParams.set("flow_type", "implicit");
  const signInState = await storageGet(DELETION_CONFIRMATION_KEY);
  if (signInState[DELETION_CONFIRMATION_KEY] === true) {
    // A person who deleted an account must deliberately approve a new Google
    // sign-in. `login` prevents silent single-sign-on, while the other values
    // request Google's account chooser and consent screen.
    await clearGoogleIdentityCache();
    url.searchParams.set("prompt", "login consent select_account");
    url.searchParams.set("max_age", "0");
  }
  const result = await chrome.identity.launchWebAuthFlow({ url: url.toString(), interactive: true });
  if (!result) throw new Error("Google sign-in was cancelled.");

  const returned = new URL(result);
  const values = new URLSearchParams(returned.hash ? returned.hash.slice(1) : returned.search);
  if (values.get("error")) throw new Error(values.get("error_description") || "Google sign-in could not finish.");

  const accessToken = values.get("access_token");
  const refreshToken = values.get("refresh_token");
  if (!accessToken || !refreshToken) {
    throw new Error("Google sign-in did not return a My Helper session. Check the Supabase redirect URL.");
  }

  const session = sessionFrom({
    access_token: accessToken,
    refresh_token: refreshToken,
    expires_at: values.get("expires_at"),
    expires_in: values.get("expires_in")
  });
  session.user = await fetchUser(session.access_token);
  await storageSet({ [SESSION_KEY]: session, [DELETION_CONFIRMATION_KEY]: false });
  notifyAccountChanged();
  return { signedIn: true, email: session.user.email, redirectTo };
}

async function signOut() {
  const session = await loadSession();
  if (session?.access_token && configured()) {
    fetch(`${supabaseUrl()}/auth/v1/logout`, {
      method: "POST",
      headers: {
        apikey: AUTH_CONFIG.supabasePublishableKey,
        Authorization: `Bearer ${session.access_token}`
      }
    }).catch(() => {});
  }
  await clearSession();
  notifyAccountChanged();
  return { signedIn: false };
}

function clampScore(value) {
  return Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
}

async function syncUserState(prefs) {
  const session = await currentSession();
  if (!session) return { synced: false };

  const user = session.user?.id ? session.user : await fetchUser(session.access_token);
  if (!session.user?.id) await storageSet({ [SESSION_KEY]: { ...session, user } });

  const headers = {
    apikey: AUTH_CONFIG.supabasePublishableKey,
    Authorization: `Bearer ${session.access_token}`,
    "Content-Type": "application/json",
    Prefer: "resolution=merge-duplicates,return=minimal"
  };

  const completedLessons = Array.isArray(prefs?.completedLessons)
    ? prefs.completedLessons.map(String).slice(0, 30)
    : [];
  const achievements = [];
  if (clampScore(prefs?.promptSkill) > 0) achievements.push("first_coached_prompt");
  if (clampScore(prefs?.chatgptSkill) > 0) achievements.push("first_chatgpt_lesson");
  if (clampScore(prefs?.codexSkill) > 0) achievements.push("first_codex_lesson");
  if (clampScore(prefs?.automationSkill) > 0) achievements.push("automation_explorer");

  const profile = {
    id: user.id,
    preferred_language: String(prefs?.language || "English").slice(0, 60),
    voice_language: String(prefs?.voiceLanguage || "English").slice(0, 60),
    voice_style: String(prefs?.voiceStyle || "natural").slice(0, 40),
    coaching_style: String(prefs?.coachStyle || "friendly").slice(0, 40),
    voice_enabled: prefs?.speechEnabled !== false,
    auto_tips: Boolean(prefs?.autoTips),
    large_text: Boolean(prefs?.largeText),
    high_contrast: Boolean(prefs?.highContrast)
  };
  const progress = {
    user_id: user.id,
    prompt_skill: clampScore(prefs?.promptSkill),
    chatgpt_skill: clampScore(prefs?.chatgptSkill),
    codex_skill: clampScore(prefs?.codexSkill),
    automation_skill: clampScore(prefs?.automationSkill),
    completed_lessons: completedLessons,
    achievements
  };

  const [profileReply, progressReply] = await Promise.all([
    fetch(`${supabaseUrl()}/rest/v1/profiles?on_conflict=id`, {
      method: "POST",
      headers,
      body: JSON.stringify(profile)
    }),
    fetch(`${supabaseUrl()}/rest/v1/user_progress?on_conflict=user_id`, {
      method: "POST",
      headers,
      body: JSON.stringify(progress)
    })
  ]);

  if (!profileReply.ok || !progressReply.ok) {
    throw new Error("My Helper could not synchronize your account yet.");
  }
  return { synced: true };
}

async function createSupportRequest(input) {
  const session = await currentSession();
  if (!session) throw new Error("Sign in with Google to send a private support message.");

  const category = ["technical", "account", "feedback", "other"].includes(input.category) ? input.category : "other";
  const message = String(input.message || "").trim();
  if (message.length < 10) throw new Error("Please describe the issue in at least a few words.");
  if (message.length > 2000) throw new Error("Please keep the support message under 2,000 characters.");

  const response = await fetch(`${supabaseUrl()}/functions/v1/support-email`, {
    method: "POST",
    headers: {
      apikey: AUTH_CONFIG.supabasePublishableKey,
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ category, message })
  });

  const details = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 429) {
      throw new Error("You have sent several support messages. Please wait a little while before sending another.");
    }
    if (response.status === 401) throw new Error("Your sign-in has expired. Please sign in again before sending support.");
    throw new Error(details?.error || "We could not send your support message right now. Please try again.");
  }
  return { sent: true, reference: String(details?.reference || "") };
}

async function deleteMyHelperAccount(input) {
  if (input?.confirm !== true) throw new Error("Confirm account deletion before continuing.");
  const session = await currentSession();
  if (!session) throw new Error("Sign in with Google before deleting your account.");

  const response = await fetch(`${supabaseUrl()}/functions/v1/delete-account`, {
    method: "POST",
    headers: {
      apikey: AUTH_CONFIG.supabasePublishableKey,
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ confirm: true })
  });
  const details = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401) throw new Error("Your sign-in has expired. Please sign in again before deleting your account.");
    throw new Error(details?.error || "We could not delete your My Helper account right now. Please try again.");
  }

  // Clear every My Helper preference from this extension after permanent
  // account deletion. The flag makes any later Google login user-initiated.
  await storageClear();
  await storageSet({ [DELETION_CONFIRMATION_KEY]: true });
  notifyAccountChanged();
  return { deleted: true };
}

function signInNeeded(feature) {
  return `Sign in with Google to use My Helper ${feature}.`;
}

async function post(path, payload, sendResponse) {
  const session = await currentSession();
  if (!session) return sendResponse({ error: signInNeeded("AI coaching") });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), path === "/interface" ? 60000 : 20000);
  fetch(`${API}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`
    },
    body: JSON.stringify(payload),
    signal: controller.signal
  })
    .then(async (response) => {
      const data = await response.json().catch(() => ({}));
      sendResponse(response.ok ? data : { error: data.error || "My Helper could not complete that request." });
    })
    .catch((error) => {
      sendResponse({
        error: error.name === "AbortError"
          ? "My Helper needs a little more time. Nothing on your ChatGPT page was changed. Please try again."
          : "My Helper is unavailable for a moment. Nothing on your ChatGPT page was changed. Please try again."
      });
    })
    .finally(() => clearTimeout(timeout));
}

async function translateDashboardInterface(payload, sendResponse) {
  const session = await currentSession();
  const publicLanding = payload?.publicLanding === true;
  if (!session && !publicLanding) return sendResponse({ error: signInNeeded("language translation") });
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  fetch(`${API}/${session ? "interface" : "public-interface"}`, {
    method: "POST",
    headers: session
      ? { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` }
      : { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal: controller.signal
  })
    .then(async (response) => {
      const data = await response.json().catch(() => ({}));
      sendResponse(response.ok ? data : { error: data.error || "My Helper could not change language right now." });
    })
    .catch((error) => sendResponse({ error: error.name === "AbortError" ? "My Helper needs a little more time to change language. Please try again." : "My Helper could not change language right now. Please try again." }))
    .finally(() => clearTimeout(timeout));
}

function bytesToBase64(bytes) {
  let binary = "";
  const chunkSize = 0x8000;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }
  return btoa(binary);
}

async function synthesizeSpeech(message, sendResponse) {
  const session = await currentSession();
  if (!session) return sendResponse({ error: signInNeeded("cloud voice") });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45000);
  fetch(`${API}/speech`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`
    },
    body: JSON.stringify(message),
    signal: controller.signal
  })
    .then(async (response) => {
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        sendResponse({ error: data.error || "My Helper could not create this voice." });
        return;
      }
      const bytes = new Uint8Array(await response.arrayBuffer());
      if (!bytes.length) return sendResponse({ error: "My Helper received an empty voice response." });
      const mime = response.headers.get("content-type") || "audio/mpeg";
      sendResponse({ audio: `data:${mime};base64,${bytesToBase64(bytes)}` });
    })
    .catch((error) => {
      sendResponse({
        error: error.name === "AbortError"
          ? "My Helper needs a little more time to prepare the voice. Please try again."
          : "Voice is unavailable right now. You can still read My Helper's guidance."
      });
    })
    .finally(() => clearTimeout(timeout));
}

function visualFallback(message, sendResponse) {
  const visualError = "Visual capture was unavailable, so I used the live page map instead. Click the My Helper icon in Chrome's toolbar once on this ChatGPT tab, then try again.";
  void post("/explain", { ...message, visualError }, (reply) => {
    sendResponse(reply && typeof reply === "object" ? { ...reply, visualError } : reply);
  });
}

async function captureVisualScreen(sender, sendResponse) {
  try {
    const windowId = sender.tab?.windowId;
    if (typeof windowId !== "number") throw new Error("No active ChatGPT tab is available.");
    const screenshot = await chrome.tabs.captureVisibleTab(windowId, { format: "jpeg", quality: 68 });
    if (!screenshot || screenshot.length > 3200000) {
      throw new Error("The visible page image is too large to analyze safely.");
    }
    const captureId = crypto.randomUUID();
    visualCaptures.set(captureId, screenshot);
    setTimeout(() => visualCaptures.delete(captureId), 30000);
    sendResponse({ captureId });
  } catch {
    sendResponse({
      error: "Visual capture is unavailable. Click the My Helper icon in Chrome's toolbar once on this ChatGPT tab, then try again."
    });
  }
}

function explainWithVisual(message, sendResponse) {
  const captureId = typeof message.captureId === "string" ? message.captureId : "";
  const screenshot = captureId ? visualCaptures.get(captureId) : "";
  if (captureId) visualCaptures.delete(captureId);
  if (!screenshot) return visualFallback(message, sendResponse);
  void post("/explain", { ...message, screenshot }, sendResponse);
}

function openAccountHub(sendResponse) {
  chrome.tabs.create({ url: chrome.runtime.getURL("dashboard.html") }, () => {
    if (chrome.runtime.lastError) {
      sendResponse({ error: chrome.runtime.lastError.message });
      return;
    }
    sendResponse({ opened: true });
  });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "OPEN_ACCOUNT_HUB") {
    openAccountHub(sendResponse);
    return true;
  }

  if (message.type === "CHECK_SERVER") {
    fetch(`${API}/health`)
      .then(async (response) => sendResponse(await response.json()))
      .catch(() => sendResponse({ ready: false }));
    return true;
  }

  if (message.type === "ACCOUNT_STATUS") {
    void accountStatus().then(sendResponse);
    return true;
  }
  if (message.type === "SIGN_IN") {
    void signIn().then(sendResponse).catch((error) => {
      sendResponse({ error: error.message || "Google sign-in could not start." });
    });
    return true;
  }
  if (message.type === "SIGN_OUT") {
    void signOut().then(sendResponse);
    return true;
  }
  if (message.type === "SYNC_USER_STATE") {
    void syncUserState(message.prefs || {}).then(sendResponse).catch((error) => {
      sendResponse({ error: error.message || "My Helper could not synchronize your account." });
    });
    return true;
  }
  if (message.type === "CREATE_SUPPORT_REQUEST") {
    void createSupportRequest(message).then(sendResponse).catch((error) => {
      sendResponse({ error: error.message || "My Helper could not send your support message." });
    });
    return true;
  }
  if (message.type === "DELETE_MY_ACCOUNT") {
    void deleteMyHelperAccount(message).then(sendResponse).catch((error) => {
      sendResponse({ error: error.message || "My Helper could not delete your account." });
    });
    return true;
  }
  if (message.type === "COACH_DRAFT") {
    void post("/coach", message, sendResponse);
    return true;
  }
  if (message.type === "EXPLAIN_PAGE") {
    void post("/explain", message, sendResponse);
    return true;
  }
  if (message.type === "CAPTURE_VISUAL_SCREEN") {
    void captureVisualScreen(sender, sendResponse);
    return true;
  }
  if (message.type === "EXPLAIN_PAGE_VISUAL") {
    explainWithVisual(message, sendResponse);
    return true;
  }
  if (message.type === "ASK_COACH") {
    void post("/ask", message, sendResponse);
    return true;
  }
  if (message.type === "GUIDE_USER") {
    void post("/guide", message, sendResponse);
    return true;
  }
  if (message.type === "TRANSLATE_INTERFACE") {
    void translateDashboardInterface(message, sendResponse);
    return true;
  }
  if (message.type === "SYNTHESIZE_SPEECH") {
    void synthesizeSpeech(message, sendResponse);
    return true;
  }
});
