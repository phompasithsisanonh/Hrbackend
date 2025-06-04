// Model: DataEmployeeSchema.js
const { Schema, model } = require("mongoose");

const DataEmployeeSchema = new Schema(
  {
    HrAdminId: {
      type: Schema.Types.ObjectId,
      ref: "Auth",
      required: true,
    },
    otTohour: {
      type: Number,
    },
    otminute: {
      type: Number,
    },
    latTohour: {
      type: Number,
    },
    latminute: {
      type: Number,
    },
    startWorkTime: {
      type: String,
    },
    standardTimeWorkHour: {
      type: Number,
    },
    department: [
      {
        departmentId: {
          type: String,
        },
        type: {
          type: String,
        },
        position: [
          {
            type: {
              type: String,
            },
            positionId: {
              type: String,
            },
            level: {
              type: String,
            },
          },
        ],
      },
    ],
    typeCommission: {
      type: {
        type: String,
      },
      rate: {
        type: String,
      },
    },
    setAnnualHolidays: {
      type: Number,
    },
    contentsOfHolidays: [
      {
        countday: {
          type: Number,
        },
        content: {
          type: String,
        },
      },
    ],
    typeOfSecurity: [
      {
        type: {
          type: String,
        },
        rate: {
          type: Number,
        },
      },
    ],
  },
  { timestamps: true }
);
DataEmployeeSchema.virtual("Department", {
  ref: "Department",
  localField: "_id",
  foreignField: "Department_id",
});
module.exports = model("DataEmployee", DataEmployeeSchema);
