/**
 * send-request-notification
 * ─────────────────────────────────────────────────────────────────
 * Supabase Edge Function — sends an email to church staff whenever
 * a new ministry request is submitted through the public portal.
 *
 * Email provider: Resend (https://resend.com)
 *
 * Required environment variables (set via `supabase secrets set`):
 *   RESEND_API_KEY              — your Resend API key (re_xxxx…)
 *   REQUEST_NOTIFICATION_TO     — recipient(s), comma-separated
 *   REQUEST_NOTIFICATION_FROM   — verified sender address
 *
 * Invoked by: portal.html → SupabaseDB.notifyNewRequest()
 * HTTP method: POST
 * Body (JSON):
 *   requestId    string   required
 *   type         string   required  (prayer|help|pantry|pastoral|volunteer)
 *   typeName     string
 *   urgency      string
 *   submittedAt  string   ISO timestamp
 *   isPrivate    boolean  if true, sensitive details are redacted
 *   data         object   form fields submitted by the requester
 */

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ── Email HTML builder ────────────────────────────────────────────

function row(label: string, value: string): string {
  if (!value) return "";
  return `
    <tr>
      <td style="padding:8px 0;border-bottom:1px solid #e2e8f0;width:140px;color:#64748b;font-size:.84rem;font-weight:600;vertical-align:top">${label}</td>
      <td style="padding:8px 0 8px 16px;border-bottom:1px solid #e2e8f0;font-size:.84rem;color:#1e293b;vertical-align:top">${escHtml(value)}</td>
    </tr>`;
}

function escHtml(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function urgencyColor(urgency: string): string {
  const map: Record<string, string> = {
    High: "#dc2626", Emergency: "#dc2626",
    Medium: "#d97706", Low: "#64748b",
  };
  return map[urgency] || "#64748b";
}

function buildSummaryRows(type: string, data: Record<string, unknown>): string {
  const str = (v: unknown) => (v != null ? String(v) : "");
  switch (type) {
    case "prayer":
      return row("Request", str(data.request)) +
        row("Contact Method", str(data.contactMethod));
    case "help":
      return row("Type of Help", str(data.helpType)) +
        row("Description", str(data.description)) +
        row("Household Size", str(data.householdSize)) +
        row("Contact Method", str(data.contactMethod));
    case "pantry":
      return row("Household Size", str(data.householdSize)) +
        row("Dietary Restrictions", str(data.dietaryRestrictions)) +
        row("Preferred Pickup", str(data.pickupDay));
    case "pastoral":
      return row("Person", str(data.personName)) +
        row("Location", str(data.location)) +
        row("Visit Type", str(data.visitType)) +
        row("Notes", str(data.notes));
    case "volunteer":
      return row(
        "Interests",
        Array.isArray(data.interests) ? data.interests.join(", ") : str(data.interests),
      ) +
        row("Availability", str(data.availability)) +
        row("Skills", str(data.skills));
    default:
      return "";
  }
}

function buildEmailHtml(payload: {
  requestId: string;
  typeName: string;
  urgency: string;
  submittedAt: string;
  isPrivate: boolean;
  data: Record<string, unknown>;
  type: string;
}): string {
  const { requestId, typeName, urgency, submittedAt, isPrivate, data, type } = payload;
  const dateStr = submittedAt
    ? new Date(submittedAt).toLocaleString("en-US", {
        month: "long", day: "numeric", year: "numeric",
        hour: "numeric", minute: "2-digit",
      })
    : "—";

  const urgColor = urgencyColor(urgency);

  const privateNotice = `
    <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;padding:14px 16px;margin:20px 0;font-size:.86rem;color:#92400e;">
      <strong>🔒 Private Request</strong><br>
      This request was marked private by the submitter. Please sign in to the
      Request Inbox to view full details. Contact information and request content
      are not included in this notification.
    </div>`;

  const publicDetails = isPrivate
    ? privateNotice
    : `
    <table style="width:100%;border-collapse:collapse;margin-top:16px">
      ${row("Name", String(data.name || "—"))}
      ${row("Phone", String(data.phone || ""))}
      ${row("Email", String(data.email || ""))}
      ${buildSummaryRows(type, data)}
    </table>`;

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:24px;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="max-width:560px;margin:0 auto">

    <!-- Header -->
    <div style="background:#4f46e5;border-radius:12px 12px 0 0;padding:24px 28px">
      <div style="color:#fff;font-size:1.1rem;font-weight:800;letter-spacing:-.01em">📬 New Ministry Request</div>
      <div style="color:rgba(255,255,255,.75);font-size:.83rem;margin-top:4px">Church Operations Dashboard</div>
    </div>

    <!-- Body -->
    <div style="background:#fff;border-radius:0 0 12px 12px;padding:24px 28px;border:1px solid #e2e8f0;border-top:none">

      <!-- Request ID + meta -->
      <div style="display:flex;align-items:flex-start;gap:16px;margin-bottom:20px">
        <div style="flex:1">
          <div style="font-size:.72rem;font-weight:800;text-transform:uppercase;color:#64748b;letter-spacing:.08em;margin-bottom:4px">Request ID</div>
          <div style="font-family:monospace;font-size:1.15rem;font-weight:800;color:#4f46e5">${escHtml(requestId)}</div>
        </div>
        <div style="text-align:right">
          <span style="display:inline-block;padding:4px 12px;border-radius:20px;font-size:.76rem;font-weight:700;background:${urgColor}1a;color:${urgColor};border:1.5px solid ${urgColor}40">${escHtml(urgency)} Priority</span>
        </div>
      </div>

      <table style="width:100%;border-collapse:collapse">
        ${row("Type", typeName)}
        ${row("Submitted", dateStr)}
      </table>

      ${publicDetails}

      <!-- CTA -->
      <div style="margin-top:24px;padding:16px;background:#f0f0ff;border-radius:8px;font-size:.84rem;color:#4338ca;text-align:center">
        <strong>Open the Request Inbox</strong> in the Church Operations Dashboard to review, assign, and follow up on this request.
      </div>

    </div>

    <!-- Footer -->
    <div style="margin-top:16px;text-align:center;font-size:.75rem;color:#94a3b8">
      This is an automated notification from your Church Operations Dashboard.<br>
      Do not reply to this email.
    </div>

  </div>
</body>
</html>`;
}

// ── Main handler ─────────────────────────────────────────────────

Deno.serve(async (req: Request): Promise<Response> => {

  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  // ── Environment variables ──────────────────────────────────────
  const RESEND_API_KEY   = Deno.env.get("RESEND_API_KEY");
  const NOTIFY_TO        = Deno.env.get("REQUEST_NOTIFICATION_TO");
  const NOTIFY_FROM      = Deno.env.get("REQUEST_NOTIFICATION_FROM") ||
                           "Ministry Portal <noreply@church.org>";

  if (!RESEND_API_KEY || !NOTIFY_TO) {
    console.error("[send-request-notification] Missing env vars: RESEND_API_KEY or REQUEST_NOTIFICATION_TO");
    return new Response(
      JSON.stringify({ error: "Email not configured on server." }),
      { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
    );
  }

  // ── Parse + validate body ──────────────────────────────────────
  let payload: {
    requestId?: string;
    type?: string;
    typeName?: string;
    urgency?: string;
    submittedAt?: string;
    isPrivate?: boolean;
    data?: Record<string, unknown>;
  };

  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  const { requestId, type, typeName, urgency, submittedAt, data = {} } = payload;

  if (!requestId || !type) {
    return new Response(
      JSON.stringify({ error: "requestId and type are required" }),
      { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
    );
  }

  // isPrivate: true only for prayer requests explicitly marked private
  const isPrivate = type === "prayer" && (payload.isPrivate === true || data.isPrivate === true);

  // ── Build email ────────────────────────────────────────────────
  const subject = isPrivate
    ? `🔒 Private Ministry Request Received — ${requestId}`
    : `New Ministry Request: ${typeName || type} — ${requestId}`;

  const html = buildEmailHtml({
    requestId,
    type,
    typeName:    typeName    || type,
    urgency:     urgency     || "Medium",
    submittedAt: submittedAt || new Date().toISOString(),
    isPrivate,
    data,
  });

  // ── Send via Resend ────────────────────────────────────────────
  const recipients = NOTIFY_TO.split(",").map((e: string) => e.trim()).filter(Boolean);

  let resendRes: Response;
  try {
    resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from:    NOTIFY_FROM,
        to:      recipients,
        subject,
        html,
      }),
    });
  } catch (err) {
    console.error("[send-request-notification] Resend fetch error:", err);
    return new Response(
      JSON.stringify({ error: "Failed to reach email provider." }),
      { status: 502, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
    );
  }

  if (!resendRes.ok) {
    const errText = await resendRes.text();
    console.error("[send-request-notification] Resend API error:", resendRes.status, errText);
    return new Response(
      JSON.stringify({ error: "Email provider rejected the request.", details: errText }),
      { status: 502, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
    );
  }

  const resendData = await resendRes.json() as { id?: string };
  console.info("[send-request-notification] Email sent. Resend ID:", resendData.id, "| Request:", requestId);

  return new Response(
    JSON.stringify({ ok: true, emailId: resendData.id, requestId }),
    { status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
  );
});
