// Admin-only email sender for availability requests and team announcements.
// Sends through Zoho SMTP (same account as the auth emails) — Supabase's own
// SMTP only handles auth mail, so app emails go through here.
//
// Required env vars:
//   SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
//   SMTP_HOST (e.g. smtp.zoho.eu), SMTP_USER, SMTP_PASS, SMTP_FROM
//   SMTP_ALLOW_INSECURE=1  (local dev only — skips TLS verification)

const nodemailer = require("nodemailer");

const SITE = "https://falconsif.se";
const BRAND = "#EAB44A";

function env() {
  return {
    url: process.env.SUPABASE_URL,
    anon: process.env.SUPABASE_ANON_KEY,
    service: process.env.SUPABASE_SERVICE_ROLE_KEY,
    smtpHost: process.env.SMTP_HOST || "smtp.zoho.eu",
    smtpUser: process.env.SMTP_USER,
    smtpPass: process.env.SMTP_PASS,
    smtpFrom: process.env.SMTP_FROM || `Falcons Cricket Club <${process.env.SMTP_USER}>`,
    insecure: process.env.SMTP_ALLOW_INSECURE === "1",
  };
}

async function svc(e, path) {
  const r = await fetch(`${e.url}${path}`, { headers: { apikey: e.service, Authorization: `Bearer ${e.service}` } });
  if (!r.ok) throw new Error(`Supabase ${path} -> ${r.status}`);
  return r.json();
}

async function callerIsAdmin(e, token) {
  const ur = await fetch(`${e.url}/auth/v1/user`, { headers: { apikey: e.anon, Authorization: `Bearer ${token}` } });
  if (!ur.ok) return false;
  const user = await ur.json();
  if (!user?.id) return false;
  const rows = await svc(e, `/rest/v1/profiles?id=eq.${user.id}&select=role`);
  return Array.isArray(rows) && rows[0]?.role === "admin";
}

function shell(title, intro, bodyHtml, ctaText, ctaUrl) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0f1e;margin:0;padding:32px 12px;font-family:Arial,Helvetica,sans-serif;"><tr><td align="center">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#0d1424;border:1px solid #1e2a44;border-radius:16px;overflow:hidden;">
    <tr><td align="center" style="padding:32px 32px 4px;"><div style="display:inline-block;width:52px;height:52px;line-height:52px;border-radius:14px;background:linear-gradient(135deg,${BRAND},#d97706);color:#0a0f1e;font-size:22px;font-weight:bold;">★</div>
      <div style="margin-top:12px;font-size:12px;letter-spacing:3px;color:${BRAND};font-weight:bold;">FALCONS CRICKET CLUB</div></td></tr>
    <tr><td style="padding:14px 34px 6px;"><h1 style="margin:0 0 10px;font-size:21px;color:#F5F2EC;">${title}</h1>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#9aa3b2;">${intro}</p>${bodyHtml || ""}</td></tr>
    ${ctaUrl ? `<tr><td align="center" style="padding:6px 34px 26px;"><a href="${ctaUrl}" style="display:inline-block;background:linear-gradient(135deg,${BRAND},#d97706);color:#0a0f1e;text-decoration:none;font-weight:bold;font-size:15px;padding:13px 30px;border-radius:12px;">${ctaText}</a></td></tr>` : ""}
    <tr><td style="padding:18px 34px;border-top:1px solid #1e2a44;"><p style="margin:0;font-size:12px;line-height:1.6;color:#6b7488;">Play with Pride. Fly as One.</p></td></tr>
  </table></td></tr></table>`;
}

/** Framework-agnostic core. Returns { status, body }. */
async function handleNotify({ method, token, body }) {
  const e = env();
  if (method !== "POST") return { status: 405, body: { error: "Method not allowed" } };
  if (!e.url || !e.service || !e.smtpUser || !e.smtpPass) return { status: 500, body: { error: "Server email config missing." } };
  if (!token) return { status: 401, body: { error: "Not signed in." } };
  if (!(await callerIsAdmin(e, token))) return { status: 403, body: { error: "Admins only." } };

  const data = typeof body === "string" ? JSON.parse(body || "{}") : body || {};
  const { kind, fixtureLabel, fixtureId, scope, team } = data;

  const mr = await fetch(`${e.url}/rest/v1/rpc/member_directory`, {
    method: "POST",
    headers: { apikey: e.service, Authorization: `Bearer ${e.service}`, "Content-Type": "application/json" },
    body: "{}",
  });
  if (!mr.ok) return { status: 500, body: { error: `Could not load members (${mr.status}).` } };
  let recipients = ((await mr.json()) || []).filter((m) => m.email);

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
  } else {
    return { status: 400, body: { error: "Unknown email kind." } };
  }

  if (recipients.length === 0) return { status: 200, body: { ok: true, sent: 0, note: "No recipients." } };

  const transporter = nodemailer.createTransport({
    host: e.smtpHost, port: 465, secure: true,
    auth: { user: e.smtpUser, pass: e.smtpPass },
    ...(e.insecure ? { tls: { rejectUnauthorized: false } } : {}),
  });
  await transporter.sendMail({ from: e.smtpFrom, to: e.smtpFrom, bcc: recipients.map((m) => m.email), subject, html });
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
