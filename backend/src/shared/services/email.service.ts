import { Resend } from 'resend';
import { env } from '../../config/env';

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

if (resend) {
  console.log(`📧 Email service: configured (API key set, from: ${env.EMAIL_FROM})`);
} else {
  console.warn(`⚠️  Email service: NOT configured (RESEND_API_KEY missing)`);
}

function getEmailClient(): Resend {
  if (!resend) {
    throw new Error('Email service not configured. Set RESEND_API_KEY environment variable.');
  }
  return resend;
}

// ===== EMAIL VERIFICATION =====
export async function sendVerificationEmail(to: string, name: string, token: string) {
  const verifyUrl = `${env.FRONTEND_URL}?verify=${token}`;
  const client = getEmailClient();

  await client.emails.send({
    from: `DocuFlow <${env.EMAIL_FROM}>`,
    to,
    subject: 'Verify your email — DocuFlow',
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:480px;margin:40px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
    <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px 24px;text-align:center;">
      <div style="display:inline-flex;align-items:center;gap:8px;">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="3" y="3" width="18" height="18" rx="3" fill="white" fill-opacity="0.2"/>
          <path d="M7 8h10M7 12h7M7 16h4" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
          <circle cx="17" cy="15" r="3" fill="white" fill-opacity="0.3" stroke="white" stroke-width="1.5"/>
        </svg>
        <span style="color:white;font-size:20px;font-weight:700;letter-spacing:-0.5px;">DocuFlow</span>
      </div>
    </div>
    <div style="padding:32px 24px;">
      <h1 style="margin:0 0 8px;font-size:22px;color:#18181b;">Verify your email</h1>
      <p style="margin:0 0 24px;color:#71717a;font-size:15px;line-height:1.5;">
        Hi ${name || 'there'}, thanks for signing up! Click the button below to verify your email address and activate your account.
      </p>
      <a href="${verifyUrl}" style="display:inline-block;background:#6366f1;color:white;text-decoration:none;padding:12px 32px;border-radius:8px;font-weight:600;font-size:15px;">
        Verify Email Address
      </a>
      <p style="margin:24px 0 0;color:#a1a1aa;font-size:13px;line-height:1.5;">
        This link expires in 24 hours. If you didn't create a DocuFlow account, you can safely ignore this email.
      </p>
      <hr style="margin:24px 0;border:none;border-top:1px solid #e4e4e7;">
      <p style="margin:0;color:#d4d4d8;font-size:12px;">
        Can't click the button? Copy this link:<br>
        <a href="${verifyUrl}" style="color:#a1a1aa;word-break:break-all;">${verifyUrl}</a>
      </p>
    </div>
  </div>
</body>
</html>`,
  });
}

// ===== PASSWORD RESET =====
export async function sendPasswordResetEmail(to: string, name: string, token: string) {
  const resetUrl = `${env.FRONTEND_URL}?reset=${token}`;
  const client = getEmailClient();

  await client.emails.send({
    from: `DocuFlow <${env.EMAIL_FROM}>`,
    to,
    subject: 'Reset your password — DocuFlow',
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:480px;margin:40px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
    <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px 24px;text-align:center;">
      <div style="display:inline-flex;align-items:center;gap:8px;">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="3" y="3" width="18" height="18" rx="3" fill="white" fill-opacity="0.2"/>
          <path d="M7 8h10M7 12h7M7 16h4" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
          <circle cx="17" cy="15" r="3" fill="white" fill-opacity="0.3" stroke="white" stroke-width="1.5"/>
        </svg>
        <span style="color:white;font-size:20px;font-weight:700;letter-spacing:-0.5px;">DocuFlow</span>
      </div>
    </div>
    <div style="padding:32px 24px;">
      <h1 style="margin:0 0 8px;font-size:22px;color:#18181b;">Reset your password</h1>
      <p style="margin:0 0 24px;color:#71717a;font-size:15px;line-height:1.5;">
        Hi ${name || 'there'}, we received a request to reset your password. Click the button below to choose a new one.
      </p>
      <a href="${resetUrl}" style="display:inline-block;background:#6366f1;color:white;text-decoration:none;padding:12px 32px;border-radius:8px;font-weight:600;font-size:15px;">
        Reset Password
      </a>
      <p style="margin:24px 0 0;color:#a1a1aa;font-size:13px;line-height:1.5;">
        This link expires in 1 hour. If you didn't request a password reset, you can safely ignore this email — your password will remain unchanged.
      </p>
      <hr style="margin:24px 0;border:none;border-top:1px solid #e4e4e7;">
      <p style="margin:0;color:#d4d4d8;font-size:12px;">
        Can't click the button? Copy this link:<br>
        <a href="${resetUrl}" style="color:#a1a1aa;word-break:break-all;">${resetUrl}</a>
      </p>
    </div>
  </div>
</body>
</html>`,
  });
}

// ===== SIGNATURE REQUEST EMAILS =====

export async function sendSigningRequestEmail(params: {
  to: string; signerName: string; senderName: string;
  documentTitle: string; note: string; signingLink: string;
}) {
  const { to, signerName, senderName, documentTitle, note, signingLink } = params;
  const client = getEmailClient();
  return client.emails.send({
    from: `OpenPDF Studio <${env.EMAIL_FROM}>`,
    to,
    subject: `${senderName} has sent you a document to sign`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
        <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px;text-align:center;border-radius:12px 12px 0 0">
          <h1 style="color:white;margin:0;font-size:24px">OpenPDF Studio</h1>
        </div>
        <div style="padding:32px;background:#fff;border:1px solid #e5e7eb;border-radius:0 0 12px 12px">
          <p style="font-size:16px;color:#374151">Hi <strong>${signerName}</strong>,</p>
          <p style="color:#374151"><strong>${senderName}</strong> has sent you the document <strong>"${documentTitle}"</strong> to review and sign.</p>
          ${note ? `<div style="background:#f3f4f6;padding:16px;border-radius:8px;margin:16px 0"><p style="margin:0;color:#6b7280;font-style:italic">"${note}"</p></div>` : ''}
          <div style="text-align:center;margin:32px 0">
            <a href="${signingLink}" style="background:linear-gradient(135deg,#6366f1,#8b5cf6);color:white;padding:16px 32px;border-radius:8px;text-decoration:none;font-size:16px;font-weight:bold;display:inline-block">
              Review & Sign Document →
            </a>
          </div>
          <p style="color:#9ca3af;font-size:13px">If you're having trouble with the button, copy this link: ${signingLink}</p>
          <hr style="border:1px solid #e5e7eb;margin:24px 0"/>
          <p style="color:#9ca3af;font-size:12px;text-align:center">Powered by <a href="https://snaphw.com" style="color:#6366f1">OpenPDF Studio</a></p>
        </div>
      </div>`,
  });
}

export async function sendSignedConfirmationEmail(params: {
  to: string; signerName: string; documentTitle: string; downloadUrl: string;
}) {
  const { to, signerName, documentTitle, downloadUrl } = params;
  const client = getEmailClient();
  return client.emails.send({
    from: `OpenPDF Studio <${env.EMAIL_FROM}>`,
    to,
    subject: `You've signed: ${documentTitle}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
        <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px;text-align:center;border-radius:12px 12px 0 0">
          <h1 style="color:white;margin:0;font-size:24px">Document Signed</h1>
        </div>
        <div style="padding:32px;background:#fff;border:1px solid #e5e7eb;border-radius:0 0 12px 12px">
          <p style="font-size:16px;color:#374151">Hi <strong>${signerName}</strong>,</p>
          <p style="color:#374151">You've successfully signed <strong>"${documentTitle}"</strong>. A copy of your signed document is available below.</p>
          <div style="text-align:center;margin:32px 0">
            <a href="${downloadUrl}" style="background:#059669;color:white;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block">
              Download Signed Document
            </a>
          </div>
          <hr style="border:1px solid #e5e7eb;margin:24px 0"/>
          <p style="color:#9ca3af;font-size:12px;text-align:center">Powered by <a href="https://snaphw.com" style="color:#6366f1">OpenPDF Studio</a></p>
        </div>
      </div>`,
  });
}

export async function sendCompletionEmail(params: {
  to: string; ownerName: string; documentTitle: string;
  signers: { name: string; email: string; signedAt: string }[]; downloadUrl: string;
}) {
  const { to, ownerName, documentTitle, signers, downloadUrl } = params;
  const signerRows = signers.map(s =>
    `<tr><td style="padding:8px;border-bottom:1px solid #e5e7eb">${s.name}</td><td style="padding:8px;border-bottom:1px solid #e5e7eb">${s.email}</td><td style="padding:8px;border-bottom:1px solid #e5e7eb">${new Date(s.signedAt).toLocaleString()}</td></tr>`
  ).join('');
  const client = getEmailClient();
  return client.emails.send({
    from: `OpenPDF Studio <${env.EMAIL_FROM}>`,
    to,
    subject: `All parties have signed: ${documentTitle}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
        <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px;text-align:center;border-radius:12px 12px 0 0">
          <h1 style="color:white;margin:0;font-size:24px">All Parties Signed</h1>
        </div>
        <div style="padding:32px;background:#fff;border:1px solid #e5e7eb;border-radius:0 0 12px 12px">
          <p style="font-size:16px;color:#374151">Hi <strong>${ownerName}</strong>,</p>
          <p style="color:#374151">All parties have signed <strong>"${documentTitle}"</strong>.</p>
          <div style="text-align:center;margin:24px 0">
            <a href="${downloadUrl}" style="background:#059669;color:white;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block">
              Download Completed Document
            </a>
          </div>
          <h3 style="color:#374151">Audit Trail</h3>
          <table style="width:100%;border-collapse:collapse;font-size:14px">
            <tr style="background:#f9fafb"><th style="padding:8px;text-align:left">Name</th><th style="padding:8px;text-align:left">Email</th><th style="padding:8px;text-align:left">Signed At</th></tr>
            ${signerRows}
          </table>
          <hr style="border:1px solid #e5e7eb;margin:24px 0"/>
          <p style="color:#9ca3af;font-size:12px;text-align:center">Powered by <a href="https://snaphw.com" style="color:#6366f1">OpenPDF Studio</a></p>
        </div>
      </div>`,
  });
}

export async function sendReminderEmail(params: {
  to: string; signerName: string; senderName: string; documentTitle: string; signingLink: string;
}) {
  const { to, signerName, senderName, documentTitle, signingLink } = params;
  const client = getEmailClient();
  return client.emails.send({
    from: `OpenPDF Studio <${env.EMAIL_FROM}>`,
    to,
    subject: `Reminder: ${documentTitle} is waiting for your signature`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
        <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px;text-align:center;border-radius:12px 12px 0 0">
          <h1 style="color:white;margin:0;font-size:24px">Reminder to Sign</h1>
        </div>
        <div style="padding:32px;background:#fff;border:1px solid #e5e7eb;border-radius:0 0 12px 12px">
          <p style="font-size:16px;color:#374151">Hi <strong>${signerName}</strong>,</p>
          <p style="color:#374151">This is a friendly reminder that <strong>${senderName}</strong> is waiting for your signature on <strong>"${documentTitle}"</strong>.</p>
          <div style="text-align:center;margin:32px 0">
            <a href="${signingLink}" style="background:linear-gradient(135deg,#6366f1,#8b5cf6);color:white;padding:16px 32px;border-radius:8px;text-decoration:none;font-size:16px;font-weight:bold;display:inline-block">
              Sign Document Now →
            </a>
          </div>
          <hr style="border:1px solid #e5e7eb;margin:24px 0"/>
          <p style="color:#9ca3af;font-size:12px;text-align:center">Powered by <a href="https://snaphw.com" style="color:#6366f1">OpenPDF Studio</a></p>
        </div>
      </div>`,
  });
}
