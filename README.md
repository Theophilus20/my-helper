# My Helper

> Your personal AI coach for ChatGPT and Codex.

My Helper is an educational Chrome extension that appears beside ChatGPT and helps people learn how to use ChatGPT and Codex while they work.

It explains visible ChatGPT features in plain language, highlights the real control a user needs, coaches better prompts, offers multilingual text and voice guidance, and helps users learn how to use them over time.



## Why My Helper

Having access to ChatGPT or Codex, some people might not really know what to do, what a particular feature does, or even how to write the right words to get the best result for what they want. I have actually experienced this myself, not once. Especially when I'm looking for a feature, sometimes I ask ChatGPT where it is, but after clicking the first step I forget what comes next. I end up coming back to check the instructions again, which can be a little frustrating.

## What My Helper does

### Explains the page in front of the user

My Helper reads the current ChatGPT route and its visible controls. It explains features in plain language and shows the user where to click when the user ask it.

### Highlights real controls

When a user asks where to find something, My Helper maps real visible controls on the current page, scrolls to the correct place, and outlines the matching feature.  

### Coaches prompts

My Helper gives encouraging feedback, identifies missing details, suggests a stronger prompt, and provides an AI reviewed prompt score only after the user chooses Coach this prompt.

### Guides learning while a user work

My Helper provides guided lessons for ChatGPT, Codex, prompting, projects, automation, agents, APIs, and professional AI use.

### Supports language, voice, and accessibility

My Helper supports multilingual interface text, AI responses, browser voice input, browser installed voices, and optional cloud speech when a suitable local voice is unavailable and a movable assistant bubble.

## How it works

```text
User on ChatGPT
  ↓
My Helper reads the current route and visible controls (when the user click explain this page)
  ↓
The user chooses a coaching or guidance action
  ↓
The local coach server sends the requested information to OpenRouter (OPENROUTER_MODEL=openai/gpt-5.4-mini)
  ↓
My Helper shows an explanation, coaching response, or highlighted control
```



## Privacy and user control

My Helper is built around deliberate sharing and user control.

- It never sends a message into a user’s ChatGPT conversation or presses ChatGPT’s Send button.
- It does not automatically read chat history, upload files, or change ChatGPT account settings.
- A draft is sent for AI coaching only after the user selects **Coach this prompt**.
- Visible-tab analysis is optional, requires user action, and is used only for the requested page explanation. My Helper does not store the captured image.
- API keys remain in secure server environments. They are never included in the Chrome extension bundle.
- My Helper stores only the signed-in user’s product preferences, learning progress, and deliberately submitted support requests.
- A user can permanently delete their My Helper account and synchronized My Helper data. 

Read the full [Privacy Policy](PRIVACY.md) and [Security Policy](SECURITY.md).

## Authentication, data, and support

My Helper uses Google sign-in through Supabase Auth. A person must sign in before using AI coaching or synchronized account features. The language picker remains available before sign-in so people can understand the account screen in their preferred language.

Supabase stores the following My Helper data behind row-level security:

- profile and accessibility preferences
- learning progress and achievements
- support requests a signed-in user deliberately sends

Support messages are handled by a protected Supabase Edge Function. It verifies the signed-in session, rate limits requests, saves the ticket, notifies the support inbox, and sends the user an automatic confirmation. The extension never sends support tickets directly to the database.

The protected `delete-account` Edge Function revokes the session and permanently deletes the My Helper Supabase user and related My Helper data. Signing in again with Google starts a fresh My Helper account; Google account data is not deleted.

## Technology

- Chrome Manifest V3 extension
- Shadow DOM overlay, live DOM mapping, Chrome Storage, and Chrome Identity
- Supabase Auth, Postgres with row-level security, and Edge Functions
- OpenRouter runtime model: `openai/gpt-5.4-mini`
- OpenAI Audio Speech API fallback: `tts-1`
- Browser Web Speech APIs for installed voices and speech recognition
- Resend for transactional support email
- Node.js coach API for authenticated AI requests

## Local development setup

These instructions let a judge or developer run My Helper with their own accounts and keys. No private key, service-role key, user account, or production database access is required from this repository.

### Requirements

1. Google Chrome desktop.
2. Node.js 18 or later.
3. An OpenRouter API key for AI coaching.
4. A Supabase project with Google sign-in enabled.
5. Optional: an OpenAI Platform API key for cloud speech fallback.
6. Optional: a Resend account and verified sender domain for support-email delivery.

### 1. Get the project and create `.env`

Clone the repository and enter the project folder:

```bash
git clone https://github.com/Theophilus20/my-helper.git
cd my-helper
```

Copy `.env.example` to `.env` and add your own server-only values.

```env
OPENROUTER_API_KEY=your_openrouter_key
OPENROUTER_MODEL=openai/gpt-5.4-mini
OPENAI_API_KEY=optional_openai_key_for_tts
OPENAI_TTS_MODEL=tts-1
OPENAI_TTS_VOICE=nova
SUPABASE_URL=https://YOUR-PROJECT-ID.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_YOUR_KEY
PORT=8787
```

Never commit, publish, or share `.env`.

### 2. Configure Supabase

1. Create a Supabase project.
2. Enable the Google provider under **Authentication → Providers** and add the Google OAuth client ID and secret.
3. Add your Supabase URL and publishable key to `auth-config.js`. The publishable key is safe to include in the extension; never add a service-role key to the extension.
4. Run [`supabase-support.sql`](supabase-support.sql) in the Supabase SQL Editor.
5. Deploy the `support-email` and `delete-account` Edge Functions from `supabase/functions/`. Support email is optional for a core coaching test; follow [Support email delivery](SUPPORT_EMAIL_SETUP.md) when configuring it.

Do not add the Google redirect URL yet. Chrome creates the local extension ID after the extension is loaded in the next steps.

### 3. Point the local extension to the local server

For a local-only build, change `backend-config.js` to use:

```js
coachApiBaseUrl: "http://localhost:8787"
```

Also add the following entry to the `host_permissions` array in `manifest.json`:

```text
http://localhost:8787/*
```

Keep the production Render URL and production-only permissions for a Chrome Web Store build. Do not publish the local `localhost` permission in a production package.

### 4. Run the local coach API

Start the server from the project folder:

```powershell
npm start
```

Leave this terminal running. The local health check is available at `http://localhost:8787/health` and should return `{"ready":true}`.

### 5. Load the extension and add the Google redirect URL

1. Visit `chrome://extensions`.
2. Enable **Developer mode**.
3. Select **Load unpacked**.
4. Select the folder that contains `manifest.json`.
5. Copy the Extension ID displayed by Chrome.
6. In Supabase under **Authentication → URL Configuration**, add this redirect URL, replacing the placeholder with that Extension ID:

   ```text
   https://YOUR_EXTENSION_ID.chromiumapp.org/supabase
   ```

7. Open or refresh `https://chatgpt.com`.

### 6. Sign in and start My Helper

1. Open the My Helper extension popup or dashboard.
2. Sign in with Google.
3. Open ChatGPT and select the **Need help?** bubble.
4. Choose a coaching action, such as **Explain this page** or **Improve prompt**.

### Test data and test checklist

No sample database records are needed. My Helper creates its own preference and progress records after a person signs in. Use a test Google account when testing support messages or account deletion.

1. Open ChatGPT and select the **Need help?** bubble.
2. Choose **Improve prompt** and enter this sample prompt:

   ```text
   Create a budgeting app for university students.
   ```

3. Select **Coach this prompt**. Confirm that My Helper gives a helpful review, a score, and an improved prompt.
4. Choose **Explain this page**. Confirm that My Helper explains the current ChatGPT page without navigating away from it.
5. Select a **Show** button. Confirm that the matching visible ChatGPT feature is outlined and that the voice explanation stays focused on that feature.
6. Change the text and voice language in Settings. Confirm that the interface and AI response use the selected language.
7. Choose an installed voice and select **Test voice**.
8. Move the My Helper bubble, refresh ChatGPT, and confirm that it returns to the saved position.
9. Submit a test support request. Confirm that the support inbox receives the request and the user receives an automatic confirmation email when support email is configured.
10. Use a test Google account to test account deletion. Confirm that the Supabase Auth user and related My Helper data are removed while the Google account remains untouched.

### Reloading after changes

After changing `content.js`, `background.js`, `account-gate.js`, `backend-config.js`, or `manifest.json`, reload the extension in `chrome://extensions` and refresh ChatGPT. After changing `.env` or `server.mjs`, stop the Node server and run `npm start` again.
## Production deployment

The extension must point to a deployed HTTPS coach API before it is published to the Chrome Web Store. The production API must:

- keep OpenRouter and optional OpenAI API keys in host environment variables
- verify every signed-in user session with Supabase
- rate limit authenticated coaching and speech requests
- use HTTPS and a health endpoint
- never expose secret or service-role keys to the extension

Before store publication, set the extension’s API base URL and its exact `host_permissions` entry to the deployed coach API domain. Remove localhost permissions from the production build.

## Chrome Web Store

Extension link: Coming soon.


## Development with Codex and GPT-5.6

Codex with GPT-5.6 was used throughout the development of My Helper: planning the extension architecture, implementing the Manifest V3 overlay and background worker, refining the page-highlighting system, building multilingual coaching and voice features, implementing Supabase authentication and account deletion, adding protected support workflows, and diagnosing issues through iterative testing.

The live runtime coaching model is OpenRouter `openai/gpt-5.4-mini`, selected to manage runtime cost. 

## Current scope

My Helper currently supports Chrome desktop on ChatGPT pages. It cannot overlay the separate native Codex desktop application. Browser voice availability depends on the operating system and installed voices. Cloud speech fallback requires a configured OpenAI Platform API key.

## License

[Apache License 2.0](LICENSE)
