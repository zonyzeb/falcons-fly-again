// Shared email helpers for the serverless functions (notify.js, cron-reminders.js).
// Files/dirs under api/ that start with "_" are ignored by Vercel's function
// router, so this is importable shared code, not an endpoint.

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
    cronSecret: process.env.CRON_SECRET,
  };
}

// Service-role GET against the Supabase REST API.
async function svc(e, path) {
  const r = await fetch(`${e.url}${path}`, {
    headers: { apikey: e.service, Authorization: `Bearer ${e.service}` },
  });
  if (!r.ok) throw new Error(`Supabase ${path} -> ${r.status}`);
  return r.json();
}

// Service-role PATCH against the Supabase REST API.
async function svcPatch(e, path, body) {
  const r = await fetch(`${e.url}${path}`, {
    method: "PATCH",
    headers: {
      apikey: e.service,
      Authorization: `Bearer ${e.service}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`Supabase PATCH ${path} -> ${r.status}`);
}

// All members with an email address (via the service-role RPC).
async function memberDirectory(e) {
  const mr = await fetch(`${e.url}/rest/v1/rpc/member_directory`, {
    method: "POST",
    headers: { apikey: e.service, Authorization: `Bearer ${e.service}`, "Content-Type": "application/json" },
    body: "{}",
  });
  if (!mr.ok) throw new Error(`Could not load members (${mr.status}).`);
  return ((await mr.json()) || []).filter((m) => m.email);
}

// Keep only recipients who have NOT yet responded to a training session.
// (Unlinked members — no player_id — are always included.)
async function pendingTrainingRecipients(e, sessionId, recipients) {
  const responded = new Set(
    (await svc(e, `/rest/v1/training_availability?session_id=eq.${sessionId}&select=player_id`)).map((r) => r.player_id)
  );
  return recipients.filter((m) => m.player_id == null || !responded.has(m.player_id));
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

// Email content for a training-availability reminder.
function trainingReminderEmail(sessionLabel) {
  return {
    subject: `Training — can you make it? ${sessionLabel ? "(" + sessionLabel + ")" : ""}`.trim(),
    html: shell(
      "Are you coming to training?",
      `Let us know if you can make <b style="color:#F5F2EC">${sessionLabel || "the next training session"}</b> — it only takes a tap, and it helps us plan numbers, cost and lifts.`,
      "",
      "Respond to training",
      `${SITE}/dashboard/training`
    ),
  };
}

function createTransporter(e) {
  return nodemailer.createTransport({
    host: e.smtpHost,
    port: 465,
    secure: true,
    auth: { user: e.smtpUser, pass: e.smtpPass },
    ...(e.insecure ? { tls: { rejectUnauthorized: false } } : {}),
  });
}

// Send one email, BCCing the recipient list (matches the existing notify.js flow).
async function sendBcc(e, recipients, subject, html) {
  const transporter = createTransporter(e);
  await transporter.sendMail({
    from: e.smtpFrom,
    to: e.smtpFrom,
    bcc: recipients.map((m) => m.email),
    subject,
    html,
  });
}

module.exports = {
  SITE,
  BRAND,
  env,
  svc,
  svcPatch,
  memberDirectory,
  pendingTrainingRecipients,
  shell,
  trainingReminderEmail,
  createTransporter,
  sendBcc,
};
