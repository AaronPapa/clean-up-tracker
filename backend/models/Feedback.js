// backend/models/Feedback.js
const mongoose = require("mongoose");

const feedbackSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    category: {
      type: String,
      enum: ["suggestion", "issue", "question", "other"],
      default: "suggestion",
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    relatedEvent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
    },
    status: {
      type: String,
      enum: ["new", "in_review", "resolved"],
      default: "new",
    },
    // 🔧 NEW: for admin replies
    adminReply: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Feedback", feedbackSchema);
