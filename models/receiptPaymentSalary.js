const { Schema, model } = require("mongoose");

const receiptPaymentSalarySchema = new Schema(
  {
    HrAdminId: {
      type: Schema.Types.ObjectId,
      ref: "Auth",
      required: true,
    },
    employeeCode: {
      type: Number,
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    year: {
      type: Number,
    },
    month: {
      type: Number,
    },
    personalInfo: {
      type: Object,
      required: true,
    },
    basicSalary: {
      type: Number,
      required: true,
    },
    salaryFirst: {
      type: Number,
      required: true,
    },
    socialSecurity: {
      type: Array,
      required: true,
    },
    socialSecurityMoney: {
      type: Number,
      required: true,
    },
    tax: {
      type: Number,
      required: true,
    },
    netExpense: {
      type: Number,
      default: 0,
    },
    netIncome: {
      type: Number,
      default: 0,
    },
    netSalary: {
      type: Number,
      required: true,
    },
    NetBennifits: {
      type: Number,
      required: true,
    },
    totalTimeOt: {
      type: Number,
      required: true,
    },
    totalTimeLate: {
      type: Number,
      required: true,
    },
    incomeItems: [
      {
        itemName: String,
        amount: Number,
      },
    ],
    expenseItems: [
      {
        itemName: String,
        amount: Number,
      },
    ],
    taxBracket: {
      minAmount: { type: Number, default: 0 },
      maxAmount: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

module.exports = model("receiptPaymentSalary", receiptPaymentSalarySchema);
