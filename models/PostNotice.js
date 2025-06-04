const { Schema, model } = require("mongoose");
const NoticeModelSchema = new Schema(
  {
    HrAdminId: {
      type: Schema.Types.ObjectId,
      ref: "Auth",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    author: {
      type: String,
      required: true,
      trim: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    postImage: {
      type: String,
      default: null, // Assuming you might want to store an image URL
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
  },
  { timestamps: true }
);
module.exports = model("Notice", NoticeModelSchema);
