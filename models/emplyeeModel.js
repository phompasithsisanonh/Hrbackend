const mongoose = require("mongoose");

const employeeSchema = new mongoose.Schema({
  HrAdminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Auth",
    required: true,
  },
  emplyeebarCode: {
    type: Number,
  },
  personalInfo: {
    fullName: { type: String, required: true },
    dob: { type: Date, required: true },
    gender: String,
    ethnicity: String,
    nationality: String,
    religion: String,
    village: String,
    district: String,
    maritalStatus: String,
    phone: String,
    address: String,
    documentType: String,
    issueDate: Date,
    expiryDate: Date,
    documentNumber: String,
    profileImage: String, // URL จาก Cloudinary
    idCardImage: String, // URL จาก Cloudinary
  },
  educationHistory: [
    {
      level: String,
      major: String,
      university: String,
      country: String,
      graduationYear: Number,
      gpa: Number,
      certificate: String, // URL จาก Cloudinary
    },
  ],
  workExperience: [
    {
      company: String,
      position: String,
      startDate: Date,
      endDate: Date,
      referenceFile: String, // URL จาก Cloudinary
    },
  ],
  employmentInfo: {
    probationPeriod: Number,
    contractType: String,
    startDate: Date,
    contractDuration: Number,
    workStartTime: String,
    workEndTime: String,
    workplace: String,
    contractFile: String, // URL จาก Cloudinary
  },
  salaryInfo: {
    baseSalary: Number,
    overtimeRate: Number,
    commissionType: String,
    commissionRate: Number,
    annualHolidays: Number,
  },
  socialSecurity: [
    {
      type: { type: String },
      rate: String,
      registrationPlace: String,
      registrationDate: Date,
      _id: false,
    },
  ],
  salarydetail: {
    calculateTimeOThour: Number,
    calculateTimeOTminute: Number,
    calculateTimeLateHour: Number,
    calculateTimeLateMinute: Number,
    incomeNet: Number,
  },
  department: {
    type: Object,
  },
  position: {
    type: Object,
  },
  dataset: [
    {
      countday: Number,
      countsix: Number,
      countholidayreq: Number,
      content: String,
      matchedEmployee: Number,
      leaveId: mongoose.Schema.Types.ObjectId,
    },
  ],
  resignedDate: {
    type: Date,
  },
  changeResinedDate: {
    type: Date,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  DepartmentLink: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "DataEmployee",
  },
  bennifits: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Benefits",
    },
  ],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Employee", employeeSchema);
