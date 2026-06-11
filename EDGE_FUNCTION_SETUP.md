# Email Notification Setup — Edge Function Guide

This guide walks you through deploying the `send-request-notification` Supabase
Edge Function so staff receive an email every time someone submits a ministry
request through the public portal.

---

## How it works

```
Public portal → Supabase (inserts row) → portal calls Edge Function
                                              ↓
                                         Resend API → staff email
```

The secret Resend API key lives **only** on the server inside the Edge Function.
It is never exposed to the browser.

---

## Prerequisites

| What | Where |
|---|---|
| Supabase CLI | https://supabase.com/docs/guides/cli |
| Resend account (free tier works) | https://resend.com |
| A verified sender domain in Resend | Resend → Domains |

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

## Step 3 — Get your Resend API key

1. Sign up at https://resend.com
2. Go to **API Keys** → **Create API Key** (full access)
3. Copy the key (it starts with `re_`)
4. Go to **Domains** → verify the domain you want to send from
   (e.g. `mail.yourchurch.org`). This is required to send to external addresses.
   - For testing only, Resend lets you send to your own verified email without a custom domain.

---

## Step 4 — Set Edge Function environment variables

Run these commands from your terminal (replace the values):

```bash
supabase secrets set RESEND_API_KEY=re_YOUR_KEY_HERE
supabase secrets set REQUEST_NOTIFICATION_TO=pastor@yourchurch.org
supabase secrets set REQUEST_NOTIFICATION_FROM="Ministry Portal <noreply@yourchurch.org>"
```

To send to multiple staff addresses, separate with commas:
```bash
supabase secrets set REQUEST_NOTIFICATION_TO="pastor@yourchurch.org,admin@yourchurch.org"
```

To verify the secrets are set:
```bash
supabase secrets list
```

---

## Step 5 — Deploy the Edge Function

From the root of the `church-dashboard` folder:

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
   Email sent. Resend ID: ... | Request: REQ-XXXX-YY
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
| Resend returns 401 | API key is wrong or expired — regenerate at resend.com |
| Resend returns 422 "from address not allowed" | Your FROM domain isn't verified in Resend yet |
| Email sends but goes to spam | Verify your DNS records in Resend → Domains |
| Request still saved even when email fails | ✅ This is correct — email failure never blocks submission |

---

## Security notes

- `RESEND_API_KEY` is a Supabase server-side secret. It is **never** sent to the browser.
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
        index.ts          ← the Edge Function
  js/
    supabase-config.js    ← notifyNewRequest() method
  portal.html             ← fires notification after insert
```
