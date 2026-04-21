const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // use SSL
  auth: {
    user: process.env.EMAIL_USER,
    pass: (process.env.EMAIL_PASS || '').replace(/\s+/g, ''), // strip any spaces
  },
});

/**
 * Send an email notification to a student when a report is filed against them.
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
                <h1 style="margin:0 0 6px;font-size:22px;font-weight:700;color:#e8f4ff;">
                  📋 OCRS
                </h1>
                <h2 style="margin:16px 0 4px;font-size:20px;font-weight:700;color:#e8f4ff;">
                  ⚠️ Disciplinary Report Filed
                </h2>
                <p style="margin:0;font-size:13px;color:#8aacc8;">
                  A compliance report has been filed against you. Please log in to review and respond.
                </p>
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td style="padding:32px 40px;">
                <p style="font-size:15px;color:#c8dff0;margin:0 0 20px;">
                  Dear <strong style="color:#e8f4ff;">${studentName}</strong>,
                </p>
                <p style="font-size:14px;color:#8aacc8;margin:0 0 24px;line-height:1.7;">
                  A disciplinary report has been filed against you on the Online Compliance Reporting
                  System. Please log in to your student dashboard to view the full details and
                  submit your proof within the stipulated time.
                </p>

                <!-- Report Details -->
                <table width="100%" cellpadding="0" cellspacing="0"
                  style="background:#0a1628;border:1px solid rgba(0,210,255,0.12);border-radius:12px;margin-bottom:20px;">
                  <tr>
                    <td style="padding:20px 24px;">
                      <p style="margin:0 0 14px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#4a7a9b;">
                        Report Details
                      </p>
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="padding:5px 0;font-size:12px;color:#4a7a9b;width:130px;">Report ID</td>
                          <td style="padding:5px 0;font-size:13px;color:#00d2ff;font-weight:700;">${reportId}</td>
                        </tr>
                        <tr>
                          <td style="padding:5px 0;font-size:12px;color:#4a7a9b;">Category</td>
                          <td style="padding:5px 0;font-size:13px;color:#c8dff0;font-weight:500;">${category}</td>
                        </tr>
                        <tr>
                          <td style="padding:5px 0;font-size:12px;color:#4a7a9b;">Severity</td>
                          <td style="padding:5px 0;font-size:13px;font-weight:700;color:${severityColor};">${severityLabel}</td>
                        </tr>
                        <tr>
                          <td style="padding:5px 0;font-size:12px;color:#4a7a9b;">Incident Date</td>
                          <td style="padding:5px 0;font-size:13px;color:#c8dff0;font-weight:500;">${formattedDate}</td>
                        </tr>
                        <tr>
                          <td style="padding:5px 0;font-size:12px;color:#4a7a9b;">Reported By</td>
                          <td style="padding:5px 0;font-size:13px;color:#c8dff0;font-weight:500;">${reporterName}</td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>

                <!-- Incident Description -->
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

                <!-- CTA -->
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td align="center" style="padding-bottom:24px;">
                      <a href="${process.env.FRONTEND_URL}/student"
                        style="display:inline-block;background:linear-gradient(135deg,#00d2ff,#0066ff);
                               color:#fff;text-decoration:none;font-size:14px;font-weight:700;
                               padding:14px 36px;border-radius:10px;">
                        📂 View Report &amp; Upload Proof
                      </a>
                    </td>
                  </tr>
                </table>

                <p style="font-size:13px;color:#8aacc8;line-height:1.7;margin:0;">
                  If you believe this report is incorrect, you can upload evidence and submit an
                  appeal through your dashboard. Failure to respond in time may result in further
                  disciplinary action.
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="padding:20px 40px;background:#071220;border-top:1px solid rgba(0,210,255,0.08);">
                <p style="margin:0;font-size:11px;color:#3a5a78;text-align:center;">
                  This is an automated message from OCRS Online Compliance Reporting System.<br/>
                  Please do not reply to this email. For help, contact the admin.
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
    await transporter.sendMail({
      from: `"OCRS" <${process.env.EMAIL_USER}>`,
      to: studentEmail,
      subject: `⚠️ Disciplinary Report Filed — ${reportId}`,
      html,
    });
    console.log(`[Mailer] Email sent to ${studentEmail}`);
  } catch (err) {
    console.error('[Mailer] Failed to send email:', err.message);
  }
};

module.exports = { sendReportFiledEmail };
