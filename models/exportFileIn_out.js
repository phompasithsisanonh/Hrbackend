const mongoose = require("mongoose");

const EmployeeFileInSchema = new mongoose.Schema({
  filtercheckIdcode: {
    type: String,
  },
  HrAdminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Auth",
    required: true,
  },
  emplyeecode: {
    type: Number,
  },
  date: {
    type: String,
  },
  fullName: {
    type: String,
  },
  startWorkTime: {
    type: String,
  },
  outWorkTime: {
    type: String,
  },
  inTime: {
    type: String,
  },
  outTime: {
    type: String,
  },
  lateTime: {
    type: String,
  },
  earlyTime: {
    type: String,
  },
  //คำนวนเวลาทำงานเกีนเวลา
  calculateTimeOThour: {
    type: Number,
  },
  calculateTimeOTminute: {
    type: Number,
  },
  //คำนวนเวลามาสาย
  calculateTimeLateHour: {
    type: Number,
  },
  calculateTimeLateMinute: {
    type: Number,
  },
  incomeNet: {
    type: Number,
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("EmployeeFileIn", EmployeeFileInSchema);
