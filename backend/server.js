import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";

dotenv.config();

// Load your service account key
const serviceAccount = JSON.parse(fs.readFileSync("./serviceAccountKey.json", "utf8"));

// Initialize Firebase Admin
initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();
const app = express();

app.use(cors());
app.use(express.json());

// ✅ Example route - Add a new waste entry
app.post("/api/waste", async (req, res) => {
  try {
    const { type, volume, location, user } = req.body;
    if (!user?.uid) return res.status(401).send({ error: "Unauthorized" });

    await db.collection("wasteEntries").add({
      type,
      volume,
      location,
      submitterId: user.uid,
      submitterEmail: user.email || null,
      createdAt: new Date(),
    });

    res.status(200).send({ message: "Waste entry added" });
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: err.message });
  }
});

app.get("/api/waste", async (req, res) => {
  try {
    const snapshot = await db.collection("wasteEntries").get();
    const entries = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.status(200).send(entries);
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Backend running on port ${PORT}`));
