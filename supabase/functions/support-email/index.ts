import { createClient } from "npm:@supabase/supabase-js@2";

const MAX_REQUESTS_PER_HOUR = 5;
const ALLOWED_CATEGORIES = new Set(["technical", "account", "feedback", "other"]);
// The public repository hosts the source image. A regular HTTPS image avoids
// Gmail presenting the brand mark as a downloadable attachment.
const LOGO_URL = "https://raw.githubusercontent.com/Theophilus20/my-helper/main/assets/icon-128.png";

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    "\"": "&quot;"
  })[character] || character);
}

function categoryLabel(category: string) {
  return {
    technical: "Technical issue",
    account: "Account and data",
    feedback: "Feedback",
    other: "Other"
  }[category] || "Other";
}

function emailFrame(input: {
  preheader: string;
  title: string;
  eyebrow: string;
  content: string;
  includeSafetyFooter?: boolean;
}) {
  const safetyFooter = input.includeSafetyFooter === false ? "" : `
            <tr>
              <td style="padding:20px 28px;background:#ede5ff;border-top:1px solid #14251b;font-size:13px;line-height:1.55;color:#35473c;">
                My Helper is an independent learning companion for ChatGPT and Codex. Please do not reply with passwords, API keys, or private ChatGPT conversations.
              </td>
            </tr>`;

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${input.title}</title>
  </head>
  <body style="margin:0;padding:0;background:#f5f1e8;color:#14251b;font-family:Arial,Helvetica,sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${input.preheader}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f5f1e8;">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:620px;background:#fffdf7;border:1px solid #14251b;">
            <tr>
              <td style="padding:22px 28px;background:#b8dfc6;border-bottom:1px solid #14251b;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td width="48" valign="middle">
                      <img src="${LOGO_URL}" width="42" height="42" alt="My Helper" style="display:block;width:42px;height:42px;border:0;border-radius:21px;outline:none;text-decoration:none;">
                    </td>
                    <td valign="middle" style="padding-left:12px;">
                      <div style="font-size:16px;font-weight:800;letter-spacing:.3px;color:#14251b;">MY HELPER</div>
                      <div style="margin-top:3px;font-size:11px;letter-spacing:1.2px;color:#274334;">YOUR PERSONAL AI COACH</div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:34px 28px 28px;">
                <div style="font-size:11px;font-weight:700;letter-spacing:1.4px;color:#456a55;text-transform:uppercase;">${input.eyebrow}</div>
                <h1 style="margin:10px 0 16px;font-size:30px;line-height:1.14;letter-spacing:-.8px;color:#14251b;">${input.title}</h1>
                ${input.content}
              </td>
            </tr>
            ${safetyFooter}
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function inboxEmail(input: { reference: string; label: string; email: string; message: string }) {
  return emailFrame({
    preheader: `New ${input.label.toLowerCase()} request: ${input.reference}`,
    eyebrow: "Support inbox",
    title: "A new support request is ready.",
    includeSafetyFooter: false,
    content: `
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 22px;border:1px solid #14251b;background:#ffcf4f;">
        <tr>
          <td style="padding:16px 18px;">
            <div style="font-size:11px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:#51400b;">Ticket reference</div>
            <div style="margin-top:5px;font-size:22px;font-weight:800;letter-spacing:.4px;color:#14251b;">${input.reference}</div>
          </td>
        </tr>
      </table>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 22px;border:1px solid #c8d0c9;">
        <tr>
          <td style="padding:14px 16px;border-bottom:1px solid #c8d0c9;font-size:14px;line-height:1.5;"><strong>Category</strong><br><span style="color:#456a55;">${escapeHtml(input.label)}</span></td>
        </tr>
        <tr>
          <td style="padding:14px 16px;font-size:14px;line-height:1.5;"><strong>Signed-in account</strong><br><a href="mailto:${input.email}" style="color:#1f6344;text-decoration:underline;">${input.email}</a></td>
        </tr>
      </table>
      <div style="margin:0 0 8px;font-size:14px;font-weight:700;color:#14251b;">User message</div>
      <div style="padding:17px 18px;border-left:4px solid #ff916e;background:#fff7ef;font-size:15px;line-height:1.65;color:#24352b;">${input.message}</div>
      <p style="margin:22px 0 0;font-size:14px;line-height:1.6;color:#456a55;">Reply directly to this email to contact the signed-in user. Keep the ticket reference in your reply.</p>`
  });
}

function confirmationEmail(reference: string) {
  return emailFrame({
    preheader: `We received your My Helper support message. Reference: ${reference}`,
    eyebrow: "Support request received",
    title: "Thanks for contacting My Helper.",
    content: `
      <p style="margin:0 0 22px;font-size:16px;line-height:1.65;color:#314238;">Your message is safely with our support team. We will reply to this email if we need more information.</p>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 22px;border:1px solid #14251b;background:#ffcf4f;">
        <tr>
          <td style="padding:17px 18px;">
            <div style="font-size:11px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:#51400b;">Your support reference</div>
            <div style="margin-top:5px;font-size:24px;font-weight:800;letter-spacing:.5px;color:#14251b;">${reference}</div>
          </td>
        </tr>
      </table>
      <div style="padding:17px 18px;border:1px solid #b9c9be;background:#f5fbf6;">
        <div style="font-size:14px;font-weight:800;color:#14251b;">What happens next</div>
        <ol style="margin:10px 0 0;padding-left:20px;font-size:14px;line-height:1.7;color:#314238;">
          <li>Our support team reviews your request.</li>
          <li>We reply here if we need details or have an update.</li>
          <li>You can keep this reference for your records.</li>
        </ol>
      </div>
      <p style="margin:22px 0 0;font-size:13px;line-height:1.6;color:#456a55;">For your privacy, this email does not repeat the message you sent.</p>`
  });
}

function requiredEnvironment(name: string) {
  const value = Deno.env.get(name)?.trim();
  if (!value) throw new Error(`Missing required environment setting: ${name}`);
  return value;
}

async function sendEmail(
  resendKey: string,
  payload: {
    from: string;
    to: string[];
    subject: string;
    html: string;
    text: string;
    reply_to?: string;
  }
) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    // Do not log ticket text, email addresses, tokens, or the provider response.
    console.error("Support email delivery failed", { status: response.status });
    return false;
  }
  return true;
}

Deno.serve(async (request) => {
  if (request.method !== "POST") return json({ error: "Method not allowed." }, 405);

  try {
    const supabaseUrl = requiredEnvironment("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY");
    if (!anonKey) throw new Error("Missing required environment setting: SUPABASE_ANON_KEY");

    const serviceRoleKey = requiredEnvironment("SUPABASE_SERVICE_ROLE_KEY");
    const resendKey = requiredEnvironment("RESEND_API_KEY");
    const supportFrom = requiredEnvironment("SUPPORT_FROM_EMAIL");
    const supportInbox = requiredEnvironment("SUPPORT_INBOX_EMAIL");
    const authorization = request.headers.get("Authorization") || "";

    if (!authorization.startsWith("Bearer ")) {
      return json({ error: "Please sign in before sending support." }, 401);
    }

    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authorization } }
    });
    const token = authorization.slice("Bearer ".length);
    const { data: authData, error: authError } = await authClient.auth.getUser(token);
    const user = authData.user;

    if (authError || !user?.id || !user.email) {
      return json({ error: "Your sign-in has expired. Please sign in again before sending support." }, 401);
    }

    let input: { category?: unknown; message?: unknown };
    try {
      input = await request.json();
    } catch {
      return json({ error: "Please write a support message before sending." }, 400);
    }

    const category = typeof input.category === "string" && ALLOWED_CATEGORIES.has(input.category)
      ? input.category
      : "other";
    const message = typeof input.message === "string" ? input.message.trim() : "";

    if (message.length < 10) {
      return json({ error: "Please describe the issue in at least a few words." }, 400);
    }
    if (message.length > 2000) {
      return json({ error: "Please keep the support message under 2,000 characters." }, 400);
    }

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // The database trigger enforces the same limit, which also protects against races.
    const { count, error: countError } = await admin
      .from("support_requests")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gt("created_at", new Date(Date.now() - 60 * 60 * 1000).toISOString());

    if (countError) throw countError;
    if ((count || 0) >= MAX_REQUESTS_PER_HOUR) {
      return json({ error: "You have sent several support messages. Please wait a little while before sending another." }, 429);
    }

    const { data: ticket, error: insertError } = await admin
      .from("support_requests")
      .insert({ user_id: user.id, email: user.email, category, message })
      .select("id")
      .single();

    if (insertError || !ticket?.id) {
      if (String(insertError?.message || "").toLowerCase().includes("support request limit")) {
        return json({ error: "You have sent several support messages. Please wait a little while before sending another." }, 429);
      }
      throw insertError || new Error("Could not save support ticket");
    }

    const reference = `MH-${ticket.id.replace(/-/g, "").slice(0, 8).toUpperCase()}`;
    const safeMessage = escapeHtml(message).replace(/\n/g, "<br>");
    const safeEmail = escapeHtml(user.email);
    const label = categoryLabel(category);

    const [inboxSent, confirmationSent] = await Promise.all([
      sendEmail(resendKey, {
        from: supportFrom,
        to: [supportInbox],
        reply_to: user.email,
        subject: `[My Helper ${reference}] ${label}`,
        html: inboxEmail({ reference, label, email: safeEmail, message: safeMessage }),
        text: `New My Helper support message\n\nReference: ${reference}\nCategory: ${label}\nSigned-in account: ${user.email}\n\nMessage:\n${message}\n\nReply directly to this email to contact the user.`
      }),
      sendEmail(resendKey, {
        from: supportFrom,
        to: [user.email],
        reply_to: supportInbox,
        subject: `We received your My Helper support message (${reference})`,
        html: confirmationEmail(reference),
        text: `Thanks for contacting My Helper.\n\nWe received your support message. Your reference is ${reference}.\n\nOur team will review it and reply to this email if we need more information. For your privacy, this confirmation does not repeat the message you sent.`
      })
    ]);

    const deliveryUpdate: Record<string, string> = {};
    if (inboxSent) deliveryUpdate.support_notification_sent_at = new Date().toISOString();
    if (confirmationSent) deliveryUpdate.confirmation_sent_at = new Date().toISOString();
    if (Object.keys(deliveryUpdate).length) {
      const { error: updateError } = await admin
        .from("support_requests")
        .update(deliveryUpdate)
        .eq("id", ticket.id);
      if (updateError) console.error("Support delivery audit update failed", { code: updateError.code || "unknown" });
    }

    if (!inboxSent || !confirmationSent) {
      // The ticket is safely stored, even if the email provider is momentarily unavailable.
      return json({
        sent: true,
        reference,
        note: "We received your message. Email confirmation may arrive later."
      }, 202);
    }

    return json({ sent: true, reference });
  } catch (error) {
    // Keep provider, database, and configuration details out of the extension response.
    console.error("Support function failed", { name: error instanceof Error ? error.name : "unknown" });
    return json({ error: "We could not send your support message right now. Please try again." }, 503);
  }
});
