// backend/routes/reportRoutes.js
const express = require("express");
const Report = require("../models/Report");
const Event = require("../models/Event");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

// POST /api/reports
// Create a new report (any logged-in user)
router.post("/", protect, async (req, res) => {
  try {
    const {
      eventId,
      wasteVolumeKg,
      plasticKg,
      paperKg,
      metalKg,
      glassKg,
      otherKg,
      locationCovered,
      notes,
    } = req.body;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // ✅ Only allow if:
    //  - user joined the event, OR
    //  - user created the event, OR
    //  - user is admin/leader
    const isParticipant = event.participants?.some((p) =>
      p.equals(req.user._id)
    );
    const isCreator =
      String(event.createdBy) === String(req.user._id);
    const isOfficial =
      req.user.role === "admin";

    if (!isParticipant && !isCreator && !isOfficial) {
      return res
        .status(403)
        .json({ message: "You must join this event before submitting a report." });
    }

    const report = await Report.create({
      event: eventId,
      submittedBy: req.user._id,
      wasteVolumeKg,
      plasticKg,
      paperKg,
      metalKg,
      glassKg,
      otherKg,
      locationCovered,
      notes,
    });

    res.status(201).json(report);
  } catch (err) {
    console.error("CREATE REPORT ERROR:", err);
    res.status(500).json({ message: "Failed to create report" });
  }
});


// GET /api/reports
// List reports (for regular users - currently all)
router.get("/", protect, async (req, res) => {
  try {
    const reports = await Report.find()
      .populate("event", "title location date")
      .populate("submittedBy", "name")
      .sort({ createdAt: -1 });

    res.json(reports);
  } catch (err) {
    console.error("GET REPORTS ERROR:", err);
    res.status(500).json({ message: "Failed to load reports" });
  }
});

// GET /api/reports/admin
// Full inbox for barangay officials / admins
router.get(
  "/admin",
  protect,
  authorize("admin", "leader"),
  async (req, res) => {
    try {
      const reports = await Report.find()
        .populate("event", "title location date")
        .populate("submittedBy", "name email role")
        .sort({ status: 1, createdAt: -1 }); // pending first, then latest

      res.json(reports);
    } catch (err) {
      console.error("ADMIN REPORTS ERROR:", err);
      res.status(500).json({ message: "Failed to load reports" });
    }
  }
);

// PATCH /api/reports/:id/review
// Mark as reviewed
router.patch(
  "/:id/review",
  protect,
  authorize("admin", "leader"),
  async (req, res) => {
    try {
      const report = await Report.findById(req.params.id);
      if (!report) {
        return res.status(404).json({ message: "Report not found" });
      }

      report.status = "reviewed";
      report.reviewedAt = new Date();
      report.reviewedBy = req.user._id;

      await report.save();

      // Re-fetch with population instead of chaining on the doc
      const populated = await Report.findById(report._id)
        .populate("event", "title location date")
        .populate("submittedBy", "name email role");

      res.json(populated);
    } catch (err) {
      console.error("MARK REVIEWED ERROR:", err);
      res.status(500).json({ message: "Failed to update report" });
    }
  }
);

// PATCH /api/reports/:id/assign
// Assign / update barangay
router.patch(
  "/:id/assign",
  protect,
  authorize("admin", "leader"),
  async (req, res) => {
    try {
      const { assignedBarangay } = req.body;

      const report = await Report.findById(req.params.id);
      if (!report) {
        return res.status(404).json({ message: "Report not found" });
      }

      report.assignedBarangay = assignedBarangay || "";
      await report.save();

      // Re-fetch with population instead of chaining on the doc
      const populated = await Report.findById(report._id)
        .populate("event", "title location date")
        .populate("submittedBy", "name email role");

      res.json(populated);
    } catch (err) {
      console.error("ASSIGN BARANGAY ERROR:", err);
      res.status(500).json({ message: "Failed to assign barangay" });
    }
  }
);

module.exports = router;
