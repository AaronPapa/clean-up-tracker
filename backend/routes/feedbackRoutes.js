// backend/routes/feedbackRoutes.js
const express = require("express");
const Feedback = require("../models/Feedback");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

// POST /api/feedback
// Regular user submits feedback
router.post("/", protect, async (req, res) => {
  try {
    const { category, message, eventId } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ message: "Feedback message is required" });
    }

    const feedback = await Feedback.create({
      user: req.user._id,
      category: category || "suggestion",
      message: message.trim(),
      relatedEvent: eventId || null,
    });

    res.status(201).json(feedback);
  } catch (err) {
    console.error("CREATE FEEDBACK ERROR:", err);
    res.status(500).json({ message: "Failed to submit feedback" });
  }
});

// GET /api/feedback/admin
// Admin / leader view all feedback
router.get(
  "/admin",
  protect,
  authorize("admin", "leader"),
  async (req, res) => {
    try {
      const feedbacks = await Feedback.find()
        .populate("user", "name email role")
        .populate("relatedEvent", "title date")
        .sort({ createdAt: -1 });

      res.json(feedbacks);
    } catch (err) {
      console.error("GET FEEDBACK ADMIN ERROR:", err);
      res.status(500).json({ message: "Failed to load feedback" });
    }
  }
);

// PATCH /api/feedback/:id/status
// Update status: new / in_review / resolved
router.patch(
  "/:id/status",
  protect,
  authorize("admin", "leader"),
  async (req, res) => {
    try {
      const { status } = req.body;
      if (!["new", "in_review", "resolved"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      const fb = await Feedback.findById(req.params.id);
      if (!fb) {
        return res.status(404).json({ message: "Feedback not found" });
      }

      fb.status = status;
      await fb.save();

      const populated = await Feedback.findById(fb._id)
        .populate("user", "name email role")
        .populate("relatedEvent", "title date");

      res.json(populated);
    } catch (err) {
      console.error("UPDATE FEEDBACK STATUS ERROR:", err);
      res.status(500).json({ message: "Failed to update feedback status" });
    }
  }
);

module.exports = router;
