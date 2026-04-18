const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Send an email notification to a student when a report is filed against them.
 * @param {Object} params
 * @param {string} params.studentEmail
 * @param {string} params.studentName
 * @param {string} params.reportId
 * @param {string} params.category
 * @param {string} params.severity
 * @param {string} params.date
 * @param {string} params.details
 * @param {string} params.reporterName
 */
const sendReportFiledEmail = async ({
  studentEmail,
  studentName,
  reportId,
  category,
  severity,
  date,
  details,
  reporterName,
}) => {
  const severityColor = severity === 'high' ? '#ef4444' : severity === 'medium' ? '#f59e0b' : '#22c55e';
  const severityLabel = severity.charAt(0).toUpperCase() + severity.slice(1);
  const formattedDate = new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'long', year: 'numeric',
  });

  const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  </head>
  <body style="margin:0;padding:0;background:#0a1628;font-family:'Segoe UI',Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a1628;padding:40px 0;">
      <tr>
        <td align="center">
          <table width="600" cellpadding="0" cellspacing="0" style="background:#0c1f38;border-radius:16px;border:1px solid rgba(0,210,255,0.15);overflow:hidden;">

            <!-- Header -->
            <tr>
              <td style="background:linear-gradient(135deg,#0a1f3c,#0d2a4a);padding:32px 40px;border-bottom:1px solid rgba(0,210,255,0.1);">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td>
                      <div style="display:inline-block;background:linear-gradient(135deg,#00d2ff,#0066ff);border-radius:10px;width:40px;height:40px;text-align:center;line-height:40px;font-size:20px;">📋</div>
                      <span style="font-size:20px;font-weight:700;color:#e8f4ff;vertical-align:middle;margin-left:12px;">OCRS</span>
                      <span style="font-size:20px;color:#00d2ff;vertical-align:middle;">.</span>
                    </td>
                  </tr>
                </table>
                <h1 style="margin:20px 0 4px;font-size:24px;font-weight:700;color:#e8f4ff;">
                  ⚠️ Disciplinary Report Filed
                </h1>
                <p style="margin:0;font-size:14px;color:#8aacc8;">
                  A compliance report has been filed against you. Please log in to review and respond.
                </p>
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td style="padding:32px 40px;">

                <p style="font-size:15px;color:#c8dff0;margin:0 0 24px;">
                  Dear <strong style="color:#e8f4ff;">${studentName}</strong>,
                </p>

                <p style="font-size:14px;color:#8aacc8;margin:0 0 24px;line-height:1.7;">
                  This is to inform you that a disciplinary report has been filed against you on the
                  Online Compliance Reporting System (OCRS). Please log in to your student dashboard
                  to view the full details and submit your proof within the stipulated time.
                </p>

                <!-- Report Details Card -->
                <table width="100%" cellpadding="0" cellspacing="0"
                  style="background:#0a1628;border:1px solid rgba(0,210,255,0.12);border-radius:12px;margin-bottom:24px;">
                  <tr>
                    <td style="padding:20px 24px;">
                      <p style="margin:0 0 16px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#4a7a9b;">
                        Report Details
                      </p>
                      <table width="100%" cellpadding="0" cellspacing="0">
                        ${[
                          ['Report ID', reportId],
                          ['Category', category],
                          ['Severity', `<span style="color:${severityColor};font-weight:700;">${severityLabel}</span>`],
                          ['Incident Date', formattedDate],
                          ['Reported By', reporterName],
                        ].map(([label, value]) => `
                          <tr>
                            <td style="padding:6px 0;font-size:12px;color:#4a7a9b;width:130px;">${label}</td>
                            <td style="padding:6px 0;font-size:13px;color:#c8dff0;font-weight:500;">${value}</td>
                          </tr>
                        `).join('')}
                      </table>
                    </td>
                  </tr>
                </table>

                <!-- Incident Summary -->
                <table width="100%" cellpadding="0" cellspacing="0"
                  style="background:rgba(239,68,68,0.06);border:1px solid rgba(239,68,68,0.2);border-radius:10px;margin-bottom:28px;">
                  <tr>
                    <td style="padding:16px 20px;">
                      <p style="margin:0 0 8px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#ef4444;">
                        Incident Description
                      </p>
                      <p style="margin:0;font-size:13px;color:#c8dff0;line-height:1.7;">${details}</p>
                    </td>
                  </tr>
                </table>

                <!-- CTA Button -->
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td align="center" style="padding-bottom:28px;">
                      <a href="${process.env.FRONTEND_URL}/student"
                        style="display:inline-block;background:linear-gradient(135deg,#00d2ff,#0066ff);
                               color:#fff;text-decoration:none;font-size:14px;font-weight:700;
                               padding:14px 36px;border-radius:10px;letter-spacing:0.03em;">
                        📂 View Report &amp; Upload Proof
                      </a>
                    </td>
                  </tr>
                </table>

                <p style="font-size:13px;color:#8aacc8;line-height:1.7;margin:0;">
                  If you believe this report is incorrect, you will be able to upload evidence and
                  submit an appeal through your dashboard. Failure to respond in a timely manner may
                  result in further disciplinary action.
                </p>

              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="padding:20px 40px;background:#071220;border-top:1px solid rgba(0,210,255,0.08);">
                <p style="margin:0;font-size:11px;color:#3a5a78;text-align:center;">
                  This is an automated message from OCRS – BITSathy Online Compliance Reporting System.<br/>
                  Please do not reply to this email.
                </p>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;

  try {
    await resend.emails.send({
      from: 'OCRS BITSathy <onboarding@resend.dev>',
      to: studentEmail,
      subject: `⚠️ Disciplinary Report Filed — ${reportId}`,
      html,
    });
    console.log(`[Mailer] Report notification sent to ${studentEmail}`);
  } catch (err) {
    // Don't crash the request if email fails — just log it
    console.error('[Mailer] Failed to send email:', err.message);
  }
};

module.exports = { sendReportFiledEmail };
