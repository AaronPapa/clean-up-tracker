// backend/server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";
import path from "path";

dotenv.config();

// === FIREBASE ADMIN SDK (Deployment Ready) ===
let serviceAccount;

// Check if the service account key is in an environment variable (for production)
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  // Parse the env variable string back into a JSON object
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
} else {
  // Fallback for local development (reading the file)
  const serviceAccountPath = path.join(process.cwd(), "serviceAccountKey.json");
  if (!fs.existsSync(serviceAccountPath)) {
    console.error("Missing serviceAccountKey.json. For local development, add it to the backend/ folder.");
    process.exit(1);
  }
  serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));
}

initializeApp({
  credential: cert(serviceAccount),
});
// ============================================

const db = getFirestore();
const app = express();

// === CORS CONFIGURATION (Deployment Ready) ===
// Set the allowed origin from an environment variable
// Fallback to localhost:3000 for local development
const corsOptions = {
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
};

app.use(cors(corsOptions));
app.use(express.json());

// === WASTE ===
// POST /api/waste
app.post("/api/waste", async (req, res) => {
  try {
    const { type, volume, location, user } = req.body;
    if (!user?.uid) return res.status(401).json({ error: "Unauthorized" });

    const docRef = await db.collection("artifacts").doc(serviceAccount.project_id)
      .collection("public").doc("data")
      .collection("wasteEntries").add({
        type,
        volume,
        location,
        submitterId: user.uid,
        submitterEmail: user.email || null,
        createdAt: new Date().toISOString()
      });

    res.status(200).json({ message: "Waste entry added", id: docRef.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/waste
app.get("/api/waste", async (req, res) => {
  try {
    const col = db.collection("artifacts").doc(serviceAccount.project_id)
      .collection("public").doc("data")
      .collection("wasteEntries");
    const snapshot = await col.get();
    const entries = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    res.status(200).json(entries);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// === EVENTS ===
// POST /api/events
app.post("/api/events", async (req, res) => {
  try {
    const { title, description, location, date, user } = req.body;
    if (!user?.uid) return res.status(401).json({ error: "Unauthorized" });

    const docRef = await db.collection("artifacts").doc(serviceAccount.project_id)
      .collection("public").doc("data")
      .collection("events").add({
        title,
        description,
        location,
        date,
        creatorId: user.uid,
        creatorEmail: user.email || null,
        createdAt: new Date().toISOString()
      });

    res.status(200).json({ message: "Event created", id: docRef.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/events
app.get("/api/events", async (req, res) => {
  try {
    const col = db.collection("artifacts").doc(serviceAccount.project_id)
      .collection("public").doc("data")
      .collection("events");
    const snapshot = await col.get();
    const events = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    res.status(200).json(events);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// === STATS ===
// GET /api/stats
app.get("/api/stats", async (req, res) => {
  try {
    const wasteCol = db.collection("artifacts").doc(serviceAccount.project_id)
      .collection("public").doc("data")
      .collection("wasteEntries");
    const snapshot = await wasteCol.get();
    const entries = snapshot.docs.map(d => d.data());

    const totalsByType = {};
    const totalsByUser = {};
    let totalEntries = 0;

    entries.forEach((e) => {
      totalEntries += 1;
      const t = e.type || "Unknown";
      totalsByType[t] = (totalsByType[t] || 0) + 1;
      const uid = e.submitterId || "unknown";
      totalsByUser[uid] = (totalsByUser[uid] || 0) + 1;
    });

    res.status(200).json({ totalEntries, totalsByType, totalsByUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Health check
app.get("/", (req, res) => res.send({ status: "ok" }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Backend running on port ${PORT}`));