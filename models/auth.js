const { Schema, model } = require("mongoose");
const authSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    tel: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    typeBusiness: {
      type: String,
    },
    address: {
      type: String,
    },
    password: {
      type: String,
      required: true,
    },
    image: {
      type: String,
    },
    status: {
      type: String,
      default: "active",
    },
    role: {
      type: String,
      default: ["CADMIN", "CHR", "CACCOUNTING", "CINVENTORY", "CMARKETTING"],
    },
  },
  { timestamps: true }
);

authSchema.virtual("Employee", {
  ref: "Employee",
  localField: "_id",
  foreignField: "HrAdminId",
});
authSchema.virtual("TaxModel", {
  ref: "TaxModel",
  localField: "_id",
  foreignField: "HrAdminId",
});

authSchema.virtual("DataEmployee", {
  ref: "DataEmployee",
  localField: "_id",
  foreignField: "HrAdminId",
});
authSchema.virtual("EmployeeFileIn", {
  ref: "EmployeeFileIn",
  localField: "_id",
  foreignField: "HrAdminId",
});
authSchema.virtual("DataSalary", {
  ref: "DataSalary",
  localField: "_id",
  foreignField: "HrAdminId",
});
authSchema.virtual("receiptPaymentSalary", {
  ref: "receiptPaymentSalary",
  localField: "_id",
  foreignField: "HrAdminId",
});
authSchema.virtual("LeaveRequest", {
  ref: "LeaveRequest",
  localField: "_id",
  foreignField: "HrAdminId",
});
authSchema.virtual("Notice", {
  ref: "Notice",
  localField: "_id",
  foreignField: "HrAdminId",
});
authSchema.virtual("Benefits", {
  ref: "Benefits",
  localField: "_id",
  foreignField: "HrAdminId",
});
module.exports = model("Auth", authSchema);
