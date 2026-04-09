const express = require("express");
const router = express.Router();

const NightOut = require("../models/NightOut");  // ✅ FIXED: was "Nightout"
const Student = require("../models/Student");
const sendSMS = require("../services/smsService");


// MARK STUDENT OUT
router.put("/out/:id", async (req, res) => {
  try {
    const request = await NightOut.findById(req.params.id);  // ✅ FIXED

    if (!request) {
      return res.json({ success: false, message: "Request not found" });
    }

    if (request.status !== "approved") {  // ✅ NEW: only allow if approved
      return res.json({ success: false, message: "Student does not have an approved pass" });
    }

    const student = await Student.findById(request.student);
    if (!student) {
      return res.json({ success: false, message: "Student not found" });
    }

    request.outTimeActual = new Date();
    request.status = "out";
    await request.save();

    student.currentlyOut = true;           // ✅ NEW: update student record
    student.checkOutTime = request.outTimeActual;
    await student.save();

    await sendSMS(
      student.parentPhone,
      `UniHostel Alert:\n${student.name} has left the hostel.\n\nTime: ${request.outTimeActual}`
    );

    res.json({ success: true, message: "Student OUT recorded" });

  } catch (err) {
    console.error(err);
    res.json({ success: false, message: "Server error" });
  }
});


// MARK STUDENT IN
router.put("/in/:id", async (req, res) => {
  try {
    const request = await NightOut.findById(req.params.id);  // ✅ FIXED

    if (!request) {
      return res.json({ success: false, message: "Request not found" });
    }

    const student = await Student.findById(request.student);
    if (!student) {
      return res.json({ success: false, message: "Student not found" });
    }

    const returnTimeActual = new Date();

    // ✅ NEW: check if student is returning late
    let isLate = false;
    if (request.returnDate && request.returnTime) {
      const [hours, minutes] = request.returnTime.split(":").map(Number);
      const expectedReturn = new Date(request.returnDate);
      expectedReturn.setHours(hours, minutes, 0, 0);
      isLate = returnTimeActual > expectedReturn;
    }

    request.returnTimeActual = returnTimeActual;
    request.status = "returned";
    request.isLateReturn = isLate;         // ✅ NEW: save late flag
    await request.save();

    student.currentlyOut = false;          // ✅ NEW: update student record
    student.checkInTime = returnTimeActual;
    await student.save();

    const lateNote = isLate ? " ⚠️ LATE RETURN" : "";
    await sendSMS(
      student.parentPhone,
      `UniHostel Alert:\n${student.name} has returned safely${lateNote}.\n\nTime: ${returnTimeActual}`
    );

    res.json({ success: true, message: `Student IN recorded${isLate ? " (late return)" : ""}` });

  } catch (err) {
    console.error(err);
    res.json({ success: false, message: "Server error" });
  }
});


module.exports = router;