// backend/routes/eventRoutes.js
const express = require("express");
const Event = require("../models/Event");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// POST /api/events
// Create event (any logged-in user; you can later restrict to leaders/admin)
router.post("/", protect, async (req, res) => {
  try {
    const { title, description, location, date } = req.body;

    if (!title || !location || !date) {
      return res.status(400).json({
        message: "Title, location, and date are required",
      });
    }

    const event = await Event.create({
      title,
      description,
      location,
      date,
      createdBy: req.user._id,
      participants: [req.user._id], // creator auto-joins
    });

    res.status(201).json(event);
  } catch (err) {
    console.error("CREATE EVENT ERROR:", err);
    res.status(500).json({ message: err.message || "Failed to create event" });
  }
});

// GET /api/events
// Get all upcoming events
router.get("/", protect, async (req, res) => {
  try {
    const events = await Event.find()
      .sort({ date: 1 })
      .populate("createdBy", "name")
      .populate("participants", "name");

    res.json(events);
  } catch (err) {
    console.error("GET EVENTS ERROR:", err);
    res.status(500).json({ message: err.message || "Failed to load events" });
  }
});

// POST /api/events/:id/join
// Join event
router.post("/:id/join", protect, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    const alreadyJoined = event.participants.some(
      (p) => String(p) === String(req.user._id)
    );

    if (!alreadyJoined) {
      event.participants.push(req.user._id);
      await event.save();
    }

    const populated = await Event.findById(event._id)
      .populate("createdBy", "name")
      .populate("participants", "name");

    res.json(populated);
  } catch (err) {
    console.error("JOIN EVENT ERROR:", err);
    res.status(500).json({ message: err.message || "Failed to join event" });
  }
});

module.exports = router;
