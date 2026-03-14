const { Resend } = require('resend');

console.log('Resend API Key:', process.env.RESEND_API_KEY ? 'Found' : 'NOT FOUND');

const resend = new Resend(process.env.RESEND_API_KEY);

const sendMail = async ({ to, subject, html }) => {
  try {
    await resend.emails.send({
      from: 'OCRS BITSathy <onboarding@resend.dev>',
      to,
      subject,
      html,
    });
    console.log(`Email sent to ${to}`);
  } catch (err) {
    console.error('Email error:', err.message);
  }
};

const reportFiled = (studentName, report) => ({
  subject: `OCRS - New Report Filed Against You (${report.reportId})`,
  html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;border:1px solid #eee;border-radius:12px;">
    <div style="background:#c0392b;padding:20px;border-radius:8px;text-align:center;margin-bottom:24px;">
      <h1 style="color:white;margin:0;font-size:22px;">📋 OCRS</h1>
      <p style="color:#fcc;margin:4px 0 0;font-size:13px;">Online Compliance Reporting System</p>
    </div>
    <p style="color:#333;">Dear <strong>${studentName}</strong>,</p>
    <p style="color:#555;">A disciplinary report has been filed against you.</p>
    <div style="background:#fff8f8;border:1px solid #f5c6c2;border-radius:8px;padding:16px;margin:20px 0;">
      <table style="width:100%;font-size:14px;color:#333;">
        <tr><td style="padding:6px 0;color:#888;">Report ID</td><td><strong>${report.reportId}</strong></td></tr>
        <tr><td style="padding:6px 0;color:#888;">Category</td><td><strong>${report.category}</strong></td></tr>
        <tr><td style="padding:6px 0;color:#888;">Severity</td><td><strong>${report.severity.toUpperCase()}</strong></td></tr>
        <tr><td style="padding:6px 0;color:#888;">Date</td><td><strong>${new Date(report.date).toLocaleDateString()}</strong></td></tr>
      </table>
    </div>
    <p style="color:#555;">Please login to OCRS to view the full details and submit your proof.</p>
    <div style="text-align:center;margin:24px 0;">
      <a href="https://ocrs-frontend.vercel.app" style="background:#c0392b;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold;">View Report</a>
    </div>
    <p style="color:#aaa;font-size:12px;text-align:center;">OCRS - BITSathy Disciplinary Portal</p>
  </div>`,
});

const reportResolved = (studentName, report) => ({
  subject: `OCRS - Your Report Has Been ${report.status === 'resolved' ? 'Resolved' : 'Rejected'} (${report.reportId})`,
  html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;border:1px solid #eee;border-radius:12px;">
    <div style="background:${report.status === 'resolved' ? '#16a34a' : '#c0392b'};padding:20px;border-radius:8px;text-align:center;margin-bottom:24px;">
      <h1 style="color:white;margin:0;font-size:22px;">📋 OCRS</h1>
    </div>
    <p style="color:#333;">Dear <strong>${studentName}</strong>,</p>
    <p style="color:#555;">Your report <strong>${report.reportId}</strong> has been <strong>${report.status === 'resolved' ? 'Resolved' : 'Rejected'}</strong>.</p>
    ${report.adminComment ? `<div style="background:#f9fafb;border:1px solid #eee;border-radius:8px;padding:16px;margin:20px 0;"><p style="color:#888;font-size:12px;margin:0 0 6px;">Admin Comment:</p><p style="color:#333;margin:0;">${report.adminComment}</p></div>` : ''}
    <div style="text-align:center;margin:24px 0;">
      <a href="https://ocrs-frontend.vercel.app" style="background:#c0392b;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold;">View Details</a>
    </div>
    <p style="color:#aaa;font-size:12px;text-align:center;">OCRS - BITSathy Disciplinary Portal</p>
  </div>`,
});

const proofSubmitted = (adminName, report) => ({
  subject: `OCRS - Student Submitted Proof for ${report.reportId}`,
  html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;border:1px solid #eee;border-radius:12px;">
    <div style="background:#1d4ed8;padding:20px;border-radius:8px;text-align:center;margin-bottom:24px;">
      <h1 style="color:white;margin:0;font-size:22px;">📋 OCRS</h1>
    </div>
    <p style="color:#333;">Dear <strong>${adminName}</strong>,</p>
    <p style="color:#555;">Student submitted proof for report <strong>${report.reportId}</strong>. Please review it.</p>
    <div style="text-align:center;margin:24px 0;">
      <a href="https://ocrs-frontend.vercel.app" style="background:#1d4ed8;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold;">Review Now</a>
    </div>
    <p style="color:#aaa;font-size:12px;text-align:center;">OCRS - BITSathy Disciplinary Portal</p>
  </div>`,
});

const appealSubmitted = (adminName, report) => ({
  subject: `OCRS - Student Submitted Appeal for ${report.reportId}`,
  html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;border:1px solid #eee;border-radius:12px;">
    <div style="background:#d97706;padding:20px;border-radius:8px;text-align:center;margin-bottom:24px;">
      <h1 style="color:white;margin:0;font-size:22px;">📋 OCRS</h1>
    </div>
    <p style="color:#333;">Dear <strong>${adminName}</strong>,</p>
    <p style="color:#555;">A student submitted an appeal for report <strong>${report.reportId}</strong>.</p>
    <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:16px;margin:20px 0;">
      <p style="color:#888;font-size:12px;margin:0 0 6px;">Appeal Message:</p>
      <p style="color:#333;margin:0;">${report.appealMessage}</p>
    </div>
    <div style="text-align:center;margin:24px 0;">
      <a href="https://ocrs-frontend.vercel.app" style="background:#d97706;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold;">Review Appeal</a>
    </div>
    <p style="color:#aaa;font-size:12px;text-align:center;">OCRS - BITSathy Disciplinary Portal</p>
  </div>`,
});

const templates = { reportFiled, reportResolved, proofSubmitted, appealSubmitted };

module.exports = { sendMail, templates };