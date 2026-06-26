# Falcons — Supabase auth email templates

Branded HTML for the Supabase auth emails. Paste each file's contents into:
**Supabase dashboard → Authentication → Emails → Templates**, picking the matching
template and pasting into the **Message body (HTML)** box. Set the **Subject** as
listed below.

| Supabase template      | File                 | Suggested subject                          |
|------------------------|----------------------|--------------------------------------------|
| Invite user            | `invite.html`        | You're invited to join the Falcons 🦅       |
| Magic Link             | `magic-link.html`    | Your Falcons sign-in link                  |
| Confirm signup         | `confirmation.html`  | Confirm your Falcons account               |
| Reset Password         | `recovery.html`      | Reset your Falcons password                |

Notes
- All templates use `{{ .ConfirmationURL }}` — Supabase fills in the correct
  action link per email type. Don't change that token.
- The sender **name/address** (e.g. `Falcons Cricket Club <noreply@falconsif.se>`)
  is NOT set here — that's configured under **Authentication → Settings → SMTP
  Settings** once custom SMTP is enabled. These files only style the body.
- **Logo:** templates use a text wordmark by default. To use the real logo,
  host `falcons-logo.png` somewhere public (e.g. `https://falconsif.se/falcons-logo.png`)
  and replace the `<!-- LOGO -->` block in each file with:
  `<img src="https://falconsif.se/falcons-logo.png" width="56" height="56" alt="Falcons" style="display:block;border-radius:12px;" />`
- Colours match the site: navy `#0a0f1e`, card `#0d1424`, gold `#EAB44A`, cream `#F5F2EC`.
- Tested to render in Gmail, Apple Mail, and Outlook (table-based, inline styles).
