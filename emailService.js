const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// ── Existing: approval email (UNCHANGED) ────────────────────────
const sendApprovalEmail = async (parentEmail, parentName, studentName, details) => {
  try {
    const mailOptions = {
      from: '"UniHostel Management" <no-reply@unihostel.com>',
      to:   parentEmail,
      subject: `✅ Night Out Approved — ${studentName}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;border:1px solid #e0e0e0;border-radius:10px;">
          <div style="background:#1e3a5f;padding:20px;border-radius:8px;text-align:center;margin-bottom:20px;">
            <h1 style="color:white;margin:0;">🏠 UniHostel</h1>
            <p style="color:rgba(255,255,255,0.8);margin:5px 0 0;">Hostel Management System</p>
          </div>
          <p style="color:#333;">Dear <strong>${parentName}</strong>,</p>
          <p style="color:#333;">Your ward <strong>${studentName}</strong> has been granted permission for a night out.</p>
          <div style="background:#f0f7ff;border-left:4px solid #3b82f6;padding:15px;border-radius:5px;margin:20px 0;">
            <h3 style="margin:0 0 10px;color:#1e3a5f;">Night Out Details</h3>
            <p style="margin:5px 0;color:#333;"><strong>Destination:</strong> ${details.destination}</p>
            <p style="margin:5px 0;color:#333;"><strong>Reason:</strong> ${details.reason}</p>
            <p style="margin:5px 0;color:#333;"><strong>Departure:</strong> ${details.outDate} at ${details.outTime}</p>
            <p style="margin:5px 0;color:#333;"><strong>Return:</strong> ${details.returnDate} at ${details.returnTime}</p>
            <p style="margin:5px 0;color:#333;"><strong>Room Number:</strong> ${details.roomNumber}</p>
          </div>
          <div style="background:#fff3cd;border-left:4px solid #ffc107;padding:15px;border-radius:5px;margin:20px 0;">
            <p style="margin:0;color:#856404;"><strong>⚠️ Please Note:</strong> If your ward does not return by the mentioned time, please contact the hostel warden immediately.</p>
          </div>
          <div style="border-top:1px solid #e0e0e0;margin-top:20px;padding-top:20px;text-align:center;">
            <p style="color:#888;font-size:12px;">This is an automated message from UniHostel Management System</p>
          </div>
        </div>`
    };
    await transporter.sendMail(mailOptions);
    console.log(`✅ Approval email sent to ${parentEmail}`);
    return true;
  } catch (err) {
    console.error('❌ Email error:', err.message);
    return false;
  }
};

// ── Existing: rejection email (UNCHANGED) ───────────────────────
const sendRejectionEmail = async (parentEmail, parentName, studentName, details, remarks) => {
  try {
    const mailOptions = {
      from: '"UniHostel Management" <no-reply@unihostel.com>',
      to:   parentEmail,
      subject: `❌ Night Out Request Rejected — ${studentName}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;border:1px solid #e0e0e0;border-radius:10px;">
          <div style="background:#1e3a5f;padding:20px;border-radius:8px;text-align:center;margin-bottom:20px;">
            <h1 style="color:white;margin:0;">🏠 UniHostel</h1>
            <p style="color:rgba(255,255,255,0.8);margin:5px 0 0;">Hostel Management System</p>
          </div>
          <p style="color:#333;">Dear <strong>${parentName}</strong>,</p>
          <p style="color:#333;">The night out request for your ward <strong>${studentName}</strong> has been <strong style="color:red;">rejected</strong>.</p>
          <div style="background:#fff0f0;border-left:4px solid #ef4444;padding:15px;border-radius:5px;margin:20px 0;">
            <h3 style="margin:0 0 10px;color:#991b1b;">Request Details</h3>
            <p style="margin:5px 0;color:#333;"><strong>Destination:</strong> ${details.destination}</p>
            <p style="margin:5px 0;color:#333;"><strong>Reason:</strong> ${details.reason}</p>
            <p style="margin:5px 0;color:#333;"><strong>Admin Remarks:</strong> ${remarks || 'No remarks provided'}</p>
          </div>
          <div style="border-top:1px solid #e0e0e0;margin-top:20px;padding-top:20px;text-align:center;">
            <p style="color:#888;font-size:12px;">This is an automated message from UniHostel Management System</p>
          </div>
        </div>`
    };
    await transporter.sendMail(mailOptions);
    console.log(`✅ Rejection email sent to ${parentEmail}`);
    return true;
  } catch (err) {
    console.error('❌ Email error:', err.message);
    return false;
  }
};

// ── NEW: late return alert email ─────────────────────────────────
const sendLateReturnEmail = async (parentEmail, parentName, studentName, details) => {
  try {
    const mailOptions = {
      from: '"UniHostel Management" <no-reply@unihostel.com>',
      to:   parentEmail,
      subject: `🚨 URGENT: Late Return Alert — ${studentName}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;border:2px solid #ef4444;border-radius:10px;">
          <div style="background:#dc2626;padding:20px;border-radius:8px;text-align:center;margin-bottom:20px;">
            <h1 style="color:white;margin:0;">🚨 URGENT ALERT</h1>
            <p style="color:rgba(255,255,255,0.9);margin:5px 0 0;">UniHostel Management System</p>
          </div>

          <p style="color:#333;font-size:16px;">Dear <strong>${parentName}</strong>,</p>

          <p style="color:#dc2626;font-size:15px;font-weight:bold;">
            ⚠️ Your ward <strong>${studentName}</strong> has NOT returned to the hostel as scheduled.
          </p>

          <div style="background:#fff0f0;border-left:4px solid #ef4444;padding:15px;border-radius:5px;margin:20px 0;">
            <h3 style="margin:0 0 10px;color:#991b1b;">Details</h3>
            <p style="margin:5px 0;color:#333;"><strong>Student:</strong> ${studentName}</p>
            <p style="margin:5px 0;color:#333;"><strong>Room Number:</strong> ${details.roomNumber}</p>
            <p style="margin:5px 0;color:#333;"><strong>Roll Number:</strong> ${details.rollNumber}</p>
            <p style="margin:5px 0;color:#333;"><strong>Destination:</strong> ${details.destination}</p>
            <p style="margin:5px 0;color:#333;"><strong>Expected Return:</strong> ${details.expectedReturn}</p>
            <p style="margin:5px 0;color:#dc2626;font-weight:bold;"><strong>Overdue By:</strong> ${details.lateBy}</p>
          </div>

          <div style="background:#fef3c7;border-left:4px solid #f59e0b;padding:15px;border-radius:5px;margin:20px 0;">
            <p style="margin:0;color:#92400e;">
              <strong>📞 Please contact the hostel warden immediately:</strong><br/>
              ${details.wardenContact}
            </p>
          </div>

          <p style="color:#333;">Please try reaching your ward and inform the warden about their whereabouts.</p>

          <div style="border-top:1px solid #e0e0e0;margin-top:20px;padding-top:20px;text-align:center;">
            <p style="color:#888;font-size:12px;">This is an automated alert from UniHostel Management System</p>
          </div>
        </div>`
    };
    await transporter.sendMail(mailOptions);
    console.log(`✅ Late return alert email sent to ${parentEmail}`);
    return true;
  } catch (err) {
    console.error('❌ Late return email error:', err.message);
    return false;
  }
};

module.exports = { sendApprovalEmail, sendRejectionEmail, sendLateReturnEmail };
