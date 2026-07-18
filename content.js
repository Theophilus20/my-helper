(() => {
  if (document.getElementById("my-helper-extension")) return;

  const host = document.createElement("div");
  host.id = "my-helper-extension";
  host.style.cssText = "position:fixed;right:22px;bottom:22px;z-index:2147483647;";
  document.documentElement.append(host);
  ["click", "pointerdown", "pointerup", "mousedown", "mouseup", "keydown", "keyup"].forEach((type) => host.addEventListener(type, (event) => event.stopPropagation()));
  const shadow = host.attachShadow({ mode: "open" });

  const svg = (body) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
  const icons = {
    book: svg('<path d="M4 19a3 3 0 0 1 3-3h13"/><path d="M7 3h13v18H7a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3Z"/>'),
    spark: svg('<path d="m12 2 1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8L12 2Z"/><path d="m19 15 .7 2.3L22 18l-2.3.7L19 21l-.7-2.3L16 18l2.3-.7L19 15Z"/>'),
    mic: svg('<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10a7 7 0 0 0 14 0M12 17v4M8 21h8"/>'),
    speaker: svg('<path d="m11 5-5 4H3v6h3l5 4V5Z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 5.5a9 9 0 0 1 0 13"/>'),
    code: svg('<path d="m8 9-4 3 4 3M16 9l4 3-4 3M14 5l-4 14"/>'),
    build: svg('<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M8 12h8M12 8v8"/>'),
    guide: svg('<circle cx="12" cy="12" r="9"/><path d="m15 9-2.5 5L9 15l2.5-5L15 9Z"/>'),
    heart: svg('<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.9-8.6a5.5 5.5 0 0 0-.1-7.8Z"/>'),
    chart: svg('<path d="M3 3v18h18M7 15l4-4 3 2 5-6"/>'),
    settings: svg('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.8 1.8 0 0 0 .4 2l.1.1-2.3 2.3-.1-.1a1.8 1.8 0 0 0-2-.4 1.8 1.8 0 0 0-1.1 1.6v.2h-3.2v-.2A1.8 1.8 0 0 0 10.1 19a1.8 1.8 0 0 0-2 .4l-.1.1-2.3-2.3.1-.1a1.8 1.8 0 0 0 .4-2 1.8 1.8 0 0 0-1.6-1.1h-.2v-3.2h.2A1.8 1.8 0 0 0 6.2 9.7a1.8 1.8 0 0 0-.4-2l-.1-.1L8 5.3l.1.1a1.8 1.8 0 0 0 2 .4 1.8 1.8 0 0 0 1.1-1.6v-.2h3.2v.2a1.8 1.8 0 0 0 1.1 1.6 1.8 1.8 0 0 0 2-.4l.1-.1 2.3 2.3-.1.1a1.8 1.8 0 0 0-.4 2 1.8 1.8 0 0 0 1.6 1.1h.2V14h-.2a1.8 1.8 0 0 0-1.6 1Z"/>'),
    eye: svg('<path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="2.5"/>'),
    arrow: svg('<path d="M5 12h14M13 6l6 6-6 6"/>'),
    close: svg('<path d="m6 6 12 12M18 6 6 18"/>'),
    check: svg('<path d="m5 12 4 4L19 6"/>')
  };
  const logo = `<span class="brand-mark"><img src="${chrome.runtime.getURL("assets/icon-128.png")}" alt="" /></span>`;
  const languageOptions = ["English", "Spanish", "French", "German", "Italian", "Portuguese", "Dutch", "Polish", "Turkish", "Arabic", "Hindi", "Bengali", "Japanese", "Korean", "Simplified Chinese", "Traditional Chinese", "Vietnamese", "Thai", "Indonesian", "Malay", "Russian", "Ukrainian", "Swahili", "Igbo", "Hausa", "Yoruba"];
  const options = languageOptions.map((name) => `<option>${name}</option>`).join("");

  shadow.innerHTML = `
    <style>
      :host{all:initial}*{box-sizing:border-box}svg{display:block;width:16px;height:16px;flex:0 0 auto}button,input,select,textarea{font:inherit;color:#182019!important;-webkit-text-fill-color:#182019!important}button{cursor:pointer}.hidden{display:none!important}
      #dock{display:flex;justify-content:flex-end;gap:9px;align-items:center}#launcher,#voice-launcher{border:2px solid #152017;box-shadow:4px 4px 0 #152017;transition:.15s;color:#152017}#launcher:hover,#voice-launcher:hover{transform:translate(-2px,-2px);box-shadow:6px 6px 0 #152017}#launcher{display:flex;align-items:center;gap:9px;background:#fffaf0;padding:7px 13px 7px 7px;font:700 12px/1 Arial,sans-serif}#voice-launcher{display:grid;place-items:center;width:42px;height:42px;background:#ffc947}#voice-launcher svg{width:21px;height:21px}.brand-mark{display:grid;place-items:center;width:32px;height:32px;flex:0 0 32px;border-radius:50%;overflow:hidden;background:transparent;padding:0}.brand-mark img{display:block;width:32px;height:32px;max-width:32px;max-height:32px;object-fit:contain}#panel .brand-mark{width:42px;height:42px;flex-basis:42px;padding:0}#panel .brand-mark img{width:42px;height:42px;max-width:42px;max-height:42px;object-fit:contain}
      #tip{position:fixed;right:12px;bottom:72px;width:min(300px,calc(100vw - 24px));max-width:calc(100vw - 24px);max-height:calc(100vh - 96px);margin:0;border:2px solid #152017;background:#ffc947;box-shadow:4px 4px 0 #152017;padding:10px;color:#152017;font:12px/1.35 Arial,sans-serif;overflow-x:hidden;overflow-y:auto;overflow-wrap:anywhere;z-index:2147483647}#tip b{display:block;margin-bottom:4px;font-size:11px}#tip div{display:flex;flex-wrap:wrap;gap:7px;margin-top:8px}#tip div .mini-button{flex:1;min-width:0}.mini-button{border:1.5px solid #152017;background:#fffaf0;padding:6px 8px;color:#152017;font-size:10px;font-weight:700}
      #panel{display:none;width:420px;max-height:calc(100vh - 94px);overflow:auto;margin-bottom:14px;border:3px solid #152017;background:#fffaf0;color:#152017;box-shadow:8px 8px 0 #152017;font-family:Arial,sans-serif}#panel.open{display:block}#panel.open~#dock{display:none}.top{display:flex;align-items:center;gap:10px;padding:14px;background:#b8dfc5;border-bottom:2px solid #152017}.top h1{margin:0;font-size:16px;letter-spacing:-.4px}.top p{margin:2px 0 0;font:10px monospace;letter-spacing:.06em}.live{display:flex;align-items:center;gap:5px;margin-left:auto;border:1.5px solid #152017;background:#fffaf0;padding:5px 7px;font:9px monospace}.live i{width:7px;height:7px;border:1px solid #152017;border-radius:50%;background:#58bf81}.close{border:0;background:transparent;width:26px;height:26px;padding:4px}.close svg{width:18px;height:18px}.nav{display:grid;grid-template-columns:repeat(4,1fr);border-bottom:2px solid #152017;background:#fff}.nav button{display:grid;gap:3px;place-items:center;border:0;border-right:1.5px solid #152017;background:#fff;padding:8px 3px;color:#152017;font-size:9px;font-weight:700}.nav button:last-child{border-right:0}.nav button.active,.nav button:hover{background:#ffc947}.nav svg{width:16px;height:16px}.view{padding:16px}.screen-chip{display:inline-flex;align-items:center;gap:5px;margin-bottom:10px;border:1.5px solid #152017;background:#ddc8ff;padding:4px 6px;font:10px monospace}.screen-chip svg{width:12px;height:12px}.eyebrow{margin:0 0 7px;font:10px monospace;letter-spacing:.07em}.view h2{margin:0 0 8px;font-size:28px;line-height:.98;letter-spacing:-1.4px}.intro{margin:0 0 13px;color:#3f4a40;font-size:13px;line-height:1.45}.quick-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}.quick{display:flex;align-items:flex-start;gap:8px;min-height:70px;border:2px solid #152017;background:#fff;padding:9px;color:#152017;text-align:left;font-size:11px;font-weight:700}.quick:hover{background:#ffc947}.quick svg{width:20px;height:20px}.primary{display:flex;align-items:center;justify-content:center;gap:7px;width:100%;border:2px solid #152017;background:#ff976f;padding:11px;color:#152017;font-size:12px;font-weight:700}.primary:hover{background:#ffc947}.primary:disabled{opacity:.65;cursor:wait}.primary svg{width:17px;height:17px}.card{margin-top:12px;border:2px solid #152017;background:#ddc8ff;padding:11px}.card h3{margin:0 0 6px;font-size:13px}.card p{margin:0;font-size:11px;line-height:1.4}.back{display:inline-flex;align-items:center;gap:5px;border:1.5px solid #152017;background:#fff;padding:5px 7px;color:#152017;font-size:10px;font-weight:700}.back svg{width:13px;height:13px;transform:rotate(180deg)}textarea{display:block;width:100%;min-height:94px;resize:vertical;border:2px solid #152017;background:#fff!important;color:#152017!important;-webkit-text-fill-color:#152017!important;caret-color:#152017;padding:10px;font:13px/1.4 Arial,sans-serif}textarea::placeholder{color:#627064!important;-webkit-text-fill-color:#627064!important}textarea:focus,select:focus{outline:3px solid #ffc947;outline-offset:1px}.quality{display:grid;grid-template-columns:78px 1fr;gap:10px;align-items:center;margin:11px 0;border:1.5px solid #152017;background:#fff;padding:9px}.score{font-size:30px;font-weight:700;letter-spacing:-1.5px}.score small{font:10px monospace}.score-label{font:9px monospace}.metric-list{display:grid;gap:4px}.metric{display:flex;justify-content:space-between;gap:8px;font-size:10px}.stars{color:#dd623f;letter-spacing:1px}.controls{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:9px 0}.controls label{display:grid;gap:4px;font-size:10px;font-weight:700}select{width:100%;border:1.5px solid #152017;background:#fff!important;padding:6px;font-size:11px}.result{margin-top:13px;border-top:2px solid #152017;padding-top:12px}.result strong{font-size:13px}.prompt{margin:8px 0;border:1.5px solid #152017;background:#b8dfc5;padding:10px;white-space:pre-wrap;font-size:12px;line-height:1.4}.result-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.result-grid b{font-size:9px}.result-grid ul{margin:4px 0;padding-left:15px;font-size:10px;line-height:1.35}.result p{font-size:11px;line-height:1.4}.button-row{display:flex;gap:7px}.button-row .mini-button{flex:1}.error{border:1.5px solid #152017;background:#ffe0d5;padding:10px;font-size:11px;line-height:1.4}.lesson{border:2px solid #152017;background:#ffc947;padding:14px}.lesson h3{margin:0 0 7px;font-size:17px}.lesson p{margin:0;font-size:12px;line-height:1.45}.steps{display:grid;gap:7px;margin:11px 0 0;padding:0;list-style:none}.steps li{display:flex;gap:7px;font-size:11px;line-height:1.35}.step{display:grid;place-items:center;flex:0 0 auto;width:18px;height:18px;border:1.5px solid #152017;background:#fffaf0;font:10px monospace}.path{margin-top:12px;border:1.5px solid #152017;background:#fff;padding:10px}.path b{font-size:12px}.path div{margin-top:7px;font-size:10px;line-height:1.6}.bar{display:inline-block;width:10px;height:10px;border:1.5px solid #152017;background:#fff}.bar.done{background:#58bf81}.bar.now{background:#ffc947}.skill-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}.skill{border:2px solid #152017;background:#fff;padding:10px}.skill:nth-child(2){background:#b8dfc5}.skill:nth-child(3){background:#ddc8ff}.skill:nth-child(4){background:#ffc947}.skill b{display:block;font-size:21px;letter-spacing:-1px}.skill span{font-size:10px}.achievements{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:12px}.achievement{display:flex;align-items:center;gap:6px;border:1.5px solid #152017;background:#fff;padding:8px;font-size:10px;font-weight:700}.achievement.locked{opacity:.48}.achievement svg{width:16px;height:16px;color:#d95b3a}.setting{margin-bottom:10px;border:2px solid #152017;background:#fff;padding:11px}.setting h3{display:flex;align-items:center;gap:6px;margin:0 0 7px;font-size:13px}.setting h3 svg{width:16px;height:16px}.setting p{margin:0 0 9px;font-size:10px;line-height:1.4}.toggle-row{display:flex;align-items:center;justify-content:space-between;gap:8px;margin:8px 0;font-size:11px}.toggle{position:relative;width:36px;height:20px}.toggle input{position:absolute;opacity:0}.toggle i{position:absolute;inset:0;border:1.5px solid #152017;background:#fff;cursor:pointer}.toggle i:before{position:absolute;top:2px;left:3px;width:12px;height:12px;border:1.5px solid #152017;background:#fffaf0;content:"";transition:.15s}.toggle input:checked+i{background:#b8dfc5}.toggle input:checked+i:before{transform:translateX(14px);background:#152017}.voice-note{border:1.5px solid #152017;background:#ddc8ff;padding:9px;font-size:10px;line-height:1.4}.privacy{margin:0 16px 16px;border:1.5px solid #152017;background:#ddc8ff;padding:8px;font-size:10px;line-height:1.4}.privacy svg{display:inline-block;width:13px;height:13px;vertical-align:middle}.large-text #panel{font-size:118%}.high-contrast #panel,.high-contrast .quick,.high-contrast .skill,.high-contrast .setting,.high-contrast textarea{background:#fff!important;color:#000!important}.high-contrast .top,.high-contrast .lesson,.high-contrast .card{background:#fff!important}@media(max-width:500px){#panel{width:calc(100vw - 28px)}#launcher span:last-child{display:none}}
    </style>
    <div id="tip" class="hidden"><b data-i18n="tipTitle">Review your draft</b><span id="tipText" data-i18n="tipText">Select Coach this to review the exact words you wrote before sending them.</span><div><button id="tipAccept" class="mini-button" data-i18n="coachThis">Coach this</button><button id="tipDismiss" class="mini-button" data-i18n="dismiss">Dismiss</button></div></div>
    <section id="panel" aria-label="My Helper">
      <header class="top">${logo}<div><h1>MY HELPER</h1><p data-i18n="tagline">YOUR PERSONAL AI COACH</p></div><span class="live"><i></i><span data-i18n="active">ACTIVE</span></span><button class="close" aria-label="Close">${icons.close}</button></header>
      <nav class="nav"><button data-view="home" class="active">${icons.spark}<span data-i18n="navCoach">Coach</span></button><button data-view="learn">${icons.book}<span data-i18n="navLearn">Learn</span></button><button data-view="progress">${icons.chart}<span data-i18n="navProgress">Progress</span></button><button data-view="settings">${icons.settings}<span data-i18n="navSettings">Settings</span></button></nav>
      <main>
        <section class="view" data-section="home"><span class="screen-chip">${icons.eye}<span id="screenName">CHATGPT</span></span><p class="eyebrow" data-i18n="screenAware">SCREEN-AWARE COACHING</p><h2><span data-i18n="hello">Hello</span>!<br><span data-i18n="howCanHelp">How can I help?</span></h2><p class="intro" data-i18n="homeIntro">I help you learn while you work without interrupting your ChatGPT conversation.</p><div class="quick-grid"><button class="quick" data-action="improve">${icons.spark}<span data-i18n="improvePrompt">Improve prompt</span></button><button class="quick" data-action="learn-chatgpt">${icons.book}<span data-i18n="learnChatgpt">Learn ChatGPT</span></button><button class="quick" data-action="learn-codex">${icons.code}<span data-i18n="learnCodex">Learn Codex</span></button><button class="quick" data-action="build">${icons.build}<span data-i18n="buildSomething">Build something</span></button><button class="quick" data-action="explain">${icons.guide}<span data-i18n="explainPage">Explain this page</span></button><button class="quick" data-action="coach">${icons.heart}<span data-i18n="coachMe">Coach me</span></button></div><button class="primary" data-action="voice">${icons.mic}<span data-i18n="startVoice">Start voice coach</span></button><div id="voiceResponse" class="result hidden" aria-live="polite"></div><div class="card"><h3 data-i18n="smartOverlay">Smart overlay</h3><p data-i18n="smartText">My Helper notices short unsent drafts locally and offers a small tip. Nothing leaves this device unless you ask for coaching.</p></div></section>
        <section class="view hidden" data-section="coach"><button class="back" data-back>${icons.arrow}<span data-i18n="back">Back</span></button><p class="eyebrow" style="margin-top:11px" data-i18n="promptCoach">LIVE PROMPT COACH</p><h2 data-i18n="closeTitle">You’re close.</h2><p class="intro" data-i18n="coachIntro">Add a few details and your next answer can become more useful.</p><textarea id="draft" data-i18n-placeholder="promptPlaceholder" placeholder="Write or paste a prompt here..."></textarea><div class="quality"><div><div class="score"><span id="score">0</span><small>%</small></div><div class="score-label" data-i18n="promptQuality">PROMPT QUALITY</div></div><div class="metric-list"><div class="metric"><span data-i18n="specificity">Specificity</span><span id="specificity" class="stars">☆☆☆☆☆</span></div><div class="metric"><span data-i18n="context">Context</span><span id="contextScore" class="stars">☆☆☆☆☆</span></div><div class="metric"><span data-i18n="goal">Goal</span><span id="goalScore" class="stars">☆☆☆☆☆</span></div><div class="metric"><span data-i18n="constraints">Constraints</span><span id="constraintScore" class="stars">☆☆☆☆☆</span></div></div></div><div class="controls"><label><span data-i18n="coachStyle">Coaching style</span><select id="coachStyle"><option value="friendly" data-i18n="styleFriendly">Friendly</option><option value="professional" data-i18n="styleProfessional">Professional</option><option value="teacher" data-i18n="styleTeacher">Teacher</option><option value="mentor" data-i18n="styleMentor">Mentor</option><option value="parent" data-i18n="styleParent">Parent</option><option value="developer" data-i18n="styleDeveloper">Developer</option><option value="student" data-i18n="styleStudent">Student</option></select></label><label><span data-i18n="language">Language</span><select id="language">${options}</select></label></div><button id="coachButton" class="primary">${icons.spark}<span data-i18n="coachThisPrompt">Coach this prompt</span></button><div id="result" class="result hidden" aria-live="polite"></div></section>
        <section class="view hidden" data-section="learn"><p class="eyebrow" data-i18n="learningPath">GUIDED LEARNING PATH</p><h2 id="lessonTitle">Start small. Build confidence.</h2><div id="lessonCard" class="lesson"></div><div class="path"><b data-i18n="beginner">Level 1 · Beginner</b><div><span class="bar done"></span> <span data-i18n="whatIsAi">What is AI</span><br><span class="bar now"></span> <span data-i18n="prompts">How prompts work</span><br><span class="bar"></span> <span data-i18n="memory">Memory & reasoning</span><br><span class="bar"></span> <span data-i18n="projects">Projects & Codex</span><br><span class="bar"></span> <span data-i18n="agents">Automation & agents</span></div></div><button id="lessonCTA" class="primary" style="margin-top:11px">${icons.spark}<span data-i18n="tryCoach">Try this in the prompt coach</span></button></section>
        <section class="view hidden" data-section="progress"><p class="eyebrow" data-i18n="dashboard">YOUR LEARNING DASHBOARD</p><h2 data-i18n="yourProgress">Your progress</h2><p class="intro" data-i18n="progressIntro">Your score grows only after you finish a lesson or use a coaching tool.</p><div class="skill-grid"><div class="skill"><b id="promptSkill">0%</b><span data-i18n="promptSkills">Prompt skills</span></div><div class="skill"><b id="chatgptSkill">0%</b><span>ChatGPT</span></div><div class="skill"><b id="codexSkill">0%</b><span>Codex</span></div><div class="skill"><b id="automationSkill">0%</b><span data-i18n="automation">Automation</span></div></div><div class="achievements"><div id="achievementPrompt" class="achievement locked">${icons.check}<span data-i18n="firstPrompt">First coached prompt</span></div><div id="achievementChatgpt" class="achievement locked">${icons.build}<span data-i18n="firstApp">First ChatGPT lesson</span></div><div id="achievementCodex" class="achievement locked">${icons.code}<span data-i18n="firstApi">First Codex lesson</span></div><div id="achievementAutomation" class="achievement locked">${icons.chart}<span data-i18n="gitMaster">Automation explorer</span></div></div></section>
        <section class="view hidden" data-section="settings"><p class="eyebrow" data-i18n="preferences">ACCESSIBILITY & PREFERENCES</p><h2 data-i18n="makeYours">Make My Helper yours.</h2><div class="setting"><h3>${icons.speaker}<span data-i18n="voiceCoach">Voice coach</span></h3><p data-i18n="voiceInfo">Choose an installed voice. My Helper will speak lessons, explanations, and answers in your selected language.</p><label style="display:grid;gap:4px;font-size:10px;font-weight:700"><span data-i18n="textLanguage">Text language</span><select id="textLanguage">${options}</select></label><div class="controls"><label><span data-i18n="voiceLanguage">Voice language</span><select id="voiceLanguage">${options}</select></label><label><span data-i18n="voicePreference">Voice preference</span><select id="voiceStyle"><option value="natural" data-i18n="voiceNatural">Natural</option><option value="feminine" data-i18n="voiceFeminine">Feminine preference</option><option value="masculine" data-i18n="voiceMasculine">Masculine preference</option></select></label></div><label style="display:grid;gap:4px;font-size:10px;font-weight:700"><span data-i18n="installedVoice">Installed voice</span><select id="voiceSelect"><option value="">Choose a voice</option></select></label><button id="voiceTest" class="mini-button" style="margin-top:9px">${icons.speaker}<span data-i18n="testVoice">Test voice</span></button><p id="voiceStatus" style="margin:8px 0 0;font-size:10px"></p></div><div class="setting"><h3 data-i18n="accessibility">Accessibility</h3><div class="toggle-row"><span data-i18n="localTips">Local smart prompt tips</span><label class="toggle"><input id="autoTips" type="checkbox" checked><i></i></label></div><div class="toggle-row"><span data-i18n="largeText">Large text</span><label class="toggle"><input id="largeText" type="checkbox"><i></i></label></div><div class="toggle-row"><span data-i18n="highContrast">High contrast</span><label class="toggle"><input id="highContrast" type="checkbox"><i></i></label></div></div><div class="voice-note"><b data-i18n="privateMemory">Private memory:</b> <span data-i18n="privateText">My Helper saves only your preferences and progress in this browser.</span></div></section>
      </main>
      <div class="privacy">${icons.eye}<span data-i18n="privacy">My Helper is a separate coaching overlay. It sends only a prompt you explicitly ask it to coach.</span></div>
    </section>
    <div id="dock"><button id="voice-launcher" aria-label="Start voice command">${icons.mic}</button><button id="launcher" aria-label="Open My Helper">${logo}<span data-i18n="needHelp">Need help?</span></button></div>
  `;

  shadow.querySelector('[data-section="learn"]').innerHTML = `
    <p id="guideEyebrow" class="eyebrow">PERSONAL AI GUIDE</p>
    <h2 id="guideTitle">Learn with My Helper.</h2>
    <p class="intro" id="guideIntro">My Helper will ask one small question, listen to your answer, and guide your next step.</p>
    <div id="guideCard" class="lesson"><h3 id="guideReadyTitle">Ready when you are.</h3><p id="guideReadyText">Choose a topic from the Coach screen, or start a lesson here.</p></div>
    <label id="guideLabel" class="guide-label" for="guideReply">Your answer</label>
    <textarea id="guideReply" placeholder="Tell My Helper what you want to learn or build."></textarea>
    <button id="guideNext" class="primary">Start my AI guide</button>
    <button id="guideVoice" class="mini-button" style="margin-top:9px">Talk to My Helper</button>
  `;
  shadow.querySelector('main').insertAdjacentHTML('beforeend', `
    <section class="view hidden" data-section="explain">
      <p id="pageGuideEyebrow" class="eyebrow">PAGE GUIDE</p>
      <h2 id="explainTitle">Let me read this page.</h2>
      <p id="explainIntro" class="intro">I will explain the controls currently visible on this screen.</p>
      <div id="explainCard" class="lesson" aria-live="polite"></div>
      <div id="explainAnswer" class="card hidden" aria-live="polite"></div>
      <div id="explainActions" class="button-row" style="margin-top:10px;flex-wrap:wrap"></div>
      <button id="explainVoice" class="primary" style="margin-top:11px">Ask a question about this page</button>
      <button id="moreControls" class="mini-button hidden" style="margin-top:9px"></button>
      <div id="allControls" class="card hidden" aria-live="polite"></div>
    </section>
  `);
  shadow.querySelector('#voice-launcher').remove();
  shadow.querySelector('[data-action="voice"]').remove();
  shadow.querySelector('#voiceStatus').closest('.setting').insertAdjacentHTML('beforeend', `
    <div class="voice-activation"><b>Spoken replies</b><p>Turn this off when you want My Helper to show answers without speaking them.</p><div class="toggle-row"><span id="speechEnabledLabel">Coach voice is on</span><label class="toggle"><input id="speechEnabled" type="checkbox" checked><i></i></label></div></div>
    <div class="voice-activation"><b>Voice activation</b><p>Turn this on once, allow the microphone, then say “Open My Helper” or “I need help.”</p><div class="toggle-row"><span id="voiceActivationLabel">Voice activation is off</span><label class="toggle"><input id="voiceActivation" type="checkbox"><i></i></label></div></div>
    <div class="voice-activation"><b>Visual page analysis</b><p>When you press Explain this page, My Helper can send one temporary image of the visible browser tab to your selected OpenRouter vision model. It may include anything visible in that tab. The image is not saved, and the live page map still chooses the exact highlight.</p><div class="toggle-row"><span id="visualAnalysisLabel">Visual analysis is off</span><label class="toggle"><input id="visualAnalysis" type="checkbox"><i></i></label></div></div>
  `);
  shadow.querySelector('#voiceStatus').insertAdjacentHTML('beforebegin', '<p id="voiceAvailability" style="margin:8px 0 0;font-size:10px;line-height:1.4"></p>');
  shadow.querySelector('style').textContent += `
    #voice-launcher,.voice-start-hidden{display:none!important}#panel .brand-mark{width:54px;height:54px;padding:0}#panel .brand-mark img{width:100%;height:100%;object-fit:cover}.guide-label{display:block;margin:12px 0 5px;font-size:11px;font-weight:700}.voice-activation{margin-top:12px;border-top:1.5px solid #152017;padding-top:10px}.voice-activation b{font-size:12px}.voice-activation p{margin:5px 0 8px}.toggle input:focus+i{outline:3px solid #ffc947;outline-offset:2px}.result .button-row{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));align-items:stretch}.result .button-row .mini-button{display:flex;align-items:center;justify-content:center;gap:7px;min-height:56px;padding:8px;text-align:center;line-height:1.15;white-space:normal}.result .button-row .mini-button svg{width:18px;height:18px}#allControls{max-width:100%;overflow:hidden}#allControls .control-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;margin-top:8px}#allControls .mini-button{min-width:0;min-height:42px;overflow-wrap:anywhere;word-break:break-word;white-space:normal;text-align:left;line-height:1.2}.top{cursor:grab;touch-action:none}.top:active{cursor:grabbing}
    :host(.large-text) #panel{zoom:1.22}:host(.large-text) #panel textarea,:host(.large-text) #panel select{font-size:14px!important}:host(.high-contrast) #panel,:host(.high-contrast) #panel *{background:#000!important;color:#fff!important;border-color:#fff!important;-webkit-text-fill-color:#fff!important}:host(.high-contrast) #panel .nav button.active,:host(.high-contrast) #panel .primary,:host(.high-contrast) #panel .mini-button:hover{background:#fff!important;color:#000!important;-webkit-text-fill-color:#000!important}:host(.high-contrast) #panel .toggle input:checked+i:before{background:#fff!important}:host(.high-contrast) #panel .toggle i:before{background:#000!important}
  `;
  shadow.querySelector('style').textContent += `.toggle{display:inline-block;flex:0 0 36px;vertical-align:middle}.toggle i{display:block;line-height:0}.toggle i:before{top:50%;left:3px;transform:translateY(-50%)}.toggle input:checked+i:before{transform:translate(14px,-50%)}`;

  const $ = (selector) => shadow.querySelector(selector);
  const $$ = (selector) => [...shadow.querySelectorAll(selector)];
  const panel = $("#panel");
  const draft = $("#draft");
  const result = $("#result");
  const tip = $("#tip");
  let dragState = null;
  let launcherDragState = null;
  let launcherDragMoved = false;
  let closedLauncherPosition = null;
  let launcherSize = { width: 176, height: 48 };
  const dragSurface = $(".top");
  const launcher = $("#launcher");
  const extensionContextAvailable = () => {
    try { return typeof chrome !== "undefined" && Boolean(chrome.runtime?.id); } catch { return false; }
  };
  const safeStorageSet = (values) => {
    if (!extensionContextAvailable()) return;
    try {
      chrome.storage.local.set(values, () => { try { void chrome.runtime.lastError; } catch {} });
    } catch { /* Chrome reloaded the extension; the old page script should stop quietly. */ }
  };
  const safeStorageGet = (keys, callback) => {
    if (!extensionContextAvailable()) return;
    try {
      chrome.storage.local.get(keys, (values) => {
        try {
          if (!extensionContextAvailable() || chrome.runtime.lastError) return;
          callback(values || {});
        } catch { /* Old extension context. */ }
      });
    } catch { /* Old extension context. */ }
  };
  dragSurface.addEventListener("pointerdown", (event) => {
    if (event.button !== 0 || event.target.closest("button,input,select,textarea")) return;
    const rect = host.getBoundingClientRect();
    dragState = { pointerId: event.pointerId, offsetX: event.clientX - rect.left, offsetY: event.clientY - rect.top };
    host.style.left = `${rect.left}px`; host.style.top = `${rect.top}px`; host.style.right = "auto"; host.style.bottom = "auto";
    dragSurface.setPointerCapture(event.pointerId);
    event.preventDefault();
  });
  dragSurface.addEventListener("pointermove", (event) => {
    if (!dragState || dragState.pointerId !== event.pointerId) return;
    const rect = host.getBoundingClientRect();
    const left = Math.max(8, Math.min(window.innerWidth - rect.width - 8, event.clientX - dragState.offsetX));
    const top = Math.max(8, Math.min(window.innerHeight - rect.height - 8, event.clientY - dragState.offsetY));
    host.style.left = `${left}px`; host.style.top = `${top}px`;
    dragState.didMove = true;
  });
  const finishDrag = (event) => {
    if (!dragState || dragState.pointerId !== event.pointerId) return;
    const didMove = dragState.didMove;
    dragState = null;
    try { dragSurface.releasePointerCapture(event.pointerId); } catch {}
    // Dragging the full panel must not overwrite the launcher position that
    // was saved before opening it. Closing returns to that real dock point.
  };
  dragSurface.addEventListener("pointerup", finishDrag);
  dragSurface.addEventListener("pointercancel", finishDrag);
  launcher.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) return;
    const rect = host.getBoundingClientRect();
    launcherDragMoved = false;
    launcherDragState = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, offsetX: event.clientX - rect.left, offsetY: event.clientY - rect.top };
    launcher.setPointerCapture(event.pointerId);
  });
  launcher.addEventListener("pointermove", (event) => {
    if (!launcherDragState || launcherDragState.pointerId !== event.pointerId) return;
    if (!launcherDragMoved && Math.hypot(event.clientX - launcherDragState.startX, event.clientY - launcherDragState.startY) < 6) return;
    launcherDragMoved = true;
    const rect = host.getBoundingClientRect();
    const left = Math.max(8, Math.min(window.innerWidth - rect.width - 8, event.clientX - launcherDragState.offsetX));
    const top = Math.max(8, Math.min(window.innerHeight - rect.height - 8, event.clientY - launcherDragState.offsetY));
    host.style.left = `${left}px`; host.style.top = `${top}px`; host.style.right = "auto"; host.style.bottom = "auto";
    event.preventDefault();
  });
  const finishLauncherDrag = (event) => {
    if (!launcherDragState || launcherDragState.pointerId !== event.pointerId) return;
    launcherDragState = null;
    try { launcher.releasePointerCapture(event.pointerId); } catch {}
    if (launcherDragMoved) rememberClosedPosition();
  };
  launcher.addEventListener("pointerup", finishLauncherDrag);
  launcher.addEventListener("pointercancel", finishLauncherDrag);
  // A dragged launcher can be placed near an edge. Once its full panel opens,
  // move the whole overlay back into the visible viewport instead of leaving
  // part of the coach below or beside the screen.
  const keepPanelOnScreen = () => {
    if (!panel.classList.contains("open")) return;
    const rect = host.getBoundingClientRect();
    const pad = 8;
    const maxLeft = Math.max(pad, window.innerWidth - rect.width - pad);
    const maxTop = Math.max(pad, window.innerHeight - rect.height - pad);
    const left = Math.max(pad, Math.min(maxLeft, rect.left));
    const top = Math.max(pad, Math.min(maxTop, rect.top));
    if (Math.abs(left - rect.left) > 1 || Math.abs(top - rect.top) > 1) {
      host.style.left = `${left}px`; host.style.top = `${top}px`;
      host.style.right = "auto"; host.style.bottom = "auto";
    }
  };
  const schedulePanelClamp = () => requestAnimationFrame(keepPanelOnScreen);
  const rememberClosedPosition = () => {
    const rect = launcher.getBoundingClientRect();
    if (rect.width && rect.height) {
      launcherSize = { width: rect.width, height: rect.height };
      closedLauncherPosition = {
        left: Math.max(8, Math.min(window.innerWidth - rect.width - 8, rect.left)),
        top: Math.max(8, Math.min(window.innerHeight - rect.height - 8, rect.top))
      };
      safeStorageSet({ myHelperLauncherPosition: closedLauncherPosition });
    }
  };
  const restoreClosedPosition = () => {
    if (!closedLauncherPosition) {
      host.style.left = "auto"; host.style.top = "auto";
      host.style.right = "22px"; host.style.bottom = "22px";
      return;
    }
    host.style.left = `${closedLauncherPosition.left}px`; host.style.top = `${closedLauncherPosition.top}px`;
    host.style.right = "auto"; host.style.bottom = "auto";
  };
  safeStorageGet("myHelperLauncherPosition", ({ myHelperLauncherPosition }) => {
    const saved = myHelperLauncherPosition;
    if (!saved || !Number.isFinite(saved.left) || !Number.isFinite(saved.top)) return;
    const left = Math.max(8, Math.min(window.innerWidth - launcherSize.width - 8, saved.left));
    const top = Math.max(8, Math.min(window.innerHeight - launcherSize.height - 8, saved.top));
    closedLauncherPosition = { left, top };
    restoreClosedPosition();
  });
  if ("ResizeObserver" in window) new ResizeObserver(schedulePanelClamp).observe(panel);
  window.addEventListener("resize", schedulePanelClamp);
  $(".quality").insertAdjacentHTML("afterend", '<p id="qualityHint" data-copy-key="qualityEmpty" style="margin:7px 0 0;font-size:10px;line-height:1.35">Write a real request to see a quality score.</p>');
  const languageCodes = { English: "en-US", Spanish: "es-ES", French: "fr-FR", German: "de-DE", Italian: "it-IT", Portuguese: "pt-PT", Dutch: "nl-NL", Polish: "pl-PL", Turkish: "tr-TR", Arabic: "ar-SA", Hindi: "hi-IN", Bengali: "bn-IN", Japanese: "ja-JP", Korean: "ko-KR", "Simplified Chinese": "zh-CN", "Traditional Chinese": "zh-TW", Vietnamese: "vi-VN", Thai: "th-TH", Indonesian: "id-ID", Malay: "ms-MY", Russian: "ru-RU", Ukrainian: "uk-UA", Swahili: "sw-KE", Igbo: "ig-NG", Hausa: "ha-NG", Yoruba: "yo-NG" };
  const baseCopy = {};
  // Keep every visible interface label in this source list. The translation
  // request uses this list, so a missing key would leave that label in English.
  baseCopy.active = "ACTIVE";
  baseCopy.accessibility = "Accessibility";
  baseCopy.agents = "Automation & agents";
  baseCopy.automation = "Automation";
  baseCopy.back = "Back";
  baseCopy.beginner = "Level 1 · Beginner";
  baseCopy.buildSomething = "Build something";
  baseCopy.closeTitle = "You're close.";
  baseCopy.coachIntro = "Add a few details and your next answer can become more useful.";
  baseCopy.coachMe = "Coach me";
  baseCopy.coachStyle = "Coaching style";
  baseCopy.coachThis = "Coach this";
  baseCopy.coachThisPrompt = "Coach this prompt";
  baseCopy.constraints = "Constraints";
  baseCopy.context = "Context";
  baseCopy.dashboard = "YOUR LEARNING DASHBOARD";
  baseCopy.dismiss = "Dismiss";
  baseCopy.explainPage = "Explain this page";
  baseCopy.firstApi = "First Codex lesson";
  baseCopy.firstApp = "First ChatGPT lesson";
  baseCopy.firstPrompt = "First coached prompt";
  baseCopy.gitMaster = "Automation explorer";
  baseCopy.goal = "Goal";
  baseCopy.hello = "Hello";
  baseCopy.howCanHelp = "How can I help?";
  baseCopy.highContrast = "High contrast";
  baseCopy.homeIntro = "I help you learn while you work without interrupting your ChatGPT conversation.";
  baseCopy.improvePrompt = "Improve prompt";
  baseCopy.installedVoice = "Installed voice";
  baseCopy.language = "Language";
  baseCopy.largeText = "Large text";
  baseCopy.learnChatgpt = "Learn ChatGPT";
  baseCopy.learnCodex = "Learn Codex";
  baseCopy.learningPath = "GUIDED LEARNING PATH";
  baseCopy.localTips = "Local smart prompt tips";
  baseCopy.makeYours = "Make My Helper yours.";
  baseCopy.memory = "Memory & reasoning";
  baseCopy.navCoach = "Coach";
  baseCopy.navLearn = "Learn";
  baseCopy.navProgress = "Progress";
  baseCopy.navSettings = "Settings";
  baseCopy.needHelp = "Need help?";
  baseCopy.preferences = "ACCESSIBILITY & PREFERENCES";
  baseCopy.privacy = "My Helper is a separate coaching overlay. It sends only a prompt you explicitly ask it to coach.";
  baseCopy.privateMemory = "Private memory:";
  baseCopy.privateText = "My Helper keeps your preferences private and syncs them only when you sign in.";
  baseCopy.projects = "Projects & Codex";
  baseCopy.promptCoach = "LIVE PROMPT COACH";
  baseCopy.promptPlaceholder = "Write or paste a prompt here...";
  baseCopy.promptQuality = "PROMPT QUALITY";
  baseCopy.promptSkills = "Prompt skills";
  baseCopy.prompts = "How prompts work";
  baseCopy.screenAware = "SCREEN-AWARE COACHING";
  baseCopy.smartOverlay = "Smart overlay";
  baseCopy.specificity = "Specificity";
  baseCopy.startVoice = "Start voice coach";
  baseCopy.tagline = "YOUR PERSONAL AI COACH";
  baseCopy.testVoice = "Test voice";
  baseCopy.tryCoach = "Try this in the prompt coach";
  baseCopy.voiceCoach = "Voice coach";
  baseCopy.voiceLanguage = "Voice language";
  baseCopy.voicePreference = "Voice preference";
  baseCopy.whatIsAi = "What is AI";
  baseCopy.yourProgress = "Your progress";
  baseCopy.voiceGreeting = "What may I help you with today? Feel free to tell me.";
  baseCopy.tipTitle = "Review your draft";
  baseCopy.tipText = "Select Coach this to review the exact words you wrote before sending them.";
  baseCopy.smartText = "Prompt checks run locally only after you type in the ChatGPT composer. My Helper sends text to AI only when you choose Coach this prompt.";
  baseCopy.voiceInfo = "Choose a voice from the list, then use Test voice to hear how My Helper will guide you.";
  baseCopy.progressIntro = "Your score grows only after you finish a lesson or use a coaching tool.";
  baseCopy.markComplete = "Mark lesson complete";
  baseCopy.lessonCompleted = "Lesson completed";
  baseCopy.askByVoice = "Ask by voice";
  baseCopy.hearAgain = "Hear again";
  baseCopy.personalGuide = "PERSONAL AI GUIDE";
  baseCopy.guideStarterTitle = "Learn with My Helper.";
  baseCopy.guideStarterIntro = "My Helper will ask one small question, listen to your answer, and guide your next step.";
  baseCopy.guideReadyTitle = "Ready when you are.";
  baseCopy.guideReadyText = "Choose a topic from the Coach screen, or start a lesson here.";
  baseCopy.yourAnswer = "Your answer";
  baseCopy.guidePlaceholder = "Tell My Helper what you want to learn or build.";
  baseCopy.startGuide = "Start my AI guide";
  baseCopy.talkToHelper = "Talk to My Helper";
  baseCopy.pageGuide = "PAGE GUIDE";
  baseCopy.explainStartTitle = "Let me read this page.";
  baseCopy.explainStartIntro = "I will explain the controls currently visible on this screen.";
  baseCopy.askPageQuestion = "Ask a question about this page";
  baseCopy.showAllControls = "Show all visible controls";
  baseCopy.allVisibleControls = "All visible controls";
  baseCopy.showControl = "Show";
  baseCopy.copyPrompt = "Copy prompt";
  baseCopy.copied = "Copied";
  baseCopy.hearCoaching = "Hear coaching";
  baseCopy.continueGuide = "Continue with My Helper";
  baseCopy.startAnotherGuide = "Start another guided step";
  baseCopy.preparingGuide = "My Helper is preparing your next small step.";
  baseCopy.thinkingWithYou = "Thinking with you…";
  baseCopy.thinkingGuideText = "I am using your current screen and your goal to prepare clear guidance.";
  baseCopy.couldNotStartGuide = "I could not start the guide yet.";
  baseCopy.guideTryAgain = "Tell me what you want to learn or build, then try again.";
  baseCopy.letsBuild = "Let's build this together.";
  baseCopy.spokenReplies = "Spoken replies";
  baseCopy.spokenRepliesHelp = "Turn this off when you want My Helper to show answers without speaking them.";
  baseCopy.voiceActivationTitle = "Voice activation";
  baseCopy.voiceActivationHelp = "Turn this on once, allow the microphone, then say Open My Helper or I need help.";
  baseCopy.visualAnalysisTitle = "Visual page analysis";
  baseCopy.visualAnalysisHelp = "When you explain a page, My Helper can send one temporary image of the visible tab to your selected vision model. It is not saved.";
  baseCopy.voiceOn = "Coach voice is on";
  baseCopy.voiceOff = "Coach voice is off";
  baseCopy.voiceActivationOn = "Voice activation is on";
  baseCopy.voiceActivationOff = "Voice activation is off";
  baseCopy.visualOn = "Visual analysis is on";
  baseCopy.visualOff = "Visual analysis is off";
  baseCopy.currentPage = "CURRENT CHATGPT PAGE";
  baseCopy.readingThisPage = "Reading this page";
  baseCopy.lookingAtScreen = "Looking at this screen…";
  baseCopy.screenExplanation = "I will give you a plain-language explanation and show you where each visible feature is.";
  baseCopy.foundOnPage = "Here is what I found.";
  baseCopy.visibleControls = "Visible controls";
  baseCopy.askVisibleFeature = "Ask My Helper about a visible feature on this screen.";
  baseCopy.explainFailedTitle = "I could not explain this page yet.";
  baseCopy.explainFailedText = "Nothing was changed on ChatGPT.";
  baseCopy.explainStayText = "My Helper stays on this page while it explains visible controls.";
  baseCopy.visualFallback = "Visual capture was unavailable, so I used the live page map instead.";
  baseCopy.textLanguage = "Text and AI language";
  baseCopy.noVoiceInstalled = "No installed voice matches this language. Install a voice for this language, then test again.";
  baseCopy.styleFriendly = "Friendly";
  baseCopy.styleProfessional = "Professional";
  baseCopy.styleTeacher = "Teacher";
  baseCopy.styleMentor = "Mentor";
  baseCopy.styleParent = "Parent";
  baseCopy.styleDeveloper = "Developer";
  baseCopy.styleStudent = "Student";
  baseCopy.voiceNatural = "Natural";
  baseCopy.voiceFeminine = "Feminine preference";
  baseCopy.voiceMasculine = "Masculine preference";
  baseCopy.qualityEmpty = "Write a real request to see a quality score.";
  baseCopy.qualityUnclear = "Too short or unclear to score. Write a complete request in your own language, with enough real words or characters.";
  baseCopy.qualityEstimate = "This local estimate accepts real requests in any supported language. Select Coach this prompt for a stricter AI review.";
  baseCopy.qualityPending = "Your score will appear after My Helper reviews this prompt.";
  baseCopy.qualityReviewed = "AI reviewed this score using the goal, context, details, and requested result.";
  baseCopy.alreadyWorking = "ALREADY WORKING";
  baseCopy.worthAdding = "WORTH ADDING";
  baseCopy.nextStep = "Next step:";
  baseCopy.coaching = "Coaching…";
  baseCopy.coachValidation = "Write a clear request with real words before asking My Helper to coach it.";
  baseCopy.coachUnavailable = "I could not reach the coach. Please try again.";
  baseCopy.chooseVoice = "Choose a voice";
  baseCopy.voiceNotInstalled = "{language} voice not installed";
  baseCopy.voiceLocalReady = "Instant local voice is ready for {language}.";
  baseCopy.voiceCloudFallback = "Real cloud voice will be used for {language}; repeat audio is cached after the first reply.";
  baseCopy.speakingIn = "Speaking in {language}.";
  baseCopy.voiceReady = "Voice coach is ready.";
  baseCopy.voiceError = "My Helper could not speak. Choose an installed voice, then test it again.";
  baseCopy.voiceOffMessage = "Coach voice is off. Turn on Spoken replies in Settings to hear answers.";
  baseCopy.speechUnavailable = "Speech is not available in this browser.";
  baseCopy.preparingVoice = "Preparing voice…";
  baseCopy.listening = "Listening…";
  baseCopy.waitingForSpeech = "Waiting for My Helper to finish speaking.";
  baseCopy.highlightedControl = "The selected control is highlighted on the page.";
  let prefs = { language: "English", voiceLanguage: "English", voiceStyle: "natural", voiceName: "", coachStyle: "friendly", autoTips: false, tipModeVersion: 3, largeText: false, highContrast: false, speechEnabled: true, voiceActivation: false, visualAnalysis: false, promptSkill: 0, chatgptSkill: 0, codexSkill: 0, automationSkill: 0, completedLessons: [], progressVersion: 4 };
  let translatedCopy = { ...baseCopy };
  const interfaceCacheRevision = 6;
  let translationRequest = 0;
  let languageEpoch = 0;
  const interfaceTranslations = new Map();
  const pendingInterfaceTranslations = new Map();
  const isCurrentLanguage = (language, epoch) => prefs.language === language && languageEpoch === epoch;
  const formatCopy = (key, fallback = "", values = {}) => String(translatedCopy[key] || fallback).replace(/\{(\w+)\}/g, (_match, name) => String(values[name] ?? ""));
  const setVoiceStatus = (key, fallback, values) => { $("#voiceStatus").dataset.copyKey = key; $("#voiceStatus").textContent = formatCopy(key, fallback, values); };
  const setQualityHint = (key, fallback) => { $("#qualityHint").dataset.copyKey = key; $("#qualityHint").textContent = formatCopy(key, fallback); };

  const pageContext = () => {
    const path = location.pathname.toLowerCase();
    const title = String(document.title || "").toLowerCase();
    const headingRoot = document.querySelector("main") || document;
    const headings = [...headingRoot.querySelectorAll("h1,h2,[role='heading']")].filter((item) => item.offsetParent !== null).map((item) => String(item.textContent || "").toLowerCase()).join(" ");
    if (path.includes("plan") || title.includes("plan") || headings.includes("plan")) return "ChatGPT Plan page";
    if (path.includes("setting") || title.includes("settings")) return "ChatGPT Settings";
    if (path.includes("project")) return "ChatGPT Projects";
    if (path.includes("/g/")) return "Custom GPTs";
    if (path.includes("library")) return "ChatGPT Library";
    if (path.includes("codex")) return "Codex";
    if (path.includes("playground")) return "Playground";
    if (path.includes("api")) return "API docs";
    return path === "/" || !path ? "Current ChatGPT page" : "Current ChatGPT workspace";
  };
  const safe = (text) => String(text || "").replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#039;", '"': "&quot;" })[char]);
  const legacySpeakText = (text) => {
    if (!prefs.speechEnabled) { $("#voiceStatus").textContent = "Coach voice is off. Turn on Spoken replies in Settings to hear answers."; return; }
    if (!("speechSynthesis" in window)) { $("#voiceStatus").textContent = "Speech is not available in this browser."; return; }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = languageCodes[prefs.voiceLanguage] || "en-US";
    const voices = window.speechSynthesis.getVoices();
    utterance.voice = voices.find((voice) => voice.name === prefs.voiceName) || voices.find((voice) => voice.lang.toLowerCase().startsWith(utterance.lang.slice(0, 2).toLowerCase())) || voices[0] || null;
    utterance.rate = .94;
    utterance.onstart = () => { $("#voiceStatus").textContent = `Speaking in ${prefs.voiceLanguage}.`; };
    utterance.onend = () => { $("#voiceStatus").textContent = "Voice coach is ready."; };
    utterance.onerror = () => { $("#voiceStatus").textContent = "My Helper could not speak. Choose an installed voice, then test it again."; };
    window.speechSynthesis.resume();
    window.speechSynthesis.speak(utterance);
    setTimeout(() => { if (window.speechSynthesis.pending && $("#voiceStatus").textContent !== `Speaking in ${prefs.voiceLanguage}.`) $("#voiceStatus").textContent = "Preparing voice…"; }, 180);
  };
  let speechSequence = 0;
  let activeCloudAudio = null;
  let cloudAudioContext = null;
  const cloudVoiceAudioCache = new Map();
  const pendingCloudVoice = new Map();
  const cloudVoiceKey = (text, language = prefs.voiceLanguage) => `${language}|${prefs.voiceStyle}|${String(text).slice(0, 4500)}`;
  const requestCloudVoice = (text) => {
    const key = cloudVoiceKey(text);
    if (cloudVoiceAudioCache.has(key)) return Promise.resolve({ audio: cloudVoiceAudioCache.get(key) });
    if (pendingCloudVoice.has(key)) return pendingCloudVoice.get(key);
    const language = prefs.voiceLanguage;
    const voiceStyle = prefs.voiceStyle;
    const request = new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: "SYNTHESIZE_SPEECH", text: String(text).slice(0, 4500), language, voiceStyle }, (reply) => {
        if (chrome.runtime.lastError || reply?.error || !reply?.audio) return resolve({ error: reply?.error || chrome.runtime.lastError?.message || "My Helper could not create this voice." });
        cloudVoiceAudioCache.set(key, reply.audio);
        if (cloudVoiceAudioCache.size > 24) cloudVoiceAudioCache.delete(cloudVoiceAudioCache.keys().next().value);
        resolve(reply);
      });
    });
    pendingCloudVoice.set(key, request);
    request.finally(() => { if (pendingCloudVoice.get(key) === request) pendingCloudVoice.delete(key); });
    return request;
  };
  const warmCloudVoice = (text) => {
    if (!prefs.speechEnabled || !text) return;
    const prefix = (languageCodes[prefs.voiceLanguage] || "en-US").slice(0, 2).toLowerCase();
    if (window.speechSynthesis.getVoices().some((voice) => voice.lang.toLowerCase().startsWith(prefix))) return;
    requestCloudVoice(text).catch(() => {});
  };
  const unlockCloudAudio = () => {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return null;
    if (!cloudAudioContext) cloudAudioContext = new AudioContext();
    if (cloudAudioContext.state === "suspended") cloudAudioContext.resume().catch(() => {});
    return cloudAudioContext;
  };
  host.addEventListener("pointerdown", unlockCloudAudio, true);
  const finishSpokenReply = (sequence, listenAfter) => {
    if (sequence !== speechSequence) return;
    setVoiceStatus("voiceReady", "Voice coach is ready.");
    if (listenAfter && panel.classList.contains("open")) setTimeout(() => startListening("command"), 450);
  };
  const playCloudVoice = (text, sequence, listenAfter) => {
    setVoiceStatus("preparingVoice", "Preparing voice…");
    requestCloudVoice(text).then((reply) => {
      if (sequence !== speechSequence) return;
      if (chrome.runtime.lastError || reply?.error || !reply?.audio) {
        setVoiceStatus(reply?.error ? "voiceError" : "noVoiceInstalled", reply?.error || "No installed voice matches this language. Install a voice for this language, then test again.");
        return;
      }
      const context = unlockCloudAudio();
      const fail = () => { if (sequence === speechSequence) setVoiceStatus("voiceError", "My Helper could not speak. Choose an installed voice, then test it again."); };
      const playWithElement = () => {
        const audio = new Audio(reply.audio);
        activeCloudAudio = { playing: true, stop: () => { audio.pause(); audio.src = ""; } };
        audio.onplay = () => { if (sequence === speechSequence) setVoiceStatus("speakingIn", "Speaking in {language}.", { language: prefs.voiceLanguage }); };
        audio.onended = () => { if (activeCloudAudio?.stop) activeCloudAudio = null; finishSpokenReply(sequence, listenAfter); };
        audio.onerror = () => { activeCloudAudio = null; fail(); };
        audio.play().catch(() => { activeCloudAudio = null; fail(); });
      };
      if (!context || context.state !== "running") { playWithElement(); return; }
      fetch(reply.audio).then((response) => response.arrayBuffer()).then((bytes) => context.decodeAudioData(bytes)).then((buffer) => {
        if (sequence !== speechSequence) return;
        if (context.state !== "running") { playWithElement(); return; }
        const source = context.createBufferSource();
        source.buffer = buffer;
        source.connect(context.destination);
        activeCloudAudio = { playing: true, stop: () => { try { source.stop(); } catch {} } };
        source.onended = () => { if (activeCloudAudio?.stop) activeCloudAudio = null; finishSpokenReply(sequence, listenAfter); };
        setVoiceStatus("speakingIn", "Speaking in {language}.", { language: prefs.voiceLanguage });
        source.start();
      }).catch(playWithElement);
    });
  };
  const speakText = (text, { listenAfter = false } = {}) => {
    if (!prefs.speechEnabled) { setVoiceStatus("voiceOffMessage", "Coach voice is off. Turn on Spoken replies in Settings to hear answers."); return; }
    const sequence = ++speechSequence;
    clearTimeout(recognitionRestart);
    const listeningRecognition = activeRecognition;
    activeRecognition = null;
    recognitionRunning = false;
    if (listeningRecognition) { try { listeningRecognition.abort(); } catch {} }
    if (activeCloudAudio) { activeCloudAudio.stop(); activeCloudAudio = null; }
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    if (!("speechSynthesis" in window)) { playCloudVoice(text, sequence, listenAfter); return; }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = languageCodes[prefs.voiceLanguage] || "en-US";
    const voices = window.speechSynthesis.getVoices();
    const languagePrefix = utterance.lang.slice(0, 2).toLowerCase();
    const matchingVoices = voices.filter((voice) => voice.lang.toLowerCase().startsWith(languagePrefix));
    const selectedVoice = matchingVoices.find((voice) => voice.name === prefs.voiceName) || matchingVoices[0];
    // Never silently fall back to an English (or other) voice for a language
    // the browser does not actually have installed.
    if (!selectedVoice) { playCloudVoice(text, sequence, listenAfter); return; }
    utterance.voice = selectedVoice;
    utterance.rate = .94;
    utterance.onstart = () => { if (sequence === speechSequence) setVoiceStatus("speakingIn", "Speaking in {language}.", { language: prefs.voiceLanguage }); };
    utterance.onend = () => {
      if (sequence !== speechSequence) return;
      finishSpokenReply(sequence, listenAfter);
    };
    utterance.onerror = () => { if (sequence === speechSequence) setVoiceStatus("voiceError", "My Helper could not speak. Choose an installed voice, then test it again."); };
    window.speechSynthesis.resume();
    window.speechSynthesis.speak(utterance);
  };
  const savePrefs = () => {
  safeStorageSet({ myHelperPrefs: prefs });
  try {
    chrome.runtime.sendMessage({ type: "SYNC_USER_STATE", prefs }, () => {
      try { void chrome.runtime.lastError; } catch {}
    });
  } catch {}
};
  const applyCopy = () => {
    $$('[data-i18n]').forEach((element) => { const value = translatedCopy[element.dataset.i18n]; if (value) element.textContent = value; });
    $$('[data-i18n-placeholder]').forEach((element) => { const value = translatedCopy[element.dataset.i18nPlaceholder]; if (value) element.placeholder = value; });
    const setText = (selector, key) => { const element = $(selector); if (element && translatedCopy[key]) element.textContent = translatedCopy[key]; };
    setText("#guideEyebrow", "personalGuide");
    setText("#guideLabel", "yourAnswer");
    setText("#guideVoice", "talkToHelper");
    setText("#pageGuideEyebrow", "pageGuide");
    setText("#explainVoice", "askPageQuestion");
    const guideReply = $("#guideReply"); if (guideReply && translatedCopy.guidePlaceholder) guideReply.placeholder = translatedCopy.guidePlaceholder;
    if ($("#guideReadyTitle")) {
      setText("#guideTitle", "guideStarterTitle"); setText("#guideIntro", "guideStarterIntro"); setText("#guideReadyTitle", "guideReadyTitle"); setText("#guideReadyText", "guideReadyText"); setText("#guideNext", "startGuide");
    }
    const voiceSettings = $$(".voice-activation");
    if (voiceSettings[0]) { voiceSettings[0].querySelector("b").textContent = translatedCopy.spokenReplies; voiceSettings[0].querySelector("p").textContent = translatedCopy.spokenRepliesHelp; }
    if (voiceSettings[1]) { voiceSettings[1].querySelector("b").textContent = translatedCopy.voiceActivationTitle; voiceSettings[1].querySelector("p").textContent = translatedCopy.voiceActivationHelp; }
    if (voiceSettings[2]) { voiceSettings[2].querySelector("b").textContent = translatedCopy.visualAnalysisTitle; voiceSettings[2].querySelector("p").textContent = translatedCopy.visualAnalysisHelp; }
    $("#speechEnabledLabel").textContent = prefs.speechEnabled ? translatedCopy.voiceOn : translatedCopy.voiceOff;
    $("#voiceActivationLabel").textContent = prefs.voiceActivation ? translatedCopy.voiceActivationOn : translatedCopy.voiceActivationOff;
    $("#visualAnalysisLabel").textContent = prefs.visualAnalysis ? translatedCopy.visualOn : translatedCopy.visualOff;
    $("#screenName").textContent = prefs.language === "English" ? pageContext().toUpperCase() : translatedCopy.currentPage;
    const qualityHint = $("#qualityHint");
    if (qualityHint?.dataset.copyKey) qualityHint.textContent = formatCopy(qualityHint.dataset.copyKey);
    const voiceStatus = $("#voiceStatus");
    if (voiceStatus?.dataset.copyKey) voiceStatus.textContent = formatCopy(voiceStatus.dataset.copyKey, "", { language: prefs.voiceLanguage });
    const voiceAvailability = $("#voiceAvailability");
    if (voiceAvailability?.dataset.copyKey) voiceAvailability.textContent = formatCopy(voiceAvailability.dataset.copyKey, "", { language: prefs.voiceLanguage });
  };
  const populateVoices = () => {
    const select = $("#voiceSelect");
    const code = languageCodes[prefs.voiceLanguage] || "en-US";
    const voices = window.speechSynthesis?.getVoices?.() || [];
    const matching = voices.filter((voice) => voice.lang.toLowerCase().startsWith(code.slice(0, 2).toLowerCase()));
    const feminineHints = /female|woman|zira|aria|susan|hazel|samantha|victoria|linda|heera|kalpana|google.*female/i;
    const masculineHints = /male|man|david|mark|daniel|george|james|ravi|hemant|google.*male/i;
    const preference = prefs.voiceStyle === "feminine" ? feminineHints : prefs.voiceStyle === "masculine" ? masculineHints : null;
    const preferred = preference ? matching.filter((voice) => preference.test(voice.name)) : matching;
    const listed = preferred.length ? [...preferred, ...matching.filter((voice) => !preferred.includes(voice))] : matching;
    select.innerHTML = `<option value="">${listed.length ? safe(translatedCopy.chooseVoice) : safe(formatCopy("voiceNotInstalled", "{language} voice not installed", { language: prefs.voiceLanguage }))}</option>${listed.map((voice) => `<option value="${safe(voice.name)}">${safe(voice.name)} (${safe(voice.lang)})</option>`).join("")}`;
    select.value = listed.some((voice) => voice.name === prefs.voiceName) ? prefs.voiceName : "";
    const availability = $("#voiceAvailability");
    if (availability) {
      const key = listed.length ? "voiceLocalReady" : "voiceCloudFallback";
      availability.dataset.copyKey = key;
      availability.textContent = formatCopy(key, listed.length ? "Instant local voice is ready for {language}." : "Real cloud voice will be used for {language}; repeat audio is cached after the first reply.", { language: prefs.voiceLanguage });
    }
  };
  const applyPrefs = () => {
    host.classList.toggle("large-text", prefs.largeText);
    host.classList.toggle("high-contrast", prefs.highContrast);
    $("#coachStyle").value = prefs.coachStyle;
    $("#language").value = prefs.language;
    $("#textLanguage").value = prefs.language;
    $("#voiceLanguage").value = prefs.voiceLanguage;
    $("#voiceStyle").value = prefs.voiceStyle;
    $("#autoTips").checked = prefs.autoTips;
    $("#largeText").checked = prefs.largeText;
    $("#highContrast").checked = prefs.highContrast;
    $("#speechEnabled").checked = prefs.speechEnabled;
    $("#speechEnabledLabel").textContent = prefs.speechEnabled ? translatedCopy.voiceOn : translatedCopy.voiceOff;
    $("#voiceActivation").checked = prefs.voiceActivation;
    $("#voiceActivationLabel").textContent = prefs.voiceActivation ? translatedCopy.voiceActivationOn : translatedCopy.voiceActivationOff;
    $("#visualAnalysis").checked = prefs.visualAnalysis;
    $("#visualAnalysisLabel").textContent = prefs.visualAnalysis ? translatedCopy.visualOn : translatedCopy.visualOff;
    $("#promptSkill").textContent = `${prefs.promptSkill}%`;
    $("#chatgptSkill").textContent = `${prefs.chatgptSkill}%`;
    $("#codexSkill").textContent = `${prefs.codexSkill}%`;
    $("#automationSkill").textContent = `${prefs.automationSkill}%`;
    $("#achievementPrompt").classList.toggle("locked", !prefs.promptSkill);
    $("#achievementChatgpt").classList.toggle("locked", !prefs.chatgptSkill);
    $("#achievementCodex").classList.toggle("locked", !prefs.codexSkill);
    $("#achievementAutomation").classList.toggle("locked", !prefs.automationSkill);
    $("#screenName").textContent = pageContext().toUpperCase();
    populateVoices();
    applyCopy();
  };
  safeStorageGet(null, (stored) => {
    const { myHelperPrefs } = stored;
    Object.entries(stored || {}).forEach(([key, value]) => {
      const match = new RegExp(`^myHelperInterfaceCopy:v${interfaceCacheRevision}:(.+)$`).exec(key);
      if (match && value && typeof value === "object") interfaceTranslations.set(match[1], value);
    });
    const isNewProgress = !myHelperPrefs?.progressVersion || myHelperPrefs.progressVersion < 4;
    prefs = { ...prefs, ...(myHelperPrefs || {}) };
    // The old generic yellow tip could be unrelated to the user's real draft.
    // Turn it off once for existing users; they can enable it again in Settings.
    if (!myHelperPrefs?.tipModeVersion || myHelperPrefs.tipModeVersion < 3) Object.assign(prefs, { autoTips: false, tipModeVersion: 3 });
    if (isNewProgress) Object.assign(prefs, { promptSkill: 0, chatgptSkill: 0, codexSkill: 0, automationSkill: 0, completedLessons: [], progressVersion: 4 });
    applyPrefs();
    if (prefs.language !== "English") setTimeout(translateInterface, 0);
    savePrefs();
  });
  if (window.speechSynthesis) window.speechSynthesis.onvoiceschanged = populateVoices;

  const showView = (name) => {
    $$(".view").forEach((view) => view.classList.toggle("hidden", view.dataset.section !== name));
    $$(".nav button").forEach((button) => button.classList.toggle("active", button.dataset.view === name));
    if (name !== "coach") result.classList.add("hidden");
    schedulePanelClamp();
  };
  const targetComposer = () => [...document.querySelectorAll("#prompt-textarea, textarea, [contenteditable='true'][role='textbox'], [contenteditable='true']")].find((element) => element.offsetParent !== null);
  const composerText = () => { const element = targetComposer(); return element ? String(element.value || element.innerText || element.textContent || "").trim() : ""; };
  const screenElements = new Map();
  const stableScreenIds = new WeakMap();
  let screenIdSequence = 0;
  const screenId = (element, kind) => {
    if (!stableScreenIds.has(element)) stableScreenIds.set(element, `${kind}-${++screenIdSequence}`);
    return stableScreenIds.get(element);
  };
  const controlLabel = (item) => {
    const visibleText = String(item.textContent || "").replace(/\s+/g, " ").trim();
    const accessibilityText = String(item.getAttribute("aria-label") || item.getAttribute("title") || "").replace(/\s+/g, " ").trim();
    const placeholderText = String(item.getAttribute("placeholder") || "").replace(/\s+/g, " ").trim();
    const fallback = String(item.getAttribute("data-testid") || "").replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim();
    const inputLike = /^(input|textarea|select)$/i.test(item.tagName) || item.getAttribute("contenteditable") === "true";
    return (inputLike ? accessibilityText || placeholderText || visibleText || fallback : visibleText || accessibilityText || placeholderText || fallback).slice(0, 90);
  };
  const captureScreen = () => {
    screenElements.clear();
    const mainArea = document.querySelector("main");
    const isSidebar = (item) => Boolean(item.closest("aside,nav,[data-testid*='sidebar'],[data-testid*='history']"));
    const controls = [...document.querySelectorAll("button,[role='button'],[role='menuitem'],[role='option'],[role='switch'],[role='combobox'],a[href],input,select,textarea,[contenteditable='true']")]
      .filter((item) => {
        if (item.offsetParent === null) return false;
        const rect = item.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.right > 0 && rect.top < window.innerHeight && rect.left < window.innerWidth;
      })
      .map((item) => ({ item, label: controlLabel(item), priority: mainArea && mainArea.contains(item) ? 0 : isSidebar(item) ? 2 : 1 }))
      .filter(({ label }) => label.length >= 2 && label.length <= 90)
      .sort((left, right) => left.priority - right.priority)
      .slice(0, 80)
      .map(({ item, label }) => {
        const id = screenId(item, "control");
        const rect = item.getBoundingClientRect();
        screenElements.set(id, item);
        return { id, label, role: item.getAttribute("role") || item.tagName.toLowerCase(), bounds: { left: Math.round(rect.left), top: Math.round(rect.top), width: Math.round(rect.width), height: Math.round(rect.height) } };
      });
    const textTargets = [];
    const seenText = new Set();
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode()) && textTargets.length < 70) {
      const parent = node.parentElement;
      const text = String(node.nodeValue || "").replace(/\s+/g, " ").trim();
      if (!parent || text.length < 2 || text.length > 100) continue;
      if (parent.closest("[data-message-author-role],[data-testid*='conversation-turn'],[contenteditable='true'],textarea")) continue;
      if (isSidebar(parent)) continue;
      if (parent.closest("button,[role='button'],a,[aria-label],input,select")) continue;
      const rect = parent.getBoundingClientRect();
      if (rect.width < 2 || rect.height < 2 || rect.bottom <= 0 || rect.right <= 0 || rect.top >= window.innerHeight || rect.left >= window.innerWidth) continue;
      const key = `${text}:${Math.round(rect.left)}:${Math.round(rect.top)}`;
      if (seenText.has(key)) continue;
      seenText.add(key);
      const id = screenId(parent, "text");
      screenElements.set(id, parent);
      textTargets.push({ id, label: text, role: "text", bounds: { left: Math.round(rect.left), top: Math.round(rect.top), width: Math.round(rect.width), height: Math.round(rect.height) } });
    }
    const headings = [...(mainArea || document).querySelectorAll("h1,h2,[role='heading']")]
      .filter((item) => item.offsetParent !== null)
      .map((item) => String(item.textContent || "").replace(/\s+/g, " ").trim().slice(0, 100))
      .filter(Boolean).slice(0, 6);
    return { page: { route: location.pathname + location.search, title: String(document.title || "ChatGPT").slice(0, 120), context: pageContext(), headings, viewport: { width: window.innerWidth, height: window.innerHeight } }, controls: [...controls, ...textTargets] };
  };
  const markControl = (reference, label = "") => {
    let element = screenElements.get(String(reference));
    if (!element || !element.isConnected || element.offsetParent === null) {
      const screen = captureScreen();
      element = screenElements.get(String(reference));
      if (!element) {
        const normalizeLabel = (value) => String(value || "").toLocaleLowerCase().normalize("NFKC").replace(/[^\p{L}\p{N} ]/gu, " ").replace(/\s+/g, " ").trim();
        const term = normalizeLabel(label || reference);
        const matched = term ? screen.controls.find((control) => normalizeLabel(control.label).includes(term) || term.includes(normalizeLabel(control.label))) : null;
        element = matched ? screenElements.get(matched.id) : null;
      }
    }
    if (!element) { $("#voiceStatus").textContent = `I could not find ${label || reference} on this screen yet.`; return false; }
    panel.classList.remove("open");
    restoreClosedPosition();
    element.scrollIntoView({ behavior: "auto", block: "center", inline: "center" });
    setTimeout(() => {
      if (!element.isConnected || element.offsetParent === null) return;
      const rect = element.getBoundingClientRect();
      const marker = document.createElement("div");
      marker.style.cssText = `position:fixed;z-index:2147483646;left:${Math.max(2, rect.left - 5)}px;top:${Math.max(2, rect.top - 5)}px;width:${rect.width + 10}px;height:${rect.height + 10}px;border:4px solid #ffc947;outline:2px solid #152017;box-shadow:0 0 0 9999px rgba(21,32,23,.22);pointer-events:none;animation:my-helper-pulse .8s ease-in-out infinite alternate;`;
      document.documentElement.append(marker);
      marker.animate([{ transform: "scale(1)" }, { transform: "scale(1.05)" }], { duration: 650, iterations: 5, direction: "alternate" });
      setTimeout(() => marker.remove(), 4200);
    }, 120);
    return true;
  };
  const highlightAndSpeak = (reference, label) => {
    // Prime browser audio during the user click. This lets an asynchronous
    // cloud response speak after the marker is drawn.
    unlockCloudAudio();
    if (!markControl(reference, label)) return false;
    speakText(`${label}. ${translatedCopy.highlightedControl}`);
    return true;
  };
  const stars = (value) => "★".repeat(value) + "☆".repeat(5 - value);
  const starsFromAiScore = (score) => {
    const total = Math.max(0, Math.min(20, Math.round(Number(score || 0) / 5)));
    const base = Math.floor(total / 4);
    const extra = total % 4;
    return [0, 1, 2, 3].map((index) => stars(Math.min(5, base + (index < extra ? 1 : 0))));
  };
  const draftQualityCheck = (value) => {
    const text = String(value || "").trim();
    // Unicode properties keep Arabic, Hindi, CJK, Cyrillic, and Latin-language
    // requests on the same path instead of treating them as empty English text.
    const tokens = text.match(/[\p{L}\p{M}\p{N}]+(?:[’'\-][\p{L}\p{M}\p{N}]+)*/gu) || [];
    const letters = (text.match(/[\p{L}\p{M}]/gu) || []).length;
    const lower = text.toLocaleLowerCase();
    const intent = /\b(create|write|build|explain|plan|analy[sz]e|help|make|design|compare|review|teach|show|give|find|fix|summari[sz]e)\b/.test(lower);
    const latinWords = tokens.filter((word) => /^[A-Za-zÀ-ÖØ-öø-ÿĀ-ž]+$/u.test(word));
    const longConsonantRun = latinWords.some((word) => word.length >= 7 && (word.match(/[aeiouyà-öø-ÿ]/gi) || []).length < Math.max(2, Math.floor(word.length * .18)));
    const repeatedNoise = /(.)\1{4,}/u.test(text) || /(?:[a-z]{1,3})\1{3,}/i.test(lower);
    const nonLatinScript = /[\u0370-\uFFFF]/u.test(text);
    const enoughMeaningfulText = nonLatinScript ? letters >= 8 : tokens.length >= 6 && letters >= 15;
    const hasContext = tokens.length >= 12 || /[,;:\n?!]/u.test(text);
    return { valid: enoughMeaningfulText && !longConsonantRun && !repeatedNoise, tokens, letters, intent, hasContext };
  };
  const updateQuality = () => {
    const text = draft.value.trim();
    // Deliberately do not guess at quality while the person is writing. A
    // score appears only after the AI has actually reviewed this exact prompt.
    const resetPendingScore = (key, hint) => { $("#score").textContent = "0"; ["#specificity", "#contextScore", "#goalScore", "#constraintScore"].forEach((selector) => $(selector).textContent = stars(0)); setQualityHint(key, hint); };
    resetPendingScore(text ? "qualityPending" : "qualityEmpty", text ? "Your score will appear after My Helper reviews this prompt." : "Write a prompt, then select Coach this prompt for an AI review.");
    return;
    const reset = (key, hint) => { $("#score").textContent = "0"; ["#specificity", "#contextScore", "#goalScore", "#constraintScore"].forEach((selector) => $(selector).textContent = stars(0)); setQualityHint(key, hint); };
    if (!text) { reset("qualityEmpty", "Write a real request to see a quality score."); return; }
    const check = draftQualityCheck(text);
    if (!check.valid) { reset("qualityUnclear", "Too short or unclear to score. Write a complete request in your own language, with enough real words or characters."); return; }
    const words = check.tokens;
    const specificity = Math.min(5, Math.max(1, Math.ceil(check.letters / 38)));
    const context = check.hasContext ? Math.min(5, words.length >= 20 || check.letters >= 100 ? 4 : 3) : words.length >= 9 ? 2 : 1;
    const goal = check.intent ? 5 : words.length >= 14 || /[?!]/u.test(text) ? 3 : 2;
    const constraints = /[0-9]|["“”()[\]{}]|[:;]|\n/u.test(text) ? 3 : words.length > 22 || check.letters > 120 ? 2 : 1;
    $("#score").textContent = String(Math.round((specificity + context + goal + constraints) / 20 * 100));
    $("#specificity").textContent = stars(specificity);
    $("#contextScore").textContent = stars(context);
    $("#goalScore").textContent = stars(goal);
    $("#constraintScore").textContent = stars(constraints);
    setQualityHint("qualityEstimate", "This local estimate accepts real requests in any supported language. Select Coach this prompt for a stricter AI review.");
  };
  const openCoach = (prefill = "") => { showView("coach"); draft.value = prefill; updateQuality(); draft.focus(); };
  const renderLesson = (title, heading, body, steps, lessonKey = "") => {
    const drawLesson = (copy) => {
      $("#lessonTitle").textContent = copy.title;
      const completed = lessonKey && prefs.completedLessons.includes(lessonKey);
      $("#lessonCard").innerHTML = `<h3>${safe(copy.heading)}</h3><p>${safe(copy.body)}</p><ul class="steps">${copy.steps.map((step, index) => `<li><i class="step">${index + 1}</i><span>${safe(step)}</span></li>`).join("")}</ul>${lessonKey ? `<button id="completeLesson" class="mini-button" style="margin-top:11px" ${completed ? "disabled" : ""}>${completed ? safe(translatedCopy.lessonCompleted) : safe(translatedCopy.markComplete)}</button>` : ""}`;
      if (lessonKey && !completed) $("#completeLesson").addEventListener("click", () => {
        prefs.completedLessons = [...prefs.completedLessons, lessonKey];
        if (lessonKey === "chatgpt") prefs.chatgptSkill = Math.min(100, prefs.chatgptSkill + 10);
        if (lessonKey === "codex") prefs.codexSkill = Math.min(100, prefs.codexSkill + 10);
        if (lessonKey === "automation") prefs.automationSkill = Math.min(100, prefs.automationSkill + 10);
        savePrefs(); applyPrefs(); $("#completeLesson").textContent = translatedCopy.lessonCompleted; $("#completeLesson").disabled = true;
      });
      showView("learn");
    };
    const original = { title, heading, body, steps };
    const requestLanguage = prefs.language;
    const requestEpoch = languageEpoch;
    if (requestLanguage === "English") return drawLesson(original);
    const translationInput = { lessonTitle: title, lessonHeading: heading, lessonBody: body, ...Object.fromEntries(steps.map((step, index) => [`lessonStep${index}`, step])) };
    chrome.runtime.sendMessage({ type: "TRANSLATE_INTERFACE", language: requestLanguage, cacheRevision: interfaceCacheRevision, strings: translationInput }, (reply) => {
      if (!isCurrentLanguage(requestLanguage, requestEpoch)) return;
      const copy = reply?.strings ? { title: reply.strings.lessonTitle || title, heading: reply.strings.lessonHeading || heading, body: reply.strings.lessonBody || body, steps: steps.map((step, index) => reply.strings[`lessonStep${index}`] || step) } : original;
      drawLesson(copy);
    });
  };
  const showVoiceResponse = (answer, listenAfter = false) => {
    const card = $("#voiceResponse");
    card.innerHTML = `<strong>${icons.speaker} ${safe(answer)}</strong><div class="button-row" style="margin-top:8px"><button id="hearAgain" class="mini-button">${icons.speaker} ${safe(translatedCopy.hearAgain)}</button><button id="voiceFollowUp" class="mini-button">${icons.mic} ${safe(translatedCopy.askByVoice)}</button></div>`;
    card.classList.remove("hidden");
    $("#hearAgain").addEventListener("click", () => speakText(answer));
    $("#voiceFollowUp").addEventListener("click", startListening);
    speakText(answer, { listenAfter });
  };
  const showError = (message) => { result.innerHTML = `<div class="error">${safe(message)}</div>`; result.classList.remove("hidden"); };
  const showPlan = (plan) => {
    result.innerHTML = `<strong>${icons.spark} ${safe(plan.message)}</strong><div class="prompt" id="betterPrompt">${safe(plan.improvedPrompt)}</div><div class="result-grid"><div><b data-i18n="alreadyWorking">${safe(translatedCopy.alreadyWorking)}</b><ul>${(plan.strengths || []).map((item) => `<li>${safe(item)}</li>`).join("")}</ul></div><div><b data-i18n="worthAdding">${safe(translatedCopy.worthAdding)}</b><ul>${(plan.missing || []).map((item) => `<li>${safe(item)}</li>`).join("")}</ul></div></div><p><b data-i18n="nextStep">${safe(translatedCopy.nextStep)}</b> ${safe(plan.nextStep)}</p><div class="button-row"><button id="copyPrompt" class="mini-button">${icons.check} ${safe(translatedCopy.copyPrompt)}</button><button id="speakPlan" class="mini-button">${icons.speaker} ${safe(translatedCopy.hearCoaching)}</button></div>`;
    result.classList.remove("hidden");
    $("#copyPrompt").addEventListener("click", async () => { await navigator.clipboard.writeText($("#betterPrompt").textContent); $("#copyPrompt").textContent = translatedCopy.copied; });
    $("#speakPlan").addEventListener("click", () => speakText(`${plan.message}. ${plan.nextStep}`));
  };

  let guideState = { mode: "learn", topic: "ChatGPT basics", lastAnswer: "" };
  const updateSkillFromGuide = (skill) => {
    const key = skill === "codex" ? "codexSkill" : skill === "automation" ? "automationSkill" : "chatgptSkill";
    prefs[key] = Math.min(100, (Number(prefs[key]) || 0) + 5);
    applyPrefs(); savePrefs();
  };
  const renderGuide = (guide) => {
    $("#guideTitle").textContent = guide.title;
    $("#guideIntro").textContent = guide.question;
    $("#guideCard").innerHTML = `<h3>${safe(guide.message)}</h3><ul class="steps">${(guide.steps || []).map((step, index) => `<li><i class="step">${index + 1}</i><span>${safe(step)}</span></li>`).join("")}</ul>`;
    $("#guideNext").textContent = guide.complete ? translatedCopy.startAnotherGuide : translatedCopy.continueGuide;
    $("#guideReply").value = "";
    showView("learn");
    if (guide.complete) updateSkillFromGuide(guide.skill);
    speakText(guide.spoken || `${guide.message}. ${guide.question}`);
  };
  const startGuide = (mode = "learn", topic = "ChatGPT basics", answer = "") => {
    const requestLanguage = prefs.language;
    const requestEpoch = languageEpoch;
    guideState = { mode, topic, lastAnswer: answer };
    showView("learn");
    $("#guideTitle").textContent = mode === "build" ? "Let’s build this together." : "Your personal learning guide";
    $("#guideIntro").textContent = "My Helper is preparing your next small step.";
    $("#guideCard").innerHTML = `<h3>Thinking with you…</h3><p>I am using your current screen and your goal to prepare clear guidance.</p>`;
    $("#guideTitle").textContent = mode === "build" ? translatedCopy.letsBuild : translatedCopy.personalGuide;
    $("#guideIntro").textContent = translatedCopy.preparingGuide;
    $("#guideCard").innerHTML = `<h3>${safe(translatedCopy.thinkingWithYou)}</h3><p>${safe(translatedCopy.thinkingGuideText)}</p>`;
    chrome.runtime.sendMessage({ type: "GUIDE_USER", mode, topic, answer, pageContext: pageContext(), language: requestLanguage }, (reply) => {
      if (!isCurrentLanguage(requestLanguage, requestEpoch)) return;
      if (chrome.runtime.lastError || reply?.error) {
        $("#guideCard").innerHTML = `<h3>I could not start the guide yet.</h3><p>${safe(reply?.error || "Check that the My Helper coach is running, then try again.")}</p>`;
        $("#guideIntro").textContent = "Tell me what you want to learn or build, then try again.";
        return;
      }
      renderGuide(reply);
    });
  };

  const currentView = () => $$(".view").find((view) => !view.classList.contains("hidden"))?.dataset.section || "home";
  const showExplainAnswer = (answer) => {
    $("#explainAnswer").innerHTML = `<strong>${icons.speaker} ${safe(answer)}</strong>`;
    $("#explainAnswer").classList.remove("hidden");
  };
  const askCoach = (question, sourceView = currentView()) => {
    const screen = captureScreen();
    const requestLanguage = prefs.language;
    const requestEpoch = languageEpoch;
    chrome.runtime.sendMessage({ type: "ASK_COACH", question, pageContext: screen.page.context, screen, sourceView, language: requestLanguage }, (reply) => {
      if (!isCurrentLanguage(requestLanguage, requestEpoch)) return;
      const failure = chrome.runtime.lastError || reply?.error;
      if (failure) {
        const message = reply?.error || "I could not reach the coach. Please try again.";
        if (sourceView === "explain") { showView("explain"); showExplainAnswer(message); speakText(message, { listenAfter: true }); return; }
        return showVoiceResponse(message);
      }
      panel.classList.add("open");
      if (sourceView === "explain") {
        showView("explain");
        showExplainAnswer(reply.answer);
      } else {
        showView(sourceView === "coach" ? "coach" : "home");
        showVoiceResponse(reply.answer);
      }
      if (reply.suggestedAction === "open_coach" && sourceView !== "explain") openCoach(composerText());
      if (reply.suggestedAction === "highlight_control" && (reply.controlId || reply.control)) {
        const found = markControl(reply.controlId || reply.control, reply.controlLabel || reply.control);
        if (found) speakText(`${reply.answer}. ${translatedCopy.highlightedControl}`, { listenAfter: sourceView === "explain" });
        else if (sourceView === "explain") speakText(reply.answer, { listenAfter: true });
      } else if (sourceView === "explain") speakText(reply.answer, { listenAfter: true });
    });
  };
  const legacyExplainPage = () => {
    const screen = captureScreen();
    showView("explain");
    $("#explainTitle").textContent = translatedCopy.readingThisPage;
    $("#explainIntro").textContent = prefs.visualAnalysis ? "My Helper will combine the live page map with one temporary image of this visible tab. The image can include anything on screen and is not saved." : "My Helper is mapping real visible controls and their positions. Your chat messages are not included.";
    $("#explainCard").innerHTML = "<h3>Looking at this screen…</h3><p>I will give you a plain-language explanation and show you where each visible feature is.</p>";
    $("#explainActions").innerHTML = "";
    $("#explainAnswer").classList.add("hidden");
    let restoreVisualHost = null;
    const requestExplanation = () => chrome.runtime.sendMessage({ type: prefs.visualAnalysis ? "EXPLAIN_PAGE_VISUAL" : "EXPLAIN_PAGE", pageContext: screen.page.context, screen, language: prefs.language }, (reply) => {
      if (restoreVisualHost) { clearTimeout(restoreVisualHost); restoreVisualHost = null; }
      host.style.visibility = "";
      if (chrome.runtime.lastError || reply?.error) {
        $("#explainTitle").textContent = translatedCopy.explainFailedTitle;
        $("#explainIntro").textContent = reply?.error || "Check that the My Helper coach is running, then try again.";
        $("#explainCard").innerHTML = "<h3>Nothing was changed on ChatGPT.</h3><p>My Helper stays on this page and never sends your chat conversation.</p>";
        return;
      }
      $("#explainTitle").textContent = translatedCopy.foundOnPage;
      $("#explainIntro").textContent = `${reply.summary || ""}${reply.visualError ? ` ${reply.visualError}` : prefs.visualAnalysis && !reply.visualUsed ? " I used the live page map for this explanation." : ""}`.trim();
      $("#explainCard").innerHTML = `<h3>${safe(translatedCopy.visibleControls)}</h3><ul class="steps">${(reply.features || []).map((feature, index) => `<li><i class="step">${index + 1}</i><span><b>${safe(feature.label)}</b> — ${safe(feature.purpose)}${feature.nextStep ? ` ${safe(feature.nextStep)}` : ""}</span></li>`).join("") || `<li><span>${safe(translatedCopy.askVisibleFeature)}</span></li>`}</ul>`;
      $("#explainActions").innerHTML = (reply.features || []).filter((feature) => feature.controlId).map((feature) => `<button class="mini-button" data-highlight-id="${safe(feature.controlId)}" data-highlight-label="${safe(feature.label)}">Show ${safe(feature.label)}</button>`).join("");
      $$('[data-highlight-id]').forEach((button) => button.addEventListener("click", () => {
        const id = button.dataset.highlightId;
        const label = button.dataset.highlightLabel;
        button.textContent = `${translatedCopy.showControl} ${label}`;
        highlightAndSpeak(id, label);
      }));
      const visibleControls = screen.controls.filter((control) => control.role !== "text" && control.label).filter((control, index, all) => all.findIndex((item) => item.label === control.label) === index).slice(0, 50);
      const moreControls = $("#moreControls");
      const allControls = $("#allControls");
      moreControls.textContent = translatedCopy.showAllControls;
      allControls.classList.add("hidden");
      moreControls.classList.toggle("hidden", visibleControls.length === 0);
      moreControls.onclick = () => {
        allControls.innerHTML = `<h3>${safe(translatedCopy.allVisibleControls)}</h3><div class="control-list">${visibleControls.map((control) => `<button class="mini-button" data-all-control-id="${safe(control.id)}" data-all-control-label="${safe(control.label)}">${safe(translatedCopy.showControl)} ${safe(control.label)}</button>`).join("")}</div>`;
        allControls.classList.remove("hidden");
        $$('[data-all-control-id]').forEach((button) => button.addEventListener("click", () => highlightAndSpeak(button.dataset.allControlId, button.dataset.allControlLabel)));
        moreControls.classList.add("hidden");
      };
      speakText(reply.spoken, { listenAfter: true });
    });
    if (prefs.visualAnalysis) {
      host.style.visibility = "hidden";
      restoreVisualHost = setTimeout(() => { host.style.visibility = ""; }, 8000);
      requestAnimationFrame(() => setTimeout(requestExplanation, 90));
    } else {
      requestExplanation();
    }
  };
  const explainPage = () => {
    const screen = captureScreen();
    const requestLanguage = prefs.language;
    const requestEpoch = languageEpoch;
    showView("explain");
    $("#explainTitle").textContent = translatedCopy.readingThisPage;
    $("#explainIntro").textContent = translatedCopy.screenExplanation;
    $("#explainCard").innerHTML = "<h3>Looking at this screen…</h3><p>I will give you a plain-language explanation and show you where each visible feature is.</p>";
    $("#explainActions").innerHTML = "";
    $("#explainAnswer").classList.add("hidden");
    let visualCaptureUnavailable = false;
    $("#explainCard").innerHTML = `<h3>${safe(translatedCopy.lookingAtScreen)}</h3><p>${safe(translatedCopy.screenExplanation)}</p>`;
    const renderExplanation = (reply) => {
      if (!isCurrentLanguage(requestLanguage, requestEpoch)) return;
      if (chrome.runtime.lastError || reply?.error) {
        $("#explainTitle").textContent = translatedCopy.explainFailedTitle;
        $("#explainIntro").textContent = reply?.error || "Check that the My Helper coach is running, then try again.";
        $("#explainCard").innerHTML = `<h3>${safe(translatedCopy.explainFailedText)}</h3><p>${safe(translatedCopy.explainStayText)}</p>`;
        return;
      }
      $("#explainTitle").textContent = translatedCopy.foundOnPage;
      const visualNote = reply.visualError || visualCaptureUnavailable || (prefs.visualAnalysis && !reply.visualUsed) ? translatedCopy.visualFallback : "";
      $("#explainIntro").textContent = `${reply.summary || ""}${visualNote ? ` ${visualNote}` : ""}`.trim();
      $("#explainCard").innerHTML = `<h3>${safe(translatedCopy.visibleControls)}</h3><ul class="steps">${(reply.features || []).map((feature, index) => `<li><i class="step">${index + 1}</i><span><b>${safe(feature.label)}</b> — ${safe(feature.purpose)}${feature.nextStep ? ` ${safe(feature.nextStep)}` : ""}</span></li>`).join("") || `<li><span>${safe(translatedCopy.askVisibleFeature)}</span></li>`}</ul>`;
      $("#explainActions").innerHTML = (reply.features || []).filter((feature) => feature.controlId).map((feature) => `<button class="mini-button" data-highlight-id="${safe(feature.controlId)}" data-highlight-label="${safe(feature.label)}">Show ${safe(feature.label)}</button>`).join("");
      $$('[data-highlight-id]').forEach((button) => { button.textContent = `${translatedCopy.showControl} ${button.dataset.highlightLabel}`; button.addEventListener("click", () => {
        const id = button.dataset.highlightId;
        const label = button.dataset.highlightLabel;
        highlightAndSpeak(id, label);
      }); });
      const visibleControls = screen.controls.filter((control) => control.role !== "text" && control.label).filter((control, index, all) => all.findIndex((item) => item.label === control.label) === index).slice(0, 50);
      const moreControls = $("#moreControls");
      const allControls = $("#allControls");
      moreControls.textContent = translatedCopy.showAllControls;
      allControls.classList.add("hidden");
      moreControls.classList.toggle("hidden", visibleControls.length === 0);
      moreControls.onclick = () => {
        allControls.innerHTML = `<h3>${safe(translatedCopy.allVisibleControls)}</h3><div class="control-list">${visibleControls.map((control) => `<button class="mini-button" data-all-control-id="${safe(control.id)}" data-all-control-label="${safe(control.label)}">${safe(translatedCopy.showControl)} ${safe(control.label)}</button>`).join("")}</div>`;
        allControls.classList.remove("hidden");
        $$('[data-all-control-id]').forEach((button) => button.addEventListener("click", () => highlightAndSpeak(button.dataset.allControlId, button.dataset.allControlLabel)));
        moreControls.classList.add("hidden");
      };
      speakText(reply.spoken, { listenAfter: true });
    };
    const requestExplanation = (captureId = "") => {
      chrome.runtime.sendMessage({ type: captureId ? "EXPLAIN_PAGE_VISUAL" : "EXPLAIN_PAGE", captureId, pageContext: screen.page.context, screen, language: requestLanguage }, renderExplanation);
    };
    if (!prefs.visualAnalysis) return requestExplanation();
    let restorePanel = setTimeout(() => { panel.style.visibility = ""; restorePanel = null; }, 1800);
    panel.style.visibility = "hidden";
    requestAnimationFrame(() => setTimeout(() => {
      chrome.runtime.sendMessage({ type: "CAPTURE_VISUAL_SCREEN" }, (capture) => {
        if (restorePanel) clearTimeout(restorePanel);
        panel.style.visibility = "";
        if (chrome.runtime.lastError || capture?.error || !capture?.captureId) {
          visualCaptureUnavailable = true;
          requestExplanation();
          return;
        }
        requestExplanation(capture.captureId);
      });
    }, 55));
  };
  const handleAction = (action) => {
    if (action === "improve") return openCoach(composerText());
    if (action === "coach") return openCoach();
    if (action === "build") return startGuide("build", "Help the user choose and build a project idea", "");
    if (action === "learn-chatgpt") return startGuide("learn", "Teach ChatGPT basics", "");
    if (action === "learn-codex") return startGuide("learn", "Teach Codex basics", "");
    if (action === "explain") return explainPage();
    if (action === "voice") return startListening();
  };
  let activeRecognition = null;
  let recognitionRunning = false;
  let recognitionRestart = null;
  const legacyStartListening = () => {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) { $("#voiceStatus").textContent = "Voice commands are not available in this browser."; panel.classList.add("open"); showView("settings"); return; }
    if (recognitionRunning) { $("#voiceStatus").textContent = "Voice control is listening."; return; }
    clearTimeout(recognitionRestart);
    const recognition = new Recognition();
    activeRecognition = recognition;
    recognition.lang = languageCodes[prefs.language] || "en-US";
    recognition.interimResults = false;
    recognition.continuous = Boolean(prefs.voiceActivation);
    recognition.maxAlternatives = 1;
    recognition.onstart = () => { recognitionRunning = true; $("#voiceStatus").textContent = prefs.voiceActivation ? "Voice activation is listening for “Open My Helper.”" : "Listening…"; };
    recognition.onresult = (event) => {
      const finalResult = [...Array(event.results.length - event.resultIndex)].map((_, index) => event.results[event.resultIndex + index]).find((item) => item.isFinal);
      const transcript = finalResult?.[0]?.transcript?.trim();
      if (!transcript) return;
      const lower = transcript.toLowerCase();
      recognition.stop();
      if (/open (my )?helper|need help|help me|i need help/.test(lower)) { panel.classList.add("open"); showView("home"); showVoiceResponse(translatedCopy.voiceGreeting || "What may I help you with today? Feel free to tell me."); return; }
      if (/explain (this )?page/.test(lower)) { panel.classList.add("open"); return explainPage(); }
      if (/improve (my )?prompt/.test(lower)) { panel.classList.add("open"); return openCoach(composerText()); }
      askCoach(transcript, currentView());
    };
    recognition.onerror = (event) => {
      recognitionRunning = false;
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        prefs.voiceActivation = false; savePrefs(); applyPrefs();
        $("#voiceStatus").textContent = "Chrome needs microphone permission before voice activation can work.";
      } else if (event.error !== "aborted" && event.error !== "no-speech") $("#voiceStatus").textContent = "I could not hear that. Check microphone permission and try again.";
    };
    recognition.onend = () => {
      recognitionRunning = false;
      if (prefs.voiceActivation && document.visibilityState === "visible") recognitionRestart = setTimeout(startListening, 700);
    };
    try { recognition.start(); } catch { $("#voiceStatus").textContent = "Voice control is already listening."; }
  };
  const startListening = (mode = "command") => {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const wakeMode = mode === "wake";
    if (!Recognition) { $("#voiceStatus").textContent = "Voice commands are not available in this browser."; panel.classList.add("open"); showView("settings"); return; }
    if (wakeMode && panel.classList.contains("open")) return;
    if (window.speechSynthesis?.speaking || activeCloudAudio?.playing) {
      if (wakeMode && prefs.voiceActivation && !panel.classList.contains("open")) recognitionRestart = setTimeout(() => startListening("wake"), 700);
      else $("#voiceStatus").textContent = "Waiting for My Helper to finish speaking.";
      return;
    }
    if (recognitionRunning) return;
    clearTimeout(recognitionRestart);
    const recognition = new Recognition();
    activeRecognition = recognition;
    recognition.lang = languageCodes[prefs.language] || "en-US";
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;
    recognition.onstart = () => {
      recognitionRunning = true;
      $("#voiceStatus").textContent = wakeMode ? "Listening for “Open My Helper.”" : "Listening…";
    };
    recognition.onresult = (event) => {
      const result = event.results[event.resultIndex];
      const transcript = result?.isFinal ? result[0]?.transcript?.trim() : "";
      if (!transcript) return;
      const lower = transcript.toLowerCase();
      recognition.stop();
      if (wakeMode) {
        if (/open (my )?helper|need help|help me|i need help/.test(lower)) {
          panel.classList.add("open");
          showView("home");
          showVoiceResponse(translatedCopy.voiceGreeting || "What may I help you with today? Feel free to tell me.", true);
        }
        return;
      }
      if (/explain (this )?page/.test(lower)) { panel.classList.add("open"); return explainPage(); }
      if (/improve (my )?prompt/.test(lower)) { panel.classList.add("open"); return openCoach(composerText()); }
      askCoach(transcript, currentView());
    };
    recognition.onerror = (event) => {
      recognitionRunning = false;
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        prefs.voiceActivation = false; savePrefs(); applyPrefs();
        $("#voiceStatus").textContent = "Chrome needs microphone permission before voice activation can work.";
      } else if (!wakeMode && event.error !== "aborted" && event.error !== "no-speech") {
        $("#voiceStatus").textContent = "I could not hear that. Check microphone permission and try again.";
      }
    };
    recognition.onend = () => {
      recognitionRunning = false;
      if (activeRecognition === recognition) activeRecognition = null;
      if (wakeMode && prefs.voiceActivation && !panel.classList.contains("open") && document.visibilityState === "visible" && !window.speechSynthesis?.speaking) {
        recognitionRestart = setTimeout(() => startListening("wake"), 650);
      }
    };
    try { recognition.start(); } catch { $("#voiceStatus").textContent = "Voice control is already listening."; }
  };
  const translateInterface = () => {
    const language = prefs.language;
    const requestId = ++translationRequest;
    const cacheKey = `myHelperInterfaceCopy:v${interfaceCacheRevision}:${language}`;
    const applyTranslation = (strings) => {
      if (requestId !== translationRequest || prefs.language !== language) return;
      translatedCopy = { ...baseCopy, ...strings };
      applyCopy(); populateVoices();
      warmCloudVoice(translatedCopy.voiceGreeting);
    };
    if (language === "English") { applyTranslation({}); return; }
    if (interfaceTranslations.has(language)) { applyTranslation(interfaceTranslations.get(language)); return; }
    safeStorageGet(cacheKey, (stored) => {
      const cached = stored?.[cacheKey];
      if (cached && typeof cached === "object") {
        interfaceTranslations.set(language, cached);
        applyTranslation(cached);
        return;
      }
      let pending = pendingInterfaceTranslations.get(cacheKey);
      if (!pending) {
        pending = new Promise((resolve) => {
          chrome.runtime.sendMessage({ type: "TRANSLATE_INTERFACE", language, cacheRevision: interfaceCacheRevision, strings: baseCopy }, (reply) => resolve(reply));
        });
        pendingInterfaceTranslations.set(cacheKey, pending);
        pending.finally(() => {
          if (pendingInterfaceTranslations.get(cacheKey) === pending) pendingInterfaceTranslations.delete(cacheKey);
        });
      }
      pending.then((reply) => {
        // Save a completed translation even when the user changed language while
        // it was loading. That makes returning to Hausa or any other language instant.
        if (chrome.runtime.lastError || reply?.error || !reply?.strings) return;
        interfaceTranslations.set(language, reply.strings);
        safeStorageSet({ [cacheKey]: reply.strings });
        applyTranslation(reply.strings);
      });
    });
  };

  const pauseVoiceListening = () => { const listeningRecognition = activeRecognition; clearTimeout(recognitionRestart); activeRecognition = null; recognitionRunning = false; if (listeningRecognition) { try { listeningRecognition.abort(); } catch {} } };
  const resumeWakeListening = () => { if (prefs.voiceActivation && !panel.classList.contains("open")) setTimeout(() => startListening("wake"), 350); };
  $("#launcher").addEventListener("click", (event) => {
    if (launcherDragMoved) { event.preventDefault(); event.stopPropagation(); launcherDragMoved = false; return; }
    event.preventDefault(); event.stopPropagation();
    const opening = !panel.classList.contains("open");
    if (opening) rememberClosedPosition();
    panel.classList.toggle("open"); $("#screenName").textContent = prefs.language === "English" ? pageContext().toUpperCase() : translatedCopy.currentPage;
    if (panel.classList.contains("open")) { pauseVoiceListening(); schedulePanelClamp(); }
    else { restoreClosedPosition(); resumeWakeListening(); }
  });
  shadow.addEventListener("my-helper:restore-launcher-position", () => {
    panel.classList.remove("open");
    restoreClosedPosition();
    pauseVoiceListening();
    resumeWakeListening();
  });
  $(".close").addEventListener("click", () => { panel.classList.remove("open"); restoreClosedPosition(); pauseVoiceListening(); resumeWakeListening(); });
  document.addEventListener("keydown", (event) => { if (event.key === "Escape") { panel.classList.remove("open"); restoreClosedPosition(); pauseVoiceListening(); resumeWakeListening(); } });
  $$(".nav button").forEach((button) => button.addEventListener("click", () => button.dataset.view === "learn" ? startGuide("learn", "Help me learn to use ChatGPT with confidence", "") : showView(button.dataset.view)));
  $$('[data-action]').forEach((button) => button.addEventListener("click", () => handleAction(button.dataset.action)));
  $$('[data-back]').forEach((button) => button.addEventListener("click", () => showView("home")));
  $("#guideNext").addEventListener("click", () => startGuide(guideState.mode, guideState.topic, $("#guideReply").value.trim()));
  $("#guideVoice").addEventListener("click", startListening);
  $("#explainVoice").addEventListener("click", () => {
    if (!prefs.voiceActivation) { prefs.voiceActivation = true; savePrefs(); applyPrefs(); }
    startListening("command");
  });
  draft.addEventListener("input", updateQuality);
  $("#coachButton").addEventListener("click", () => {
    const text = draft.value.trim();
    if (!text) { updateQuality(); draft.focus(); return showError(translatedCopy.coachValidation); }
    const requestLanguage = prefs.language;
    const requestEpoch = languageEpoch;
    const button = $("#coachButton"); button.disabled = true; button.textContent = translatedCopy.coaching;
    chrome.runtime.sendMessage({ type: "COACH_DRAFT", draft: text, pageContext: pageContext(), style: prefs.coachStyle, language: requestLanguage }, (plan) => {
      button.disabled = false; button.innerHTML = `${icons.spark}<span>${safe(translatedCopy.coachThisPrompt)}</span>`;
      if (!isCurrentLanguage(requestLanguage, requestEpoch)) return;
      if (chrome.runtime.lastError || plan?.error) return showError(plan?.error || translatedCopy.coachUnavailable);
      if (Number.isFinite(Number(plan.qualityScore))) {
        const score = Math.max(0, Math.min(100, Math.round(Number(plan.qualityScore))));
        const [specificity, context, goal, constraints] = starsFromAiScore(score);
        $("#score").textContent = String(score);
        $("#specificity").textContent = specificity;
        $("#contextScore").textContent = context;
        $("#goalScore").textContent = goal;
        $("#constraintScore").textContent = constraints;
        setQualityHint("qualityReviewed", "AI reviewed this score using the goal, context, details, and requested result.");
      }
      showPlan(plan); prefs.promptSkill = Math.min(100, prefs.promptSkill + 5); applyPrefs(); savePrefs();
    });
  });
  $("#coachStyle").addEventListener("change", () => { prefs.coachStyle = $("#coachStyle").value; savePrefs(); });
  const setTextAndAiLanguage = (language) => {
    const changed = language !== prefs.language;
    if (changed) {
      languageEpoch += 1;
      // AI answers already on screen belong to the old language. Hide them
      // instead of mixing them into the newly selected interface language.
      result.classList.add("hidden");
      $("#voiceResponse").classList.add("hidden");
      $("#explainAnswer").classList.add("hidden");
      $("#allControls").classList.add("hidden");
      $("#explainActions").innerHTML = "";
    }
    prefs.language = language;
    prefs.voiceLanguage = language;
    $("#language").value = language;
    $("#textLanguage").value = language;
    $("#voiceLanguage").value = language;
    savePrefs();
    // Never leave the previous language visible while a new translation is
    // being fetched. Cached languages are applied immediately; a first-time
    // language temporarily uses the safe base copy until its translation lands.
    translatedCopy = { ...baseCopy, ...(language === "English" ? {} : (interfaceTranslations.get(language) || {})) };
    applyCopy();
    populateVoices();
    translateInterface();
  };
  $("#language").addEventListener("change", () => setTextAndAiLanguage($("#language").value));
  $("#textLanguage").addEventListener("change", () => setTextAndAiLanguage($("#textLanguage").value));
  $("#voiceLanguage").addEventListener("change", () => { prefs.voiceLanguage = $("#voiceLanguage").value; savePrefs(); populateVoices(); });
  $("#voiceStyle").addEventListener("change", () => { prefs.voiceStyle = $("#voiceStyle").value; savePrefs(); populateVoices(); });
  $("#voiceSelect").addEventListener("change", () => { prefs.voiceName = $("#voiceSelect").value; savePrefs(); });
  $("#voiceTest").addEventListener("click", () => speakText(translatedCopy.voiceGreeting || "Great job. My Helper is ready to guide you, one comfortable step at a time."));
  $("#speechEnabled").addEventListener("change", () => {
    prefs.speechEnabled = $("#speechEnabled").checked;
    if (!prefs.speechEnabled && window.speechSynthesis) window.speechSynthesis.cancel();
    savePrefs(); applyPrefs();
  });
  $("#voiceActivation").addEventListener("change", () => {
    prefs.voiceActivation = $("#voiceActivation").checked;
    savePrefs(); applyPrefs();
    if (prefs.voiceActivation) resumeWakeListening();
    if (!prefs.voiceActivation) pauseVoiceListening();
  });
  $("#visualAnalysis").addEventListener("change", () => {
    prefs.visualAnalysis = $("#visualAnalysis").checked;
    savePrefs(); applyPrefs();
  });
  $("#autoTips").addEventListener("change", () => { prefs.autoTips = $("#autoTips").checked; if (!prefs.autoTips) tip.classList.add("hidden"); savePrefs(); });
  $("#largeText").addEventListener("change", () => { prefs.largeText = $("#largeText").checked; applyPrefs(); savePrefs(); });
  $("#highContrast").addEventListener("change", () => { prefs.highContrast = $("#highContrast").checked; applyPrefs(); savePrefs(); });
  $("#tipAccept").addEventListener("click", () => { tip.classList.add("hidden"); panel.classList.add("open"); openCoach(composerText()); });
  $("#tipDismiss").addEventListener("click", () => tip.classList.add("hidden"));
  document.addEventListener("input", (event) => {
    if (!prefs.autoTips) return;
    const composer = targetComposer();
    // Only react to the actual visible ChatGPT composer. This prevents a tip
    // about an unrelated search, settings, or other text field.
    if (!composer || !(event.composedPath?.().includes(composer) || event.target === composer)) return;
    const text = composerText();
    if (!draftQualityCheck(text).valid || text.trim().split(/\s+/).length > 30) return tip.classList.add("hidden");
    $("#tipText").textContent = translatedCopy.tipText || "Select Coach this to review the exact words you wrote before sending them.";
    tip.classList.remove("hidden");
  }, true);
  showView("home");
})()
