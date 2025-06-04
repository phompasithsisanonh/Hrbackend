const { Schema, model } = require("mongoose");
const TaxModelSchema = new Schema(
  {
    HrAdminId: {
      type: Schema.Types.ObjectId,
      ref: "Auth",
      required: true,
    },
    id: {
      type: Number,
      required: true,
      unique: true,
    },
    minAmount: {
      type: Number,
      required: true,
    },
    maxAmount: {
      type: Number,
      required: true,
    },
    rate: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);
module.exports = model("TaxModel", TaxModelSchema);
