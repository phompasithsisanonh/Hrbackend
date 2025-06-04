const mongoose = require("mongoose");

const LeaveRequestSchema = new mongoose.Schema({
  leaveType: { type: String }, // ลากิจ, ลาพักร้อน ฯลฯ
  startDate: { type: Date },
  HrAdminId: { type: mongoose.Schema.Types.ObjectId },
  endDate: { type: Date },
  reason: { type: String },
  status: { type: String, default: "pending" }, // pending, approved, rejected
  createdAt: { type: Date, default: Date.now },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  approvedAt: { type: Date },
  emplyeeCode: {
    type: Number,
  },
});

module.exports = mongoose.model("LeaveRequest", LeaveRequestSchema);
