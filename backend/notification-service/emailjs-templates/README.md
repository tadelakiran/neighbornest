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
| `otp-verification.html` | `otp-verification` | `to_email`, `subject`, `otpCode`, `expiryMinutes`, `appName`, `supportEmail` |
| `password-reset.html` | `password-reset` | `to_email`, `subject`, `otpCode`, `expiryMinutes`, `appName`, `supportEmail` |
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
