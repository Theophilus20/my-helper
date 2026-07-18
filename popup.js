const status = document.querySelector("#status");
const accountStatus = document.querySelector("#accountStatus");
const accountAction = document.querySelector("#accountAction");

function send(message) {
  return new Promise((resolve) => {
    try {
      chrome.runtime.sendMessage(message, (reply) => resolve(chrome.runtime.lastError ? { error: chrome.runtime.lastError.message } : (reply || {})));
    } catch (error) { resolve({ error: error.message }); }
  });
}

async function check() {
  status.textContent = "Checking your My Helper coach…";
  const data = await send({ type: "CHECK_SERVER" });
  status.textContent = data.ready ? "Coach ready." : "Coach is offline. Check the install guide.";
}

async function showAccount() {
  const data = await send({ type: "ACCOUNT_STATUS" });
  if (data.signedIn) {
    accountStatus.textContent = `Signed in as ${data.email || "your Google account"}`;
    accountAction.textContent = "Sign out";
    accountAction.dataset.mode = "signout";
    return;
  }
  accountStatus.textContent = "Sign in required";
  accountAction.innerHTML = '<img class="google-g" src="assets/google-g-logo.svg" alt=""><span>Sign in with Google</span>';
  accountAction.dataset.mode = "signin";
}

accountAction.addEventListener("click", async () => {
  accountAction.disabled = true;
  if (accountAction.dataset.mode === "signout") await send({ type: "SIGN_OUT" });
  else {
    accountStatus.textContent = "Opening Google sign-in…";
    const reply = await send({ type: "SIGN_IN" });
    if (reply.error) accountStatus.textContent = reply.error;
  }
  accountAction.disabled = false;
  await showAccount();
});

document.querySelector("#openDashboard").addEventListener("click", () => send({ type: "OPEN_ACCOUNT_HUB" }));
document.querySelector("#check").addEventListener("click", check);
check();
showAccount();
