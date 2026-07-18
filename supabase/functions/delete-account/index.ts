import { createClient } from "npm:@supabase/supabase-js@2";

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}

function requiredEnvironment(name: string) {
  const value = Deno.env.get(name)?.trim();
  if (!value) throw new Error(`Missing required environment setting: ${name}`);
  return value;
}

Deno.serve(async (request) => {
  if (request.method !== "POST") return json({ error: "Method not allowed." }, 405);

  try {
    let body: { confirm?: unknown };
    try {
      body = await request.json();
    } catch {
      return json({ error: "Please confirm account deletion before continuing." }, 400);
    }
    if (body.confirm !== true) {
      return json({ error: "Please confirm account deletion before continuing." }, 400);
    }

    const authorization = request.headers.get("Authorization") || "";
    if (!authorization.startsWith("Bearer ")) {
      return json({ error: "Please sign in before deleting your account." }, 401);
    }

    const supabaseUrl = requiredEnvironment("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY");
    if (!anonKey) throw new Error("Missing required environment setting: SUPABASE_ANON_KEY");
    const serviceRoleKey = requiredEnvironment("SUPABASE_SERVICE_ROLE_KEY");
    const token = authorization.slice("Bearer ".length);

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authorization } },
      auth: { autoRefreshToken: false, persistSession: false }
    });
    const { data: authData, error: authError } = await userClient.auth.getUser(token);
    const user = authData.user;
    if (authError || !user?.id) {
      return json({ error: "Your sign-in has expired. Please sign in again before deleting your account." }, 401);
    }

    // Revoke refresh tokens before deleting the auth record. A deleted user can
    // no longer renew a session; the extension also clears its local session.
    const { error: signOutError } = await userClient.auth.signOut({ scope: "global" });
    if (signOutError) console.error("Account session revocation failed", { name: signOutError.name || "unknown" });

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });
    // Default behaviour is permanent deletion. Foreign-key cascades remove the
    // My Helper profile, learning progress, and support records.
    const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
    if (deleteError) throw deleteError;

    return json({ deleted: true });
  } catch (error) {
    // Never expose provider, database, or account details in the extension.
    console.error("Account deletion failed", { name: error instanceof Error ? error.name : "unknown" });
    return json({ error: "We could not delete your My Helper account right now. Please try again." }, 503);
  }
});
