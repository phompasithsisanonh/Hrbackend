// Model: DataEmployeeSchema.js
const { Schema, model } = require("mongoose");

const DataSalarySchema = new Schema(
  {
    HrAdminId: {
      type: Schema.Types.ObjectId,
      ref: "Auth",
      required: true,
    },
    otId: {
      type: Schema.Types.ObjectId,
    },
    emplyeecode: {
      type: Number,
      required: true,
      unique: true,
    },
    date: {
      type: String,
    },
    month: {
      type: Number,
    },
    year: {
      type: Number,
    },
    calculateTimeLateHour: {
      type: Number,
      required: true,
      default: 0,
    },
    calculateTimeLateMinute: {
      type: Number,
      required: true,
      default: 0,
    },
    calculateTimeOThour: {
      type: Number,
      required: true,
      default: 0,
    },
    calculateTimeOTminute: {
      type: Number,
      required: true,
      default: 0,
    },
    incomeNet: {
      type: Number,
      required: true,
      default: 0,
    },
    salaryfirst: {
      type: Number,
      required: true,
      default: 0,
    },
    baseSalary: {
      type: Number,
      required: true,
      default: 0,
    },
    socialSecurity: {
      type: Array,
      required: true,
    },
    personalInfo: {
      type: Object,
      required: true,
    },
    bennifits: {
      type:[Object],
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = model("DataSalary", DataSalarySchema);
