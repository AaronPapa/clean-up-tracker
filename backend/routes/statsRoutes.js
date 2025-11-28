// backend/routes/statsRoutes.js
const express = require("express");
const Report = require("../models/Report");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

/**
 * PUBLIC CITY SNAPSHOT
 * GET /api/stats/public
 * No auth required – used on the Home page.
 */
router.get("/public", async (req, res) => {
  try {
    const allReports = await Report.find();

    const totalWaste = allReports.reduce(
      (sum, r) => sum + (r.wasteVolumeKg || 0),
      0
    );

    const eventsReported = new Set(
      allReports.map((r) => String(r.event))
    ).size;

    const byType = allReports.reduce(
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
      totalReports: allReports.length,
      eventsReported,
      byType,
    });
  } catch (err) {
    console.error("PUBLIC STATS ERROR:", err);
    res
      .status(500)
      .json({ message: err.message || "Failed to load city snapshot" });
  }
});

/**
 * AUTHED STATS
 * GET /api/stats
 * Used by dashboards – includes per-user stats.
 */
router.get("/", protect, async (req, res) => {
  try {
    // All reports (city-wide) + reports by this user
    const [allReports, userReports] = await Promise.all([
      Report.find(),
      Report.find({ submittedBy: req.user._id }),
    ]);

    // ------ CITY-WIDE STATS ------
    const totalWaste = allReports.reduce(
      (sum, r) => sum + (r.wasteVolumeKg || 0),
      0
    );
    const eventsReported = new Set(
      allReports.map((r) => String(r.event))
    ).size;

    const byType = allReports.reduce(
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

    // ------ PER-USER STATS ------
    const myTotalWaste = userReports.reduce(
      (sum, r) => sum + (r.wasteVolumeKg || 0),
      0
    );

    const myByType = userReports.reduce(
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
      totalReports: allReports.length,
      eventsReported,
      byType,
      myStats: {
        totalWasteKg: myTotalWaste,
        totalReports: userReports.length,
        byType: myByType,
      },
    });
  } catch (err) {
    console.error("STATS ERROR:", err);
    res.status(500).json({ message: err.message || "Failed to load stats" });
  }
});

module.exports = router;
