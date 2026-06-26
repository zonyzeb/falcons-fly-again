// Admin-only member invites — shared core used by both the Vercel serverless
// function (this file's default export) and the local Vite dev middleware
// (see frontend/vite.config.ts), so invites behave the same in dev and prod.
//
// Securely inviting a user requires the Supabase service-role key, which must
// NEVER ship in the browser bundle. This always runs server-side.
//
// Required env vars:
//   SUPABASE_URL                — same value as VITE_SUPABASE_URL
//   SUPABASE_ANON_KEY           — same value as VITE_SUPABASE_ANON_KEY
//   SUPABASE_SERVICE_ROLE_KEY   — service_role secret (server-only, never VITE_*)

async function getCallerUser(env, token) {
  const res = await fetch(`${env.url}/auth/v1/user`, {
    headers: { apikey: env.anon, Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  return res.json();
}

async function isAdmin(env, userId) {
  const res = await fetch(
    `${env.url}/rest/v1/profiles?id=eq.${userId}&select=role`,
    { headers: { apikey: env.service, Authorization: `Bearer ${env.service}` } }
  );
  if (!res.ok) return false;
  const rows = await res.json();
  return Array.isArray(rows) && rows[0]?.role === "admin";
}

/**
 * Framework-agnostic invite handler.
 * @returns {{ status: number, body: object }}
 */
async function handleInvite({ method, token, body, origin }) {
  const env = {
    url: process.env.SUPABASE_URL,
    anon: process.env.SUPABASE_ANON_KEY,
    service: process.env.SUPABASE_SERVICE_ROLE_KEY,
  };

  if (method !== "POST") return { status: 405, body: { error: "Method not allowed" } };
  if (!env.url || !env.anon || !env.service) {
    return { status: 500, body: { error: "Server is missing Supabase environment variables." } };
  }
  if (!token) return { status: 401, body: { error: "Not signed in." } };

  const caller = await getCallerUser(env, token);
  if (!caller?.id) return { status: 401, body: { error: "Invalid session." } };
  if (!(await isAdmin(env, caller.id))) return { status: 403, body: { error: "Admins only." } };

  const data = typeof body === "string" ? JSON.parse(body || "{}") : body || {};
  const email = (data.email || "").trim().toLowerCase();
  const role = data.role === "admin" ? "admin" : "member";
  const playerId = data.player_id != null ? String(data.player_id) : null;
  const fullName = (data.full_name || "").trim();

  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return { status: 400, body: { error: "A valid email is required." } };
  }

  const inviteRes = await fetch(`${env.url}/auth/v1/invite`, {
    method: "POST",
    headers: {
      apikey: env.service,
      Authorization: `Bearer ${env.service}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      data: { full_name: fullName, role, player_id: playerId },
      redirect_to: `${origin}/auth/callback`,
    }),
  });

  const payload = await inviteRes.json().catch(() => ({}));
  if (!inviteRes.ok) {
    return {
      status: inviteRes.status,
      body: { error: payload.msg || payload.error_description || "Invite failed." },
    };
  }
  return { status: 200, body: { ok: true, email } };
}

// Vercel serverless entry point.
module.exports = async (req, res) => {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  const origin = req.headers.origin || `https://${req.headers.host}`;

  const { status, body } = await handleInvite({
    method: req.method,
    token,
    body: req.body,
    origin,
  });

  if (status === 405) res.setHeader("Allow", "POST");
  return res.status(status).json(body);
};

module.exports.handleInvite = handleInvite;
