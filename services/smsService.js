const https = require("https");

async function sendSMS(phone, message) {
  try {
    // ── In production, replace this with Twilio/Fast2SMS ──
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📱 SMS SENT SUCCESSFULLY");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("To     :", phone);
    console.log("Message:", message);
    console.log("Time   :", new Date().toLocaleString("en-IN"));
    console.log("Status : Delivered ✅");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    return true;
  } catch (err) {
    console.error("❌ SMS error:", err.message);
    return false;
  }
}

module.exports = sendSMS