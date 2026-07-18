# My Helper

> Your personal AI coach for ChatGPT and Codex.

My Helper is a supportive Chrome extension that helps people become confident using ChatGPT and Codex while they work. It explains visible features in plain language, highlights the real place to click, helps users improve prompts, and offers guided learning with multilingual text and voice support.

My Helper is designed for people who may be new to AI, including older adults and anyone who wants calm, step-by-step help rather than a technical explanation.

## The problem

Having access to ChatGPT or Codex does not automatically make someone comfortable using them. People may not know what to ask, what a button does, where a setting is located, why a response was not useful, or how to turn an idea into an app.

My Helper teaches these skills in the moment. It does not replace ChatGPT or Codex. It helps people learn to use them independently.

## What My Helper does

### Explains the page in front of the user

My Helper reads the current ChatGPT route and visible controls, then explains what the screen is for in clear, non-judgmental language. It does not automatically read chat history.

### Highlights real controls

When a user asks where to find something, My Helper maps live visible controls on the current page, scrolls to the selected element, outlines it, and can speak the guidance aloud.

### Coaches prompts without interrupting

Users can paste or write a prompt and choose **Coach this prompt**. My Helper gives encouraging feedback, shows what is missing, suggests an improved version, and asks the AI to score the prompt only after that explicit action.

### Guides learning while people work

The extension includes lessons and practical guidance for ChatGPT, Codex, prompting, projects, automation, agents, APIs, and professional AI workflows.

### Supports language, voice, and accessibility

My Helper supports multilingual interface text and AI guidance, browser speech recognition, installed system voices, optional cloud speech fallback, large text, high contrast, keyboard controls, captions, and a movable assistant bubble.

## How it works

1. A person opens ChatGPT in Chrome and uses it normally.
2. They open My Helper when they want guidance.
3. My Helper maps only the page route and visible controls needed for the request.
4. The user deliberately chooses an action, such as coaching a prompt, explaining a page, or asking where a feature is.
5. The secure coach service returns a structured explanation. My Helper displays it as an overlay and, when helpful, highlights the matching live control.

The current production architecture diagram is supplied separately with the Devpost submission. It contains no keys, prompts, screenshots, or personal information.

## Privacy and user control

My Helper is built around deliberate sharing and user control.

- It never sends a message into a user’s ChatGPT conversation or presses ChatGPT’s Send button.
- It does not automatically read chat history, upload files, or change ChatGPT account settings.
- A draft is sent for AI coaching only after the user selects **Coach this prompt**.
- Visible-tab analysis is optional, requires user action, and is used only for the requested page explanation. My Helper does not store the captured image.
- API keys remain in secure server environments. They are never included in the Chrome extension bundle.
- My Helper stores only the signed-in user’s product preferences, learning progress, and deliberately submitted support requests.
- A user can permanently delete their My Helper account and synchronized My Helper data. This does not delete their Google account.

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
- Optional OpenAI Audio Speech API fallback: `tts-1`
- Browser Web Speech APIs for installed voices and speech recognition
- Resend for transactional support email
- Node.js coach API for authenticated AI requests

## Local development setup

### Requirements

1. Google Chrome desktop
2. Node.js 18 or later
3. An OpenRouter API key
4. A Supabase project with Google sign-in enabled
5. Optional: an OpenAI Platform API key for cloud speech fallback
6. Optional: a Resend account and verified sender domain for support email

### 1. Create `.env`

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

1. Enable the Google provider under **Authentication → Providers** and add the Google OAuth client ID and secret.
2. Under **Authentication → URL Configuration**, add this redirect URL, replacing the extension ID with the ID shown at `chrome://extensions`:

   ```text
   https://YOUR_EXTENSION_ID.chromiumapp.org/supabase
   ```

3. Add the Supabase URL and publishable key to `auth-config.js`. The publishable key is safe to include in the extension; the service-role key is not.
4. Run [`supabase-support.sql`](supabase-support.sql) in the Supabase SQL Editor.
5. Deploy the `support-email` and `delete-account` Edge Functions from `supabase/functions/`.
6. Configure support-email secrets as described in [Support email delivery](SUPPORT_EMAIL_SETUP.md).

### 3. Run the local coach API

```powershell
npm start
```

### 4. Load the extension

1. Visit `chrome://extensions`.
2. Enable **Developer mode**.
3. Select **Load unpacked**.
4. Select the folder that contains `manifest.json`.
5. Open or refresh `https://chatgpt.com`.

After changing `content.js`, `background.js`, `account-gate.js`, or `manifest.json`, reload the extension and refresh ChatGPT. After changing `.env` or `server.mjs`, restart the Node server.

## Test checklist

1. Sign in with Google from **My Helper account**.
2. Open ChatGPT and select the **Need help?** bubble.
3. Choose **Improve prompt**, enter a real request, and select **Coach this prompt**.
4. Choose **Explain this page**, then use a **Show** button to confirm that the correct visible control is outlined.
5. Change text and voice languages in Settings.
6. Choose an installed voice and select **Test voice**.
7. Move the assistant bubble, refresh ChatGPT, and confirm that it returns to the saved position.
8. Submit a test support request and verify the support inbox receipt and user confirmation email.
9. Test account deletion with a test Google account. Confirm that the Supabase Auth user and related My Helper data are removed, while the Google account remains untouched.

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

After publication, replace this line with the public Chrome Web Store URL.

## Development with Codex and GPT-5.6

Codex with GPT-5.6 was used throughout the development of My Helper: planning the extension architecture, implementing the Manifest V3 overlay and background worker, refining the page-highlighting system, building multilingual coaching and voice features, implementing Supabase authentication and account deletion, adding protected support workflows, and diagnosing issues through iterative testing.

The live runtime coaching model is OpenRouter `openai/gpt-5.4-mini`, selected to manage runtime cost. It should not be described as GPT-5.6.

## Current scope

My Helper currently supports Chrome desktop on ChatGPT pages. It cannot overlay the separate native Codex desktop application. Browser voice availability depends on the operating system and installed voices. Cloud speech fallback requires a configured OpenAI Platform API key.

## License

[Apache License 2.0](LICENSE)
