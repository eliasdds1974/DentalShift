export const DENTALSHIFT_EMAIL_COLORS = {
  navy: "#002757",
  blue: "#0078FE",
  green: "#04A62F",
  gold: "#FDB605",
  text: "#334155",
  muted: "#64748B",
  border: "#E2E8F0",
  background: "#F4F7FA",
};

export function escapeEmailHtml(value: string) {
  return value.replace(/[&<>'\"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  })[character] ?? character);
}

type DentalShiftEmailOptions = {
  siteUrl: string;
  preheader: string;
  title: string;
  greeting?: string;
  intro?: string;
  bodyHtml?: string;
  actionLabel?: string;
  actionUrl?: string;
  noteHtml?: string;
  closing?: string;
};

export function renderDentalShiftEmail({
  siteUrl,
  preheader,
  title,
  greeting,
  intro,
  bodyHtml = "",
  actionLabel,
  actionUrl,
  noteHtml = "",
  closing = "The DentalShift Team",
}: DentalShiftEmailOptions) {
  const baseUrl = siteUrl.replace(/\/$/, "");
  const logoUrl = `${baseUrl}/dentalshift-logo.svg`;
  const safePreheader = escapeEmailHtml(preheader);
  const safeTitle = escapeEmailHtml(title);
  const safeGreeting = greeting ? escapeEmailHtml(greeting) : "";
  const safeIntro = intro ? escapeEmailHtml(intro) : "";
  const safeActionLabel = actionLabel ? escapeEmailHtml(actionLabel) : "";
  const safeActionUrl = actionUrl ? escapeEmailHtml(actionUrl) : "";
  const safeClosing = escapeEmailHtml(closing);

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <meta name="color-scheme" content="light" />
  <title>${safeTitle}</title>
</head>
<body style="margin:0;padding:0;background:${DENTALSHIFT_EMAIL_COLORS.background};font-family:Arial,Helvetica,sans-serif;color:${DENTALSHIFT_EMAIL_COLORS.text};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${safePreheader}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;background:${DENTALSHIFT_EMAIL_COLORS.background};">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:620px;background:#ffffff;border:1px solid ${DENTALSHIFT_EMAIL_COLORS.border};border-radius:18px;overflow:hidden;">
          <tr>
            <td style="padding:28px 34px 22px;border-bottom:1px solid ${DENTALSHIFT_EMAIL_COLORS.border};">
              <a href="${baseUrl}" style="text-decoration:none;display:inline-block;">
                <img src="${logoUrl}" alt="DentalShift" width="220" style="display:block;width:220px;max-width:100%;height:auto;border:0;" />
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding:34px;">
              <h1 style="margin:0 0 18px;font-size:28px;line-height:1.2;color:${DENTALSHIFT_EMAIL_COLORS.navy};font-weight:800;">${safeTitle}</h1>
              ${safeGreeting ? `<p style="margin:0 0 16px;font-size:16px;line-height:1.65;">${safeGreeting}</p>` : ""}
              ${safeIntro ? `<p style="margin:0 0 20px;font-size:16px;line-height:1.65;">${safeIntro}</p>` : ""}
              ${bodyHtml}
              ${actionLabel && actionUrl ? `<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:26px 0;"><tr><td bgcolor="${DENTALSHIFT_EMAIL_COLORS.green}" style="border-radius:10px;"><a href="${safeActionUrl}" style="display:inline-block;padding:13px 22px;color:#ffffff;text-decoration:none;font-size:15px;font-weight:800;">${safeActionLabel}</a></td></tr></table>` : ""}
              ${noteHtml}
              <p style="margin:28px 0 0;font-size:15px;line-height:1.6;color:${DENTALSHIFT_EMAIL_COLORS.text};">Thanks,<br /><strong style="color:${DENTALSHIFT_EMAIL_COLORS.navy};">${safeClosing}</strong></p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 34px;background:#F8FAFC;border-top:1px solid ${DENTALSHIFT_EMAIL_COLORS.border};font-size:12px;line-height:1.6;color:${DENTALSHIFT_EMAIL_COLORS.muted};">
              <p style="margin:0 0 6px;">DentalShift connects dental offices and dental professionals for dependable shift coverage.</p>
              <p style="margin:0;">This is an automated DentalShift message. Please do not share secure sign-in links.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
