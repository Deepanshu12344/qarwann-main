const nodemailer = require('nodemailer');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  const host = process.env.ZOHO_SMTP_HOST || 'smtp.zoho.com';
  const port = parseInt(process.env.ZOHO_SMTP_PORT || '465', 10);
  const secure = String(process.env.ZOHO_SMTP_SECURE || 'true') === 'true';
  const user = process.env.ZOHO_SMTP_USER;
  const pass = process.env.ZOHO_SMTP_PASS;
  if (!user || !pass) return null;
  transporter = nodemailer.createTransport({ host, port, secure, auth: { user, pass } });
  return transporter;
}

function esc(v) {
  return String(v ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

function renderEnquiryEmail(e) {
  const rows = [
    ['Name', e.name],
    ['Email', e.email],
    ['Phone', e.phone],
    ['Trip', e.tripName || '—'],
    ['Travelers', e.travelers],
    ['Travel Dates', [e.travelStartDate, e.travelEndDate].filter(Boolean).map((d) => new Date(d).toDateString()).join(' → ') || '—'],
    ['Newsletter Opt-In', e.newsletterOptIn ? 'Yes' : 'No'],
    ['Source', e.source || 'website'],
  ];
  const tableRows = rows
    .map(([k, v]) => `<tr><td style="padding:8px 12px;color:#6b6b6b;font-size:13px;border-bottom:1px solid #eee;">${esc(k)}</td><td style="padding:8px 12px;color:#111;font-size:14px;border-bottom:1px solid #eee;">${esc(v)}</td></tr>`)
    .join('');
  const html = `
  <div style="font-family:'Inter',Arial,sans-serif;background:#F0EDE5;padding:32px;">
    <div style="max-width:620px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;border:1px solid #e5e5e5;">
      <div style="background:#004643;color:#fff;padding:24px 28px;">
        <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:24px;letter-spacing:.2em;">QARWAAN</div>
        <div style="margin-top:4px;font-size:13px;color:#C9A227;letter-spacing:.18em;text-transform:uppercase;">New Enquiry</div>
      </div>
      <table style="width:100%;border-collapse:collapse;">${tableRows}</table>
      <div style="padding:18px 28px;">
        <div style="font-size:12px;color:#6b6b6b;text-transform:uppercase;letter-spacing:.18em;margin-bottom:6px;">Message</div>
        <div style="white-space:pre-wrap;font-size:14px;color:#222;">${esc(e.message || '—')}</div>
      </div>
    </div>
  </div>`;
  const text = rows.map(([k, v]) => `${k}: ${v}`).join('\n') + `\n\nMessage:\n${e.message || '—'}`;
  return { html, text };
}

async function sendEnquiryEmail(enquiry) {
  const t = getTransporter();
  if (!t) throw new Error('SMTP transporter not configured');
  const to = process.env.ZOHO_TO_EMAIL;
  const from = process.env.ZOHO_FROM_EMAIL || process.env.ZOHO_SMTP_USER;
  if (!to) throw new Error('ZOHO_TO_EMAIL not configured');
  const { html, text } = renderEnquiryEmail(enquiry);
  await t.sendMail({
    from: `"QARWAAN Website" <${from}>`,
    to,
    replyTo: enquiry.email,
    subject: `New enquiry — ${enquiry.tripName || enquiry.name}`,
    html,
    text,
  });
}

module.exports = { sendEnquiryEmail };
