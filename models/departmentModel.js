const mongoose = require("mongoose");

const departmentSchema = new mongoose.Schema({
  Department_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "DataEmployee",
  },
});

module.exports = mongoose.model("Department", departmentSchema);
