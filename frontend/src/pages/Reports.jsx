// frontend/src/pages/Reports.jsx
import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const Reports = () => {
  const { user } = useAuth();
  const token = user?.token;

  const [events, setEvents] = useState([]);
  const [reports, setReports] = useState([]);
  const [form, setForm] = useState({
    eventId: "",
    wasteVolumeKg: "",
    plasticKg: "",
    paperKg: "",
    metalKg: "",
    glassKg: "",
    otherKg: "",
    locationCovered: "",
    notes: "",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchEvents = async () => {
    try {
      const res = await axios.get(`${API}/api/events`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEvents(res.data);
    } catch (err) {
      console.error("Failed to load events:", err);
    }
  };

  const fetchReports = async () => {
    try {
      const res = await axios.get(`${API}/api/reports`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setReports(res.data);
    } catch (err) {
      console.error("Failed to load reports:", err);
    }
  };

  useEffect(() => {
    if (token) {
      fetchEvents();
      fetchReports();
    }
    // eslint-disable-next-line
  }, [token]);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    const payload = {
      ...form,
      wasteVolumeKg: Number(form.wasteVolumeKg),
      plasticKg: Number(form.plasticKg || 0),
      paperKg: Number(form.paperKg || 0),
      metalKg: Number(form.metalKg || 0),
      glassKg: Number(form.glassKg || 0),
      otherKg: Number(form.otherKg || 0),
    };

    try {
      await axios.post(`${API}/api/reports`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setForm({
        eventId: "",
        wasteVolumeKg: "",
        plasticKg: "",
        paperKg: "",
        metalKg: "",
        glassKg: "",
        otherKg: "",
        locationCovered: "",
        notes: "",
      });

      fetchReports();
    } catch (err) {
      const message =
        err.response?.data?.message || "Failed to submit report.";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-container">
      <header className="mb-4">
        <h1 className="page-title">Clean-Up Reports</h1>
        <p className="page-subtitle">
          Log waste collected for each event and review recent reports submitted
          by your team.
        </p>
      </header>

      <div className="reports-layout">
        {/* LEFT: Submit report */}
        <div className="card">
          <div className="card-header">
            <h2>Submit Report</h2>
            <p className="card-subtitle">
              Record details right after every clean-up for accurate tracking.
            </p>
          </div>

          {error && <div className="alert alert-danger mb-3">{error}</div>}

          <form onSubmit={handleSubmit} className="report-form">
            <div className="mb-3">
              <label className="block mb-1 text-sm">Event</label>
              <select
                name="eventId"
                value={form.eventId}
                onChange={handleChange}
                required
              >
                <option value="">Select event</option>
                {events.map((evt) => (
                  <option key={evt._id} value={evt._id}>
                    {evt.title} – {new Date(evt.date).toLocaleDateString()}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-grid mb-3">
              <div>
                <label className="block mb-1 text-sm">
                  Total waste collected (kg)
                </label>
                <input
                  name="wasteVolumeKg"
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder="e.g. 10"
                  value={form.wasteVolumeKg}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-grid-2 mb-3">
              <div>
                <label className="block mb-1 text-sm">Plastic (kg)</label>
                <input
                  name="plasticKg"
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder="e.g. 2.5"
                  value={form.plasticKg}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block mb-1 text-sm">Paper (kg)</label>
                <input
                  name="paperKg"
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder="e.g. 1.0"
                  value={form.paperKg}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block mb-1 text-sm">Metal (kg)</label>
                <input
                  name="metalKg"
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder="e.g. 0.5"
                  value={form.metalKg}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block mb-1 text-sm">Glass (kg)</label>
                <input
                  name="glassKg"
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder="e.g. 0.8"
                  value={form.glassKg}
                  onChange={handleChange}
                />
              </div>
              <div className="form-span-2">
                <label className="block mb-1 text-sm">Other (kg)</label>
                <input
                  name="otherKg"
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder="Other mixed waste"
                  value={form.otherKg}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="mb-3">
              <label className="block mb-1 text-sm">
                Location covered (e.g. &quot;Barangay 1 Riverbank&quot;)
              </label>
              <input
                name="locationCovered"
                placeholder='e.g. "Villar Sipag"'
                value={form.locationCovered}
                onChange={handleChange}
              />
            </div>

            <div className="mb-4">
              <label className="block mb-1 text-sm">
                Notes (e.g. unusual waste, recommendations)
              </label>
              <textarea
                name="notes"
                rows={3}
                placeholder="What did you notice? Any suggestions for the next clean-up?"
                value={form.notes}
                onChange={handleChange}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={saving}
            >
              {saving ? "Submitting..." : "Submit Report"}
            </button>
          </form>
        </div>

        {/* RIGHT: Recent reports */}
        <div className="card">
          <div className="card-header">
            <h2>Recent Reports</h2>
            <p className="card-subtitle">
              Latest submissions from all clean-up events.
            </p>
          </div>

          <div className="scroll-box reports-list">
            {reports.length === 0 && (
              <p className="text-sm text-muted">
                No reports yet. Submit your first clean-up data to see it here.
              </p>
            )}

            {reports.map((rep) => (
              <div key={rep._id} className="report-item">
                <div className="report-header">
                  <div>
                    <p className="report-title">
                      {rep.event?.title || "Clean-Up Event"}
                    </p>
                    <p className="report-meta">
                      {rep.locationCovered || rep.event?.location || "No area"}
                    </p>
                  </div>
                  <span className="pill pill-soft">
                    {Number(rep.wasteVolumeKg || 0).toFixed(1)} kg
                  </span>
                </div>

                <p className="report-types">
                  Types: P {rep.plasticKg} / Pa {rep.paperKg} / M{" "}
                  {rep.metalKg} / G {rep.glassKg} / O {rep.otherKg}
                </p>

                <p className="report-meta">
                  Submitted by {rep.submittedBy?.name || "Unknown"} on{" "}
                  {new Date(rep.createdAt).toLocaleString()}
                </p>

                {rep.notes && (
                  <p className="report-notes">“{rep.notes}”</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
