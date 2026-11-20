// Automatic training reminders — invoked by Vercel Cron (see vercel.json).
// For each upcoming session with auto_remind on that hasn't been reminded
// recently, emails the players who still haven't responded, then stamps
// last_reminded_at so no one gets spammed.
//
// Auth: Vercel Cron sends "Authorization: Bearer $CRON_SECRET" when the
// CRON_SECRET env var is set. This endpoint is NOT admin-gated (no human in
// the loop) — it only runs when that secret matches.
//
// Window: sessions dated today .. today+REMIND_WITHIN_DAYS, not reminded in
// the last REMIND_COOLDOWN_HOURS.

const {
  env, svc, svcPatch, memberDirectory, pendingTrainingRecipients,
  trainingReminderEmail, sendBcc,
} = require("./_lib/email");

const REMIND_WITHIN_DAYS = 2;
const REMIND_COOLDOWN_HOURS = 20;

function ymd(d) {
  return d.toISOString().slice(0, 10);
}

function sessionLabel(s) {
  const date = new Date(s.session_date + "T00:00:00").toLocaleDateString("en-GB", {
    weekday: "short", day: "numeric", month: "short",
  });
  const time = s.start_time ? ` ${s.start_time.slice(0, 5)}` : "";
  const loc = s.location ? ` · ${s.location}` : "";
  return `${s.title ? s.title + " · " : ""}${date}${time}${loc}`;
}

async function handleCron({ method, authorization }) {
  const e = env();
  if (method !== "GET" && method !== "POST") return { status: 405, body: { error: "Method not allowed" } };
  if (!e.cronSecret) return { status: 500, body: { error: "CRON_SECRET not configured." } };
  const token = (authorization || "").startsWith("Bearer ") ? authorization.slice(7) : null;
  if (token !== e.cronSecret) return { status: 401, body: { error: "Unauthorized." } };
  if (!e.url || !e.service || !e.smtpUser || !e.smtpPass) return { status: 500, body: { error: "Server email config missing." } };

  const today = new Date();
  const until = new Date(today.getTime() + REMIND_WITHIN_DAYS * 86400000);
  const cutoff = new Date(today.getTime() - REMIND_COOLDOWN_HOURS * 3600000);

  const sessions = await svc(
    e,
    `/rest/v1/training_sessions?auto_remind=eq.true&session_date=gte.${ymd(today)}&session_date=lte.${ymd(until)}` +
      `&select=id,title,session_date,start_time,location,last_reminded_at`
  );

  const due = sessions.filter((s) => !s.last_reminded_at || new Date(s.last_reminded_at) < cutoff);
  if (due.length === 0) return { status: 200, body: { ok: true, sessions: 0, sent: 0 } };

  const directory = await memberDirectory(e);

  let totalSent = 0;
  const results = [];
  for (const s of due) {
    const recipients = await pendingTrainingRecipients(e, s.id, directory);
    if (recipients.length > 0) {
      const { subject, html } = trainingReminderEmail(sessionLabel(s));
      await sendBcc(e, recipients, subject, html);
      totalSent += recipients.length;
    }
    // Stamp even when 0 pending, so we don't re-scan it every run until cooldown.
    await svcPatch(e, `/rest/v1/training_sessions?id=eq.${s.id}`, { last_reminded_at: new Date().toISOString() });
    results.push({ session: s.id, reminded: recipients.length });
  }

  return { status: 200, body: { ok: true, sessions: due.length, sent: totalSent, results } };
}

module.exports = async (req, res) => {
  try {
    const { status, body } = await handleCron({ method: req.method, authorization: req.headers.authorization });
    if (status === 405) res.setHeader("Allow", "GET, POST");
    return res.status(status).json(body);
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : "Reminder run failed." });
  }
};

module.exports.handleCron = handleCron;
