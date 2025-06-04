// Model: DataEmployeeSchema.js
const { Schema, model } = require("mongoose");

const BenefitsSchema = new Schema(
  {
    HrAdminId: {
      type: Schema.Types.ObjectId,
      ref: "Auth",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    eligibility: {
      type: String,
      required: true,
    },
    attachedDocument: {
      type: String,
      default: null, // Assuming you might want to store a document URL
    },
    isActive: {
      type: Boolean,
      default: true, // Indicates if the benefit is currently active
    },
  },
  { timestamps: true }
);
BenefitsSchema.virtual("Employee", {
  ref: "Employee",
  localField: "_id",
  foreignField: "bennifits",
});
module.exports = model("Benefits", BenefitsSchema);
