const API = "http://localhost:8787";
const visualCaptures = new Map();

function post(path, payload, sendResponse) {
  const controller = new AbortController();
  // A first translation can contain the complete interface in languages that
  // use more output tokens. Do not abort it at the normal coaching timeout;
  // once it returns, content.js keeps it locally for instant later switches.
  const timeout = setTimeout(() => controller.abort(), path === "/interface" ? 60000 : 20000);
  fetch(`${API}${path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload), signal: controller.signal })
    .then(async (response) => {
      const data = await response.json().catch(() => ({}));
      sendResponse(response.ok ? data : { error: data.error || "My Helper could not complete that request." });
    })
    .catch((error) => sendResponse({ error: error.name === "AbortError" ? "My Helper took too long to respond. Please try again." : "My Helper cannot reach its local coach. Check that it is running, then try again." }))
    .finally(() => clearTimeout(timeout));
}

function bytesToBase64(bytes) {
  let binary = "";
  const chunkSize = 0x8000;
  for (let index = 0; index < bytes.length; index += chunkSize) binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  return btoa(binary);
}

function synthesizeSpeech(message, sendResponse) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45000);
  fetch(`${API}/speech`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(message), signal: controller.signal })
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
    .catch((error) => sendResponse({ error: error.name === "AbortError" ? "My Helper took too long to prepare the voice." : "My Helper cannot reach its local voice coach." }))
    .finally(() => clearTimeout(timeout));
}

function visualFallback(message, sendResponse) {
  const visualError = "Visual capture was unavailable, so I used the live page map instead. Click the My Helper icon in Chrome’s toolbar once on this ChatGPT tab, then try again.";
  post("/explain", { ...message, visualError }, (reply) => {
    sendResponse(reply && typeof reply === "object" ? { ...reply, visualError } : reply);
  });
}

async function captureVisualScreen(sender, sendResponse) {
  try {
    const windowId = sender.tab?.windowId;
    if (typeof windowId !== "number") throw new Error("No active ChatGPT tab is available.");
    const screenshot = await chrome.tabs.captureVisibleTab(windowId, { format: "jpeg", quality: 68 });
    if (!screenshot || screenshot.length > 3_200_000) throw new Error("The visible page image is too large to analyze safely.");
    const captureId = crypto.randomUUID();
    visualCaptures.set(captureId, screenshot);
    setTimeout(() => visualCaptures.delete(captureId), 30_000);
    sendResponse({ captureId });
  } catch (error) {
    sendResponse({ error: "Visual capture is unavailable. Click the My Helper icon in Chrome’s toolbar once on this ChatGPT tab, then try again." });
  }
}

async function explainWithVisual(message, sendResponse) {
  const captureId = typeof message.captureId === "string" ? message.captureId : "";
  const screenshot = captureId ? visualCaptures.get(captureId) : "";
  if (captureId) visualCaptures.delete(captureId);
  if (!screenshot) return visualFallback(message, sendResponse);

  post("/explain", { ...message, screenshot }, sendResponse);
}

/*
  Capturing and explaining are deliberately separate messages. The panel is
  hidden only during capture, then restored while the model is thinking.
*/
async function legacyExplainWithVisual(message, sender, sendResponse) {
  const fallback = (visualError) => post("/explain", { ...message, visualError }, (reply) => {
    sendResponse(reply && typeof reply === "object" ? { ...reply, visualError } : reply);
  });

  try {
    const windowId = sender.tab?.windowId;
    if (typeof windowId !== "number") throw new Error("No active ChatGPT tab is available.");
    const screenshot = await chrome.tabs.captureVisibleTab(windowId, { format: "jpeg", quality: 68 });
    if (!screenshot || screenshot.length > 3_200_000) throw new Error("The visible page image is too large to analyze safely.");
    post("/explain", { ...message, screenshot }, sendResponse);
  } catch (error) {
    fallback("Visual capture was unavailable, so I used the live page map instead. To enable it, click the My Helper icon in Chrome’s toolbar once on this ChatGPT tab, then try again.");
  }
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "CHECK_SERVER") {
    fetch(`${API}/health`).then(async (response) => sendResponse(await response.json())).catch(() => sendResponse({ ready: false }));
    return true;
  }
  if (message.type === "COACH_DRAFT") { post("/coach", message, sendResponse); return true; }
  if (message.type === "EXPLAIN_PAGE") { post("/explain", message, sendResponse); return true; }
  if (message.type === "CAPTURE_VISUAL_SCREEN") { captureVisualScreen(_sender, sendResponse); return true; }
  if (message.type === "EXPLAIN_PAGE_VISUAL") { explainWithVisual(message, sendResponse); return true; }
  if (message.type === "ASK_COACH") { post("/ask", message, sendResponse); return true; }
  if (message.type === "GUIDE_USER") { post("/guide", message, sendResponse); return true; }
  if (message.type === "TRANSLATE_INTERFACE") { post("/interface", message, sendResponse); return true; }
  if (message.type === "SYNTHESIZE_SPEECH") { synthesizeSpeech(message, sendResponse); return true; }
});
