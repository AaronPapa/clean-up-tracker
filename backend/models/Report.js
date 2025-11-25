// backend/models/Report.js
const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
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
    wasteVolumeKg: {
      type: Number,
      required: true,
      min: 0,
    },
    plasticKg: {
      type: Number,
      default: 0,
      min: 0,
    },
    paperKg: {
      type: Number,
      default: 0,
      min: 0,
    },
    metalKg: {
      type: Number,
      default: 0,
      min: 0,
    },
    glassKg: {
      type: Number,
      default: 0,
      min: 0,
    },
    otherKg: {
      type: Number,
      default: 0,
      min: 0,
    },
    locationCovered: {
      type: String,
      default: "",
      trim: true,
    },
    notes: {
      type: String,
      default: "",
      trim: true,
    },

    // Admin features:
    status: {
      type: String,
      enum: ["pending", "reviewed"],
      default: "pending",
    },
    assignedBarangay: {
      type: String,
      default: "",
      trim: true,
    },
    reviewedAt: {
      type: Date,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Report", reportSchema);
