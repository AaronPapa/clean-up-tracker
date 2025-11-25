// backend/models/CleanupReport.js
const mongoose = require("mongoose");

const cleanupReportSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    wasteVolumeKg: { type: Number, required: true }, // total kg collected
    plasticKg: { type: Number, default: 0 },
    paperKg: { type: Number, default: 0 },
    metalKg: { type: Number, default: 0 },
    glassKg: { type: Number, default: 0 },
    otherKg: { type: Number, default: 0 },
    notes: String,
    locationCovered: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("CleanupReport", cleanupReportSchema);
