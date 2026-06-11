# Email Notification Setup — Edge Function Guide

This guide walks you through deploying the `send-request-notification` Supabase
Edge Function so staff receive an email every time someone submits a ministry
request through the public portal.

---

## How it works

```
Public portal → Supabase (inserts row) → portal calls Edge Function
                                              ↓
                                         Brevo API → staff email
```

The secret Brevo API key lives **only** on the server inside the Edge Function.
It is never exposed to the browser.

---

## Prerequisites

| What | Where |
|---|---|
| Supabase CLI | https://supabase.com/docs/guides/cli |
| Brevo account (free tier — no custom domain needed) | https://brevo.com |

---

## Step 1 — Install the Supabase CLI

```bash
npm install -g supabase
supabase --version   # confirm install
```

---

## Step 2 — Log in and link your project

```bash
supabase login
supabase link --project-ref tlomcujkfhgmnaiicyjj
```

When prompted, enter your Supabase database password (from Project Settings → Database).

---

## Step 3 — Get your Brevo API key

1. Sign up at https://brevo.com (free — 300 emails/day, no domain required)
2. Go to **Settings → API Keys → Generate a new API key**
3. Copy the key

---

## Step 4 — Set Edge Function environment variables

Run these commands from your terminal (replace the values with your own):

```bash
supabase secrets set BREVO_API_KEY=YOUR_BREVO_API_KEY
supabase secrets set REQUEST_NOTIFICATION_TO=pastor@yourchurch.org
supabase secrets set REQUEST_NOTIFICATION_FROM=yourchurcthemail@gmail.com
```

Notes:
- `REQUEST_NOTIFICATION_FROM` must be the email address you used to sign up with Brevo (or one you verified in Brevo → Senders)
- `REQUEST_NOTIFICATION_TO` can be multiple addresses separated by commas:
  ```bash
  supabase secrets set REQUEST_NOTIFICATION_TO="pastor@gmail.com,admin@gmail.com"
  ```

To verify the secrets are set:
```bash
supabase secrets list
```

---

## Step 5 — Deploy the Edge Function

From inside the `church-dashboard` folder:

```bash
supabase functions deploy send-request-notification --project-ref tlomcujkfhgmnaiicyjj
```

Expected output:
```
Deploying Function send-request-notification (script size: ~XX kB)
Done: send-request-notification
```

The function is now live at:
```
https://tlomcujkfhgmnaiicyjj.supabase.co/functions/v1/send-request-notification
```

---

## Step 6 — Verify in Supabase Dashboard

1. Open https://supabase.com/dashboard/project/tlomcujkfhgmnaiicyjj
2. Go to **Edge Functions** in the left sidebar
3. Confirm `send-request-notification` appears with status **Active**
4. Click it → **Logs** tab to monitor calls in real time

---

## Step 7 — Test end-to-end

1. Open `portal.html` in your browser
2. Submit a **Prayer Request** (public, not private)
3. Check your Supabase Edge Function logs — you should see:
   ```
   Email sent. Brevo messageId: ... | Request: REQ-XXXX-YY
   ```
4. Check the staff inbox — email should arrive within seconds
5. Submit a **private** prayer request (check the "Keep private" box)
6. Verify the email says "A private request has been submitted" with no personal details

---

## Troubleshooting

| Symptom | Check |
|---|---|
| No email, no log entry | Portal → DevTools Console for `[Portal] Email notification failed` |
| Edge function log shows "Missing env vars" | Re-run `supabase secrets set` and redeploy |
| Brevo returns 401 | API key is wrong — check Brevo → Settings → API Keys |
| Brevo returns 400 "sender not found" | FROM address must match your Brevo verified sender — check Brevo → Senders |
| Email sends but goes to spam | Add your FROM address as a verified sender in Brevo → Senders |
| Request still saved even when email fails | ✅ This is correct — email failure never blocks submission |

---

## Security notes

- `BREVO_API_KEY` is a Supabase server-side secret. It is **never** sent to the browser.
- The Edge Function is called with the public anon key (already in the frontend), which
  only proves the call came from a client with your project's anon key — not a guarantee
  of authenticity. This is acceptable for notification-only functions.
- Private prayer requests: the Edge Function receives the `isPrivate` flag and redacts
  all personal details from the email body automatically.
- Internal notes are **never** present in portal submissions and therefore never in emails.

---

## File locations

```
church-dashboard/
  supabase/
    functions/
      send-request-notification/
        index.ts          ← the Edge Function (uses Brevo)
  js/
    supabase-config.js    ← notifyNewRequest() method
  portal.html             ← fires notification after insert
```
