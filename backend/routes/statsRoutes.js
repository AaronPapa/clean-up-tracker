// backend/routes/statsRoutes.js
const express = require("express");
const Report = require("../models/Report"); // <-- use the same Report model
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");

// Simple stats for dashboard and home snapshot
router.get("/", protect, async (req, res) => {
  try {
    const reports = await Report.find();

    const totalWaste = reports.reduce(
      (sum, r) => sum + (r.wasteVolumeKg || 0),
      0
    );
    const eventsReported = new Set(reports.map((r) => String(r.event))).size;

    const byType = reports.reduce(
      (acc, r) => {
        acc.plastic += r.plasticKg || 0;
        acc.paper += r.paperKg || 0;
        acc.metal += r.metalKg || 0;
        acc.glass += r.glassKg || 0;
        acc.other += r.otherKg || 0;
        return acc;
      },
      { plastic: 0, paper: 0, metal: 0, glass: 0, other: 0 }
    );

    res.json({
      totalWasteKg: totalWaste,
      totalReports: reports.length,
      eventsReported,
      byType,
    });
  } catch (err) {
    console.error("STATS ERROR:", err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
