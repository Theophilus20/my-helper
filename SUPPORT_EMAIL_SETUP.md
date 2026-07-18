# Support email delivery

My Helper sends support email only after a signed-in user deliberately submits the support form. The extension sends the category and message to the protected `support-email` Supabase Edge Function. That function verifies the user's Supabase access token, derives the account email on the server, saves the ticket, sends the support inbox notification, and sends the user an automatic confirmation.

ChatGPT conversations, chat history, uploaded files, screenshots, and unsent drafts are never attached to a support ticket.

## 1. Create the support address

Create a real inbox such as `support@yourdomain.com`, or configure a forwarding address for it. You need access to this inbox because every new ticket is delivered there and user replies will return there.

## 2. Set up Resend

1. Create a [Resend](https://resend.com) account.
2. Add and verify the domain that owns your support address. Resend provides the required DNS records.
3. Create a Resend API key with permission to send email.

Do not put the Resend key in `auth-config.js`, `.env`, `background.js`, GitHub, or the Chrome extension.

## 3. Add Supabase secrets

Open **Supabase Dashboard -> Edge Functions -> Secrets**. Add these three secrets:

```text
RESEND_API_KEY=re_your_resend_key
SUPPORT_FROM_EMAIL=My Helper Support <support@yourdomain.com>
SUPPORT_INBOX_EMAIL=support@yourdomain.com
```

Supabase provides `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` to the Edge Function runtime. Do not create browser-accessible copies of the service-role key.

## 4. Apply the database policy

Run the complete [`supabase-support.sql`](supabase-support.sql) file in **Supabase Dashboard -> SQL Editor**.

The script removes browser-side ticket creation. Only the authenticated Edge Function can create a ticket. It also enforces five submitted support messages per signed-in account per hour.

## 5. Deploy the function

From the My Helper folder, run:

```powershell
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase functions deploy support-email
```

Use the project reference from your Supabase project URL. For example, the reference in `https://PROJECT_REF.supabase.co` is `PROJECT_REF`.

## 6. Test safely

1. Reload My Helper in `chrome://extensions`.
2. Open **My Helper account** and sign in with Google.
3. Submit a support message that contains only test text.
4. Confirm that it appears in `support@yourdomain.com` and that the signed-in test account receives an automatic confirmation.
5. Try sending more than five messages in an hour and confirm the sixth is politely rate-limited.

The user-facing receipt never exposes provider errors, secrets, or raw database messages.

## Operating support

Reply to users from `support@yourdomain.com`. The ticket notification includes a private reference such as `MH-ABC12345`; use it when locating the saved ticket in Supabase. Do not ask users to send passwords, API keys, ChatGPT conversations, or other sensitive information by email.
