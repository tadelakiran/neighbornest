# EmailJS templates

The notification-service now delivers email through **EmailJS** (`POST
https://api.emailjs.com/api/v1.0/email/send`). EmailJS renders the body and
subject from templates defined in its **dashboard** — so these files are
ready-to-paste copies of the old Thymeleaf templates, converted to EmailJS
`{{param}}` syntax.

## 1. Create the EmailJS account + service

1. Sign up at [emailjs.com](https://www.emailjs.com).
2. **Email Services** → **Add New Service**:
   - Prefer a **Transactional** service (e.g. Elastic Email, SendGrid, Mailgun)
     so your Elastic Email account is reused. Gmail works for dev but has
     daily limits and can trigger spam flags.
   - Give it a name and note the **Service ID** (e.g. `neighbornest_smtp`).
3. From **Account → General**, copy your **Public Key** and **Private Key**.

## 2. Create one template per file below

For every template in this folder: **Email Templates → Create New Template**,
paste the HTML into the content editor, then set:

| Field | Value |
|---|---|
| **Template ID** | must equal the id you put in `emailjs.templates.*` in `application.yml` |
| **Subject** | `{{subject}}` (the app sends the real subject as a param) |
| **To Email** | `{{to_email}}` |
| **From Email** | leave **Use default email address** checked (uses the service's sender) |

### Template key → EmailJS template id (set in `application.yml`)

| File | Config key (`emailjs.templates.*`) | Params the app sends |
|---|---|---|
| `otp-verification.html` | `otp-verification` | `to_email`, `subject`, `otpCode`/`passcode`, `expiryMinutes`/`time`, `appName`/`companyName`/`company_name`, `supportEmail`/`support_email` |
| `password-reset.html` | `password-reset` | `to_email`, `subject`, `otpCode`/`passcode`, `expiryMinutes`/`time`, `appName`/`companyName`/`company_name`, `supportEmail`/`support_email` |
| `welcome.html` | `welcome` | `to_email`, `subject`, `fullName`, `appName`, `dashboardLink` |
| `nest-welcome.html` | `nest-welcome` | `to_email`, `subject`, `userName`, `nestName`, `members` (joined list), `nestLink` |
| `nest-graduate.html` | `nest-graduate` | `to_email`, `subject`, `userName`, `nestName`, `nestLink` |
| `nest-disbanded.html` | `nest-disbanded` | `to_email`, `subject`, `userName`, `nestName` |
| `meeting-reminder.html` | `meeting-reminder` | `to_email`, `subject`, `userName`, `nestName`, `meetingDate`, `activityType`, `venueName`, `nestLink` |
| `expense-alert.html` | `expense-alert` | `to_email`, `subject`, `userName`, `nestName`, `description`, `amount`, `nestLink` |
| `vibe-check-reminder.html` | `vibe-check-reminder` | `to_email`, `subject`, `userName`, `nestName`, `nestLink` |
| `chat-offline.html` | `chat-offline` | `to_email`, `subject`, `userName`, `senderName`, `messagePreview`, `chatLink` |
| `raw-email.html` | `raw-email` | `to_email`, `subject`, `title`, `message` |

> 💡 **Nest city**: the old `nest-welcome` template showed
> "in {{city}}" when a city existed. EmailJS params are simple substitutions
> (no conditionals), so the city was dropped from the email body — it still
> appears in the in-app notification message.

## 3. Wire the ids into the app

Fill in `application.yml` under `emailjs:` (or set the matching
`EMAILJS_*` env vars in `backend/.env` / docker-compose):

```yaml
emailjs:
  public-key: <public key>
  private-key: <private key>     # server-side only
  service-id: <service id>
  templates:
    otp-verification: <template id>
    password-reset: <template id>
    welcome: <template id>
    nest-welcome: <template id>
    nest-graduate: <template id>
    nest-disbanded: <template id>
    meeting-reminder: <template id>
    expense-alert: <template id>
    vibe-check-reminder: <template id>
    chat-offline: <template id>
    raw-email: <template id>
```

## 4. Verify end-to-end

Restart the notification-service, then request a verification code from the
frontend (Register → "send code") or hit
`POST /api/notifications/internal/email/welcome` (guarded by
`X-Internal-Key`). Delivery logs appear in the notification-service at INFO.
EmailJS rate limit is **1 request/second**.

## Troubleshooting

Watch the notification-service logs (`docker logs neighbornest-notification`)
for the EmailJS response:

- **`422 Unprocessable Entity: "The recipients address is empty"`** — the
  template's **To Email** field is empty or not bound to the param the app
  sends. Open the template in the EmailJS dashboard → **Settings** tab and set
  **To Email** to `{{to_email}}` (the app always sends `to_email` in
  `template_params`).
- **`The template ID not found`** — the template id in `application.yml`
  (`emailjs.templates.*`) does not match any template in the account. Create
  the template in the dashboard and copy its real id into the config (or
  update the `EMAILJS_TEMPLATE_*` env var in `backend/.env` / docker-compose).
- **`API access from non-browser environments is currently disabled`** — the
  account's "Allow API access from non-browser environments" toggle in
  EmailJS **Account → Security** is off. The service sends browser-looking
  `Origin`/`Referer` headers as a workaround, but turning the toggle on is the
  proper fix.
- **The code / expiry render empty or `[company_name]` shows literally** — the
  dashboard template's placeholder names don't match the params the app sends.
  EmailJS substitutes only `{{param}}` tokens and ignores everything else, so
  square-bracket text like `[company_name]` is never replaced. The app now
  sends every OTP value under several names (`otpCode`/`passcode`,
  `expiryMinutes`/`time`, `appName`/`companyName`/`company_name`), so paste
  the template from this folder into the dashboard (or fix the existing one
  to use those `{{param}}` names) and the placeholders will fill in.

Since the notification-service now **fails the OTP request** when EmailJS
rejects it (no more phantom "code sent" success), a broken template surfaces
as `400 We couldn't send the verification code. Please try again in a moment.`
in the registration UI — the log line above tells you which template to fix.

## Forgot-password email not arriving? Walk through this checklist

The forgot-password flow is: frontend → `POST /api/auth/password/forgot`
(auth-service) → Feign → `POST /api/notifications/email/otp/send`
(notification-service) → EmailJS. If no email arrives, check in this order:

1. **Is the account registered under that exact address?** The forgot endpoint
   deliberately returns success for unknown emails (anti-enumeration) and only
   sends a code when an account exists. The auth-service logs
   `Password reset requested for <email> — no account found, no code sent`
   when this happens — grep the auth-service logs for that line. Also make
   sure there is no typo / trailing space in the address you typed.
2. **Did the request fail loudly instead?** The UI shows
   `We couldn't send the reset code...` or
   `We couldn't send the verification code...` when delivery failed. Open the
   notification-service logs for the **exact EmailJS status + body**, e.g.:
   `EmailJS rejected the email (template 'password-reset', HTTP 400): The
   template ID not found`. Then fix the config named in the error.
3. **Does the `password-reset` template exist in the dashboard?** The config
   key `emailjs.templates.password-reset` (or `EMAILJS_TEMPLATE_PASSWORD_RESET`)
   must hold the real id of a template created in the EmailJS dashboard with
   the contents of `password-reset.html`. On startup the notification-service
   also logs `EmailJS is NOT fully configured` when keys/service/template ids
   are missing — that log tells you which piece.
4. **Is "non-browser" access allowed?** If EmailJS answers with
   `API access from non-browser environments is currently disabled`, enable
   the toggle in EmailJS **Account → Security** (the app sends browser-looking
   `Origin`/`Referer` headers as a workaround, but the toggle is the real fix).
5. **Check spam / junk and the Gmail Promotions tab.** The reset email subject
   is `Reset your NeighborNest password` — search for it.
6. **Resend cooldown.** A second code within 60 seconds is rejected with
   `A code was sent recently...` by design. Wait for the countdown in the UI.

If all of the above looks right, the fastest repro is a direct call from the
notification-service host:

```bash
curl -s -X POST http://localhost:8086/api/notifications/email/otp/send \
  -H 'Content-Type: application/json' \
  -d '{"email":"you@example.com","purpose":"PASSWORD_RESET"}'
```

and watch the notification-service log line — success prints
`OTP sent to you@example.com for purpose PASSWORD_RESET`.
