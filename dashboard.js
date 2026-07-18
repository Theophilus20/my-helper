const accountAction = document.querySelector("#accountAction");
const accountStatus = document.querySelector("#accountStatus");
const accountDescription = document.querySelector("#accountDescription");
const languageSelect = document.querySelector("#dashboardLanguage");
const supportForm = document.querySelector("#supportForm");
const supportStatus = document.querySelector("#supportStatus");
const supportSubmit = document.querySelector("#supportSubmit");
const supportReceipt = document.querySelector("#supportReceipt");
const supportMessage = document.querySelector("#supportMessage");
const deleteAccount = document.querySelector("#deleteAccount");
const deleteDialog = document.querySelector("#deleteDialog");
const cancelDelete = document.querySelector("#cancelDelete");
const translationOverlay = document.querySelector("#translationOverlay");

const languages = ["English", "Spanish", "French", "German", "Italian", "Portuguese", "Dutch", "Polish", "Turkish", "Arabic", "Hindi", "Bengali", "Japanese", "Korean", "Simplified Chinese", "Traditional Chinese", "Vietnamese", "Thai", "Indonesian", "Malay", "Russian", "Ukrainian", "Swahili", "Igbo", "Hausa", "Yoruba"];

const baseCopy = {
  languageLabel: "Language",
  eyebrow: "YOUR PERSONAL AI COACH",
  heroTitle: "Learn confidently with the AI tools you already use.",
  heroText: "My Helper stays beside you while you work. It explains visible features in clear language, highlights where to click, helps you create stronger prompts, and guides you step by step until using AI feels natural.",
  accountEyebrow: "YOUR MY HELPER ACCOUNT",
  accountTitle: "Sign in to start your guided learning journey.",
  accountText: "A My Helper account keeps your coaching, language preferences, voice settings, and learning progress private and ready whenever you return.",
  consent: "By continuing, you agree to My Helper's <a href=\"terms.html\">Terms of Service</a> and acknowledge that you have read the <a href=\"privacy.html\">Privacy Policy</a>.",
  signedOut: "Not signed in",
  toolsEyebrow: "LEARN WITH MY HELPER",
  toolsTitle: "Know what each tool can do - and how to use it well.",
  toolsText: "My Helper is an independent learning companion. It helps you build confidence while using ChatGPT and Codex.",
  chatgptText: "A welcoming place to think, learn, and create. Ask questions, explore ideas, study new topics, write and improve content, make plans, solve problems, and receive clear explanations at your own pace.",
  openChatgpt: "Open ChatGPT",
  codexText: "Your AI partner for building with code. Use Codex to understand projects, write and improve code, find and fix issues, test changes, and turn ideas into working software.",
  exploreCodex: "Explore Codex",
  helperText: "Your calm guide alongside both tools. My Helper explains features in everyday language, highlights the right place to click, teaches stronger prompting, and supports your preferred language and voice.",
  helperNote: "Learn at your own pace. My Helper is here when you need it.",
  supportEyebrow: "WE ARE HERE TO HELP",
  supportTitle: "Need support with My Helper?",
  supportText: "Tell us what happened. Your message is connected to your My Helper account so we can understand the issue and help you properly.",
  supportCategory: "What do you need help with?",
  supportTechnical: "Technical issue",
  supportAccount: "Account or sign-in",
  supportFeedback: "Feedback or idea",
  supportOther: "Something else",
  supportMessage: "Your message",
  supportPlaceholder: "Describe what happened and what you expected to happen.",
  sendSupport: "Send support message",
  supportSentTitle: "We received your message.",
  supportSentText: "It is securely connected to your My Helper account for review.",
  dataEyebrow: "YOUR DATA",
  dataTitle: "You stay in control.",
  dataText: "You can sign out at any time. If you no longer want My Helper, you can permanently delete your My Helper account and its stored data.",
  deleteAccount: "Delete My Helper account",
  deleteDialogEyebrow: "DELETE MY HELPER ACCOUNT",
  deleteDialogTitle: "Delete your My Helper account?",
  deleteDialogText: "This permanently deletes your My Helper sign-in, saved preferences, learning progress, and support records. It does not delete your Google Account.",
  cancelDelete: "Keep my account",
  confirmDelete: "Delete account",
  independent: "My Helper is independent and is not affiliated with or endorsed by OpenAI.",
  terms: "Terms",
  privacy: "Privacy",
  copyright: "Copyright 2026 My Helper. All rights reserved."
};

let signedIn = false;
let selectedLanguage = "English";
let languageRequest = 0;
const copyCache = new Map();

function send(message) {
  return new Promise((resolve) => {
    try {
      chrome.runtime.sendMessage(message, (reply) => {
        resolve(chrome.runtime.lastError ? { error: chrome.runtime.lastError.message } : (reply || {}));
      });
    } catch (error) {
      resolve({ error: error.message });
    }
  });
}

function updateSupportAvailability() {
  const available = signedIn;
  document.querySelector(".support-section").hidden = !available;
  document.querySelector(".data-section").hidden = !available;
  supportSubmit.disabled = !available;
  deleteAccount.disabled = !available;
  document.querySelectorAll("#supportForm select, #supportForm textarea").forEach((element) => { element.disabled = !available; });
  if (!available) {
    supportStatus.textContent = "";
    supportReceipt.hidden = true;
  }
}

function applyCopy(copy) {
  document.querySelectorAll("[data-i18n]").forEach((element) => {
    const value = copy[element.dataset.i18n];
    if (!value) return;
    if (element.dataset.i18n === "consent") element.innerHTML = value;
    else element.textContent = value;
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((element) => {
    const value = copy[element.dataset.i18nPlaceholder];
    if (value) element.placeholder = value;
  });
}

async function saveLanguage(language) {
  const stored = await new Promise((resolve) => chrome.storage.local.get("myHelperPrefs", resolve));
  const prefs = { ...(stored.myHelperPrefs || {}), language, voiceLanguage: language };
  await new Promise((resolve) => chrome.storage.local.set({ myHelperPrefs: prefs }, resolve));
  await send({ type: "SYNC_USER_STATE", prefs });
}

async function applyLanguage(language) {
  const request = ++languageRequest;
  selectedLanguage = language;
  if (language === "English") {
    applyCopy(baseCopy);
    await saveLanguage(language);
    return;
  }
  translationOverlay.classList.remove("hidden");
  const cacheKey = `dashboard-v3:${language}`;
  let copy = copyCache.get(cacheKey);
  if (!copy) {
    const reply = await send({ type: "TRANSLATE_INTERFACE", publicLanding: !signedIn, language, cacheRevision: 9, strings: baseCopy });
    copy = reply?.strings;
    if (copy) copyCache.set(cacheKey, copy);
  }
  if (request !== languageRequest) return;
  translationOverlay.classList.add("hidden");
  if (!copy) {
    languageSelect.value = selectedLanguage = "English";
    accountStatus.textContent = "My Helper could not change language right now. Please try again.";
    return;
  }
  applyCopy({ ...baseCopy, ...copy });
  await saveLanguage(language);
}

async function renderAccount() {
  const data = await send({ type: "ACCOUNT_STATUS" });
  signedIn = Boolean(data.signedIn);
  updateSupportAvailability();
  if (signedIn) {
    accountAction.textContent = "Sign out";
    accountAction.dataset.mode = "signout";
    accountStatus.textContent = `Signed in as ${data.email || "your Google account"}`;
    accountDescription.textContent = "Your My Helper preferences and learning progress are synchronized privately to this account.";
    return;
  }
  accountAction.innerHTML = '<img src="assets/google-g-logo.svg" alt=""><span>Sign in with Google</span>';
  accountAction.dataset.mode = "signin";
  accountStatus.textContent = "Not signed in";
  accountDescription.textContent = "Sign in to unlock My Helper on ChatGPT, choose your language, save learning progress, and contact support privately.";
}

function confirmDeletion() {
  return new Promise((resolve) => {
    if (typeof deleteDialog.showModal !== "function") return resolve(false);
    const close = () => resolve(deleteDialog.returnValue === "delete");
    deleteDialog.addEventListener("close", close, { once: true });
    deleteDialog.showModal();
    cancelDelete.focus();
  });
}

accountAction.addEventListener("click", async () => {
  accountAction.disabled = true;
  if (accountAction.dataset.mode === "signout") {
    await send({ type: "SIGN_OUT" });
  } else {
    accountStatus.textContent = "Opening Google sign-in...";
    const reply = await send({ type: "SIGN_IN" });
    if (reply.error) accountStatus.textContent = reply.error === "The user did not approve access." ? "Sign-in was cancelled." : reply.error;
  }
  accountAction.disabled = false;
  await renderAccount();
});

languageSelect.innerHTML = languages.map((language) => `<option value="${language}">${language}</option>`).join("");
languageSelect.addEventListener("change", () => void applyLanguage(languageSelect.value));

supportMessage.addEventListener("input", () => { supportReceipt.hidden = true; });
supportForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!signedIn) return;
  const message = supportMessage.value.trim();
  if (message.length < 10) {
    supportStatus.textContent = "Please describe the issue in at least a few words.";
    return;
  }
  supportSubmit.disabled = true;
  supportReceipt.hidden = true;
  supportStatus.textContent = "Sending your message...";
  const reply = await send({ type: "CREATE_SUPPORT_REQUEST", category: document.querySelector("#supportCategory").value, message });
  supportSubmit.disabled = false;
  if (reply.error) {
    supportStatus.textContent = reply.error;
    return;
  }
  supportMessage.value = "";
  supportStatus.textContent = "";
  supportReceipt.hidden = false;
});

deleteAccount.addEventListener("click", async () => {
  if (!signedIn || !(await confirmDeletion())) return;
  deleteAccount.disabled = true;
  const reply = await send({ type: "DELETE_MY_ACCOUNT", confirm: true });
  deleteAccount.disabled = false;
  if (reply.error) {
    accountStatus.textContent = reply.error;
    return;
  }
  accountStatus.textContent = "Your My Helper account was deleted.";
  await renderAccount();
});

document.querySelectorAll(".official-logo").forEach((image) => {
  image.addEventListener("error", () => {
    image.hidden = true;
    const fallback = image.parentElement.querySelector(".logo-fallback");
    if (fallback) fallback.hidden = false;
  });
});

chrome.storage.local.get("myHelperPrefs", ({ myHelperPrefs }) => {
  selectedLanguage = String(myHelperPrefs?.language || "English");
  languageSelect.value = languages.includes(selectedLanguage) ? selectedLanguage : "English";
});

renderAccount();
