(() => {
  const host = document.getElementById("my-helper-extension");
  const shadow = host?.shadowRoot;
  if (!host || !shadow || shadow.getElementById("myHelperAccountGate")) return;

  const panel = shadow.getElementById("panel");
  const launcher = shadow.getElementById("launcher");
  const voiceLauncher = shadow.getElementById("voice-launcher");
  if (!panel || !launcher) return;

  const googleLogo = chrome.runtime.getURL("assets/google-g-logo.svg");
  const helperLogo = chrome.runtime.getURL("assets/icon-128.png");
  const style = document.createElement("style");
  style.textContent = `
    :host(.my-helper-account-locked) #tip,:host(.my-helper-account-locked) #voice-launcher{display:none!important}
    #panel.my-helper-account-locked .top,#panel.my-helper-account-locked .nav,#panel.my-helper-account-locked main,#panel.my-helper-account-locked .privacy{display:none!important}
    #myHelperAccountGate{position:relative;display:none;padding:28px 22px;background:#fffaf0;text-align:center}
    #panel.my-helper-account-locked #myHelperAccountGate{display:block}
    .mh-gate-logo{width:62px;height:62px;border-radius:50%;background:#152017;object-fit:contain}
    #myHelperAccountGate h2{margin:14px 0 8px;font:800 25px/1 Arial,sans-serif;letter-spacing:-1px}
    #myHelperAccountGate p{margin:0 auto 18px;max-width:290px;color:#3f4a40;font:13px/1.5 Arial,sans-serif}
    #mhGateSignIn{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;min-height:46px;border:1px solid #747775;border-radius:4px;background:#fff;color:#1f1f1f;font:500 14px/20px Arial,sans-serif;cursor:pointer}
    #mhGateSignIn img{width:18px;height:18px}#mhGateSignIn:disabled{opacity:.7;cursor:wait}
    #mhGateStatus{min-height:19px;margin:12px 0 0;color:#3f4a40;font:11px/1.4 Arial,sans-serif}
    #mhGateClose{position:absolute;top:10px;right:10px;width:32px;height:32px;border:0;background:transparent;color:#152017;font:700 24px/1 Arial,sans-serif;cursor:pointer}
  `;
  shadow.append(style);

  const gate = document.createElement("section");
  gate.id = "myHelperAccountGate";
  gate.innerHTML = `<button id="mhGateClose" type="button" aria-label="Close sign-in message">&times;</button><img class="mh-gate-logo" src="${helperLogo}" alt="My Helper"><h2 id="mhGateTitle">Sign in to use My Helper</h2><p id="mhGateDescription">Sign in with Google to unlock your personal AI coach for ChatGPT and Codex.</p><button id="mhGateSignIn" type="button"><img src="${googleLogo}" alt=""><span id="mhGateSignInLabel">Sign in with Google</span></button><p id="mhGateStatus" aria-live="polite"></p>`;
  panel.prepend(gate);

  const signInButton = gate.querySelector("#mhGateSignIn");
  const closeButton = gate.querySelector("#mhGateClose");
  const status = gate.querySelector("#mhGateStatus");
  let locked = true;
  let launcherPointer = null;
  let suppressLauncherClick = false;
  const gateCopy = {
    title: "Sign in to use My Helper",
    description: "Sign in with Google to unlock your personal AI coach for ChatGPT and Codex.",
    signIn: "Sign in with Google",
    signInRequired: "Sign in with Google to continue.",
    opening: "Opening Google sign-in...",
    cancelled: "Sign-in was cancelled.",
    failed: "Google sign-in could not start."
  };

  function applyGateCopy(copy) {
    Object.assign(gateCopy, copy);
    gate.querySelector("#mhGateTitle").textContent = copy.title || gateCopy.title;
    gate.querySelector("#mhGateDescription").textContent = copy.description || gateCopy.description;
    gate.querySelector("#mhGateSignInLabel").textContent = copy.signIn || gateCopy.signIn;
  }

  function loadGateLanguage() {
    chrome.storage.local.get(["myHelperPrefs", "myHelperLandingTranslations"], (stored) => {
      const language = String(stored.myHelperPrefs?.language || "English");
      if (language === "English") return;
      const cacheKey = `gate-v1:${language}`;
      const cached = stored.myHelperLandingTranslations?.[cacheKey];
      if (cached) return applyGateCopy(cached);
      chrome.runtime.sendMessage({ type: "TRANSLATE_INTERFACE", publicLanding: true, language, cacheRevision: 1, strings: gateCopy }, (reply) => {
        if (chrome.runtime.lastError || !reply?.strings) return;
        applyGateCopy(reply.strings);
        chrome.storage.local.set({ myHelperLandingTranslations: { ...(stored.myHelperLandingTranslations || {}), [cacheKey]: reply.strings } });
      });
    });
  }

  function applyLock(nextLocked) {
    locked = nextLocked;
    host.classList.toggle("my-helper-account-locked", locked);
    panel.classList.toggle("my-helper-account-locked", locked);
    if (locked) {
      shadow.getElementById("tip")?.classList.add("hidden");
      if (panel.classList.contains("open")) status.textContent = gateCopy.signInRequired;
    }
  }

  function openGate() {
    applyLock(true);
    panel.classList.add("open");
  }

  function closeGate() {
    panel.classList.remove("open");
    // The full sign-in gate can be clamped into view while open. Ask the main
    // overlay to return to the saved small-bubble position when it closes.
    shadow.dispatchEvent(new CustomEvent("my-helper:restore-launcher-position"));
    status.textContent = "";
  }

  function accountStatus() {
    chrome.runtime.sendMessage({ type: "ACCOUNT_STATUS" }, (reply) => {
      if (chrome.runtime.lastError) return applyLock(true);
      applyLock(!reply?.signedIn);
    });
  }

  launcher.addEventListener("pointerdown", (event) => {
    if (!locked || event.button !== 0) return;
    launcherPointer = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, moved: false };
  }, true);

  launcher.addEventListener("pointermove", (event) => {
    if (!launcherPointer || launcherPointer.pointerId !== event.pointerId) return;
    if (Math.hypot(event.clientX - launcherPointer.startX, event.clientY - launcherPointer.startY) >= 6) {
      launcherPointer.moved = true;
    }
  }, true);

  const finishLauncherPointer = (event) => {
    if (!launcherPointer || launcherPointer.pointerId !== event.pointerId) return;
    if (launcherPointer.moved) {
      suppressLauncherClick = true;
      setTimeout(() => { suppressLauncherClick = false; }, 400);
    }
    launcherPointer = null;
  };
  launcher.addEventListener("pointerup", finishLauncherPointer, true);
  launcher.addEventListener("pointercancel", finishLauncherPointer, true);

  shadow.addEventListener("click", (event) => {
    if (!locked) return;
    const path = event.composedPath();
    if (!path.includes(launcher) && !path.includes(voiceLauncher)) return;
    if (path.includes(launcher) && suppressLauncherClick) {
      suppressLauncherClick = false;
      event.preventDefault();
      event.stopImmediatePropagation();
      return;
    }
    event.preventDefault();
    event.stopImmediatePropagation();
    openGate();
  }, true);

  signInButton.addEventListener("click", () => {
    signInButton.disabled = true;
    status.textContent = gateCopy.opening;
    chrome.runtime.sendMessage({ type: "SIGN_IN" }, (reply) => {
      signInButton.disabled = false;
      if (chrome.runtime.lastError || reply?.error) {
        status.textContent = reply?.error === "The user did not approve access."
          ? gateCopy.cancelled
          : (reply?.error || gateCopy.failed);
        return;
      }
      applyLock(false);
      status.textContent = "";
    });
  });

  closeButton.addEventListener("click", () => {
    closeGate();
  });

  new MutationObserver(() => {
    if (locked && panel.classList.contains("open")) applyLock(true);
  }).observe(panel, { attributes: true, attributeFilter: ["class"] });

  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === "MY_HELPER_ACCOUNT_CHANGED") accountStatus();
  });

  applyLock(true);
  loadGateLanguage();
  accountStatus();
})();
