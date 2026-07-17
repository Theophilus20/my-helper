const status = document.querySelector("#status");
function check() {
  status.textContent = "Checking your My Helper coach…";
  chrome.runtime.sendMessage({ type: "CHECK_SERVER" }, (data) => {
    if (chrome.runtime.lastError) { status.textContent = "My Helper is offline. Check the install guide."; return; }
    status.textContent = data.ready ? "Coach ready. Refresh ChatGPT if needed." : "Coach is offline. Check the install guide.";
  });
}
document.querySelector("#check").addEventListener("click", check);
check();
