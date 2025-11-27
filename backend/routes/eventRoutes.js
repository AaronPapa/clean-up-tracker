// backend/routes/eventRoutes.js
const express = require("express");
const axios = require("axios");
const Event = require("../models/Event");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Create event (any logged-in user; you can restrict to leaders/admins if you want)
router.post("/", protect, async (req, res) => {
  try {
    const { title, description, location, date } = req.body;
    if (!title || !location || !date) {
      return res
        .status(400)
        .json({ message: "Title, location, and date are required." });
    }

    const event = await Event.create({
      title,
      description,
      location,
      date,
      createdBy: req.user._id,
    });

    res.status(201).json(event);
  } catch (err) {
    console.error("CREATE EVENT ERROR:", err);
    res.status(500).json({ message: "Failed to create event." });
  }
});

// Get all UPCOMING events (past events are hidden)
router.get("/", protect, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const events = await Event.find({ date: { $gte: today } })
      .sort({ date: 1 })
      .populate("createdBy", "name")
      .populate("participants", "name email");

    res.json(events);
  } catch (err) {
    console.error("GET EVENTS ERROR:", err);
    res.status(500).json({ message: err.message || "Failed to load events." });
  }
});

// Join event
router.post("/:id/join", protect, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });

    const userId = req.user._id;

    if (!event.participants.some((p) => String(p) === String(userId))) {
      event.participants.push(userId);
      await event.save();
    }

    const populated = await Event.findById(event._id)
      .populate("createdBy", "name")
      .populate("participants", "name email");

    res.json(populated);
  } catch (err) {
    console.error("JOIN EVENT ERROR:", err);
    res.status(500).json({ message: err.message || "Failed to join event." });
  }
});

/**
 * DAILY REMINDER ENDPOINT
 * Called by Render Cron (no JWT) with a secret key: ?key=REMINDER_SECRET
 * Finds events scheduled for "tomorrow" and emails all participants using EmailJS.
 */
router.get("/reminders/daily", async (req, res) => {
  try {
    const secret = process.env.REMINDER_SECRET;
    if (!secret || req.query.key !== secret) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const serviceId = process.env.EMAILJS_SERVICE_ID;
    const templateId = process.env.EMAILJS_TEMPLATE_ID_REMINDER || process.env.EMAILJS_TEMPLATE_ID;
    const publicKey = process.env.EMAILJS_PUBLIC_KEY;

    if (!serviceId || !templateId || !publicKey) {
      console.warn("EmailJS env vars missing; skipping reminders.");
      return res.status(200).json({ message: "EmailJS not configured; skipping." });
    }

    // Compute "tomorrow" range
    const now = new Date();
    const tomorrowStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1,
      0,
      0,
      0,
      0
    );
    const tomorrowEnd = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1,
      23,
      59,
      59,
      999
    );

    const events = await Event.find({
      date: { $gte: tomorrowStart, $lte: tomorrowEnd },
      participants: { $exists: true, $ne: [] },
    })
      .populate("participants", "name email")
      .populate("createdBy", "name");

    if (events.length === 0) {
      return res
        .status(200)
        .json({ message: "No events with participants scheduled for tomorrow." });
    }

    const emailRequests = [];

    for (const evt of events) {
      const niceDate = evt.date.toLocaleDateString("en-PH", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });

      for (const participant of evt.participants) {
        if (!participant.email) continue;

        const templateParams = {
          to_name: participant.name || "Volunteer",
          to_email: participant.email,
          event_title: evt.title,
          event_date: niceDate,
          event_location: evt.location,
        };

        const payload = {
          service_id: serviceId,
          template_id: templateId,
          user_id: publicKey,
          template_params: templateParams,
        };

        // push axios promise
        emailRequests.push(
          axios
            .post("https://api.emailjs.com/api/v1.0/email/send", payload)
            .catch((err) => {
              console.error(
                `Failed to send reminder to ${participant.email}:`,
                err.response?.data || err.message
              );
            })
        );
      }
    }

    await Promise.all(emailRequests);

    res.status(200).json({
      message: `Processed ${events.length} events for tomorrow.`,
    });
  } catch (err) {
    console.error("REMINDER CRON ERROR:", err);
    res.status(500).json({ message: "Failed to run reminders." });
  }
});

module.exports = router;
