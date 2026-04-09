const QRCode = require('qrcode');

// ─────────────────────────────────────────────────────────────
// Generate a QR code as a base64 PNG string
// The QR encodes a JSON payload with night-out details
// ─────────────────────────────────────────────────────────────
async function generateGatePassQR(nightout) {
  try {

    // Data encoded inside the QR code
    const payload = JSON.stringify({
      id:          nightout._id.toString(),
      studentName: nightout.studentName,
      rollNumber:  nightout.rollNumber,
      roomNumber:  nightout.roomNumber,
      destination: nightout.destination,
      outDate:     nightout.outDate,
      returnDate:  nightout.returnDate,
      outTime:     nightout.outTime,
      returnTime:  nightout.returnTime,
      status:      nightout.status,
      issuedAt:    new Date().toISOString(),
    });

    // Generate QR as base64 data URL (can be shown directly in <img src="...">)
    const qrDataURL = await QRCode.toDataURL(payload, {
      errorCorrectionLevel: 'H',   // High — stays readable even if slightly damaged
      type: 'image/png',
      width: 300,
      margin: 2,
      color: {
        dark:  '#1e3a5f',          // Dark blue dots (matches your hostel theme)
        light: '#ffffff',
      },
    });

    console.log('✅ QR code generated for:', nightout.studentName);
    return qrDataURL;

  } catch (err) {
    console.error('❌ QR generation error:', err.message);
    return null;
  }
}

module.exports = { generateGatePassQR };
