// backend/routes/feedbackRoutes.js
const express = require("express");
const Feedback = require("../models/Feedback");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

/**
 * POST /api/feedback
 * Regular user submits feedback
 */
router.post("/", protect, async (req, res) => {
  try {
    const { category, message, relatedEvent } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ message: "Feedback message is required" });
    }

    const feedback = await Feedback.create({
      user: req.user._id,
      category: category || "suggestion",
      message: message.trim(),
      relatedEvent: relatedEvent || null,
    });

    res.status(201).json(feedback);
  } catch (err) {
    console.error("CREATE FEEDBACK ERROR:", err);
    res.status(500).json({ message: "Failed to submit feedback" });
  }
});

/**
 * GET /api/feedback
 * - Regular users: only their own feedback
 * - Admin/leader: all feedback
 */
router.get("/", protect, async (req, res) => {
  try {
    const isOfficial =
      req.user.role === "admin" || req.user.role === "leader";

    const query = isOfficial ? {} : { user: req.user._id };

    const feedbacks = await Feedback.find(query)
      .populate("user", "name email role")
      .populate("relatedEvent", "title date location")
      .sort({ createdAt: -1 });

    res.json(feedbacks);
  } catch (err) {
    console.error("GET FEEDBACK ERROR:", err);
    res.status(500).json({ message: "Failed to load feedback" });
  }
});

/**
 * GET /api/feedback/admin
 * (Optional explicit admin route, keeps your other code working
 *  if you ever call /api/feedback/admin directly.)
 */
router.get(
  "/admin",
  protect,
  authorize("admin", "leader"),
  async (req, res) => {
    try {
      const feedbacks = await Feedback.find()
        .populate("user", "name email role")
        .populate("relatedEvent", "title date location")
        .sort({ createdAt: -1 });

      res.json(feedbacks);
    } catch (err) {
      console.error("GET FEEDBACK ADMIN ERROR:", err);
      res.status(500).json({ message: "Failed to load feedback" });
    }
  }
);

/**
 * PATCH /api/feedback/:id/status
 * Update status: new / in_review / resolved
 */
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
        .populate("relatedEvent", "title date location");

      res.json(populated);
    } catch (err) {
      console.error("UPDATE FEEDBACK STATUS ERROR:", err);
      res.status(500).json({ message: "Failed to update feedback status" });
    }
  }
);

/**
 * PATCH /api/feedback/:id/reply
 * Save an admin/leader reply to a feedback item
 */
router.patch(
  "/:id/reply",
  protect,
  authorize("admin", "leader"),
  async (req, res) => {
    try {
      const { adminReply } = req.body;

      const fb = await Feedback.findById(req.params.id);
      if (!fb) {
        return res.status(404).json({ message: "Feedback not found" });
      }

      fb.adminReply = adminReply || "";
      // optionally auto-move status when replying
      if (adminReply && fb.status === "new") {
        fb.status = "in_review";
      }

      await fb.save();

      const populated = await Feedback.findById(fb._id)
        .populate("user", "name email role")
        .populate("relatedEvent", "title date location");

      res.json(populated);
    } catch (err) {
      console.error("UPDATE FEEDBACK REPLY ERROR:", err);
      res.status(500).json({ message: "Failed to save reply" });
    }
  }
);

module.exports = router;
