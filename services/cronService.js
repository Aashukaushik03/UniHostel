const cron     = require('node-cron');
const NightOut = require('../models/NightOut');
const Student  = require('../models/Student');
const sendSMS  = require('./smsService');

function formatTime(date) {
  return new Date(date).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
}

async function checkLateReturns() {
  try {
    const now = new Date();
    console.log(`\n⏰ [CRON] Running late return check at ${formatTime(now)}`);

    const overdueRequests = await NightOut.find({
      status:       { $in: ['approved', 'out'] },
      isLateReturn: false,
    });

    let alertCount = 0;

    for (const request of overdueRequests) {
      if (!request.returnDate || !request.returnTime) continue;

      const [hours, minutes] = request.returnTime.split(':').map(Number);
      const expectedReturn   = new Date(request.returnDate);
      expectedReturn.setHours(hours, minutes, 0, 0);

      if (now <= expectedReturn) continue;

      const student = await Student.findById(request.student);
      if (!student) continue;

      request.isLateReturn = true;
      await request.save();

      const minutesLate = Math.floor((now - expectedReturn) / 60000);
      const hoursLate   = Math.floor(minutesLate / 60);
      const minsLeft    = minutesLate % 60;
      const lateText    = hoursLate > 0 ? `${hoursLate} hr ${minsLeft} min` : `${minutesLate} min`;

      console.log(`⚠️  LATE: ${student.name} | Room ${student.roomNumber} | ${lateText} overdue`);

      const parentSMS =
        `⚠️ UniHostel ALERT:\n` +
        `${student.name} (Room ${student.roomNumber}) has NOT returned yet.\n` +
        `Was expected at: ${formatTime(expectedReturn)}\n` +
        `Overdue by: ${lateText}\n` +
        `Please contact the hostel warden immediately.`;

      await sendSMS(student.parentPhone, parentSMS);

      if (process.env.WARDEN_PHONE) {
        const wardenSMS =
          `⚠️ UniHostel ALERT:\n` +
          `LATE RETURN: ${student.name}\n` +
          `Room: ${student.roomNumber} | Roll: ${student.rollNumber}\n` +
          `Expected: ${formatTime(expectedReturn)}\n` +
          `Overdue by: ${lateText}`;
        await sendSMS(process.env.WARDEN_PHONE, wardenSMS);
      }

      alertCount++;
    }

    if (alertCount === 0) {
      console.log('✅ [CRON] No late returns found.\n');
    } else {
      console.log(`🚨 [CRON] Sent alerts for ${alertCount} late student(s).\n`);
    }

  } catch (err) {
    console.error('❌ [CRON] Error:', err.message);
  }
}

function startLateReturnCron() {
  console.log('⏰ Late return cron job started — checks every 30 minutes');
  cron.schedule('*/30 * * * *', checkLateReturns, {
    scheduled: true,
    timezone:  'Asia/Kolkata'
  });
  checkLateReturns();
}

module.exports = { startLateReturnCron, checkLateReturns };