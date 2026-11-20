// Admin-only email sender for availability requests, team announcements and
// training reminders. Sends through Zoho SMTP (same account as the auth emails)
// — Supabase's own SMTP only handles auth mail, so app emails go through here.
//
// Required env vars:
//   SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
//   SMTP_HOST (e.g. smtp.zoho.eu), SMTP_USER, SMTP_PASS, SMTP_FROM
//   SMTP_ALLOW_INSECURE=1  (local dev only — skips TLS verification)

const {
  SITE, BRAND, env, svc, memberDirectory, pendingTrainingRecipients,
  shell, trainingReminderEmail, sendBcc,
} = require("./_lib/email");

async function callerIsAdmin(e, token) {
  const ur = await fetch(`${e.url}/auth/v1/user`, { headers: { apikey: e.anon, Authorization: `Bearer ${token}` } });
  if (!ur.ok) return false;
  const user = await ur.json();
  if (!user?.id) return false;
  const rows = await svc(e, `/rest/v1/profiles?id=eq.${user.id}&select=role`);
  return Array.isArray(rows) && rows[0]?.role === "admin";
}

/** Framework-agnostic core. Returns { status, body }. */
async function handleNotify({ method, token, body }) {
  const e = env();
  if (method !== "POST") return { status: 405, body: { error: "Method not allowed" } };
  if (!e.url || !e.service || !e.smtpUser || !e.smtpPass) return { status: 500, body: { error: "Server email config missing." } };
  if (!token) return { status: 401, body: { error: "Not signed in." } };
  if (!(await callerIsAdmin(e, token))) return { status: 403, body: { error: "Admins only." } };

  const data = typeof body === "string" ? JSON.parse(body || "{}") : body || {};
  const { kind, fixtureLabel, fixtureId, sessionId, sessionLabel, scope, team } = data;

  let recipients;
  try {
    recipients = await memberDirectory(e);
  } catch (err) {
    return { status: 500, body: { error: err instanceof Error ? err.message : "Could not load members." } };
  }

  let subject, html;
  if (kind === "availability") {
    if (scope === "pending" && fixtureId) {
      const responded = new Set((await svc(e, `/rest/v1/match_availability?fixture_id=eq.${fixtureId}&select=player_id`)).map((r) => r.player_id));
      recipients = recipients.filter((m) => m.player_id == null || !responded.has(m.player_id));
    }
    subject = `Confirm your availability — ${fixtureLabel || "upcoming match"}`;
    html = shell(
      "Are you available?",
      `Please let the captain know if you can play <b style="color:#F5F2EC">${fixtureLabel || "the upcoming match"}</b>. It only takes a tap.`,
      "", "Set my availability", `${SITE}/dashboard/availability`
    );
  } else if (kind === "team") {
    const rows = (team || []).map((p) =>
      `<tr><td style="padding:4px 0;color:${BRAND};font-weight:bold;width:24px;">${p.order}</td><td style="padding:4px 0;color:#F5F2EC;">${p.name}${p.captain ? ' <span style="color:'+BRAND+';font-weight:bold;">(C)</span>' : ""}${p.keeper ? ' <span style="color:#67e8f9;font-weight:bold;">(WK)</span>' : ""}</td></tr>`
    ).join("");
    subject = `Team announced — ${fixtureLabel || "upcoming match"}`;
    html = shell(
      "The XI is in",
      `Here's the team for <b style="color:#F5F2EC">${fixtureLabel || "the match"}</b>:`,
      `<table role="presentation" width="100%" style="font-size:14px;border-collapse:collapse;margin-bottom:8px;">${rows}</table>`,
      "View on the site", `${SITE}/dashboard/availability`
    );
  } else if (kind === "training") {
    if (scope === "pending" && sessionId) {
      recipients = await pendingTrainingRecipients(e, sessionId, recipients);
    }
    ({ subject, html } = trainingReminderEmail(sessionLabel));
  } else {
    return { status: 400, body: { error: "Unknown email kind." } };
  }

  if (recipients.length === 0) return { status: 200, body: { ok: true, sent: 0, note: "No recipients." } };

  await sendBcc(e, recipients, subject, html);
  return { status: 200, body: { ok: true, sent: recipients.length } };
}

module.exports = async (req, res) => {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  try {
    const { status, body } = await handleNotify({ method: req.method, token, body: req.body });
    if (status === 405) res.setHeader("Allow", "POST");
    return res.status(status).json(body);
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : "Email failed." });
  }
};

module.exports.handleNotify = handleNotify;
