// frontend/src/pages/Reports.jsx
import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const Reports = () => {
  const { user } = useAuth();
  const token = user?.token;
  const isReviewer = user?.role === "admin";

  const [events, setEvents] = useState([]);
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);

  const [form, setForm] = useState({
    eventId: "",
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

    const plastic = Number(form.plasticKg || 0);
    const paper = Number(form.paperKg || 0);
    const metal = Number(form.metalKg || 0);
    const glass = Number(form.glassKg || 0);
    const other = Number(form.otherKg || 0);

    const total = plastic + paper + metal + glass + other;

    if (!form.eventId) {
      setError("Please select an event.");
      setSaving(false);
      return;
    }

    if (total <= 0) {
      setError("Please enter at least some amount of collected waste.");
      setSaving(false);
      return;
    }

    const payload = {
      eventId: form.eventId,
      wasteVolumeKg: total,
      plasticKg: plastic,
      paperKg: paper,
      metalKg: metal,
      glassKg: glass,
      otherKg: other,
      locationCovered: form.locationCovered,
      notes: form.notes,
    };

    try {
      await axios.post(`${API}/api/reports`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setForm({
        eventId: "",
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

  const handleSelectReport = (rep) => {
    setSelectedReport(rep);
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

      {/* For admins/leaders we use a single-column layout */}
      <div
        className={
          isReviewer ? "reports-layout reports-layout-single" : "reports-layout"
        }
      >
        {/* LEFT: Submit report (hidden for admins/leaders) */}
        {!isReviewer && (
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
        )}

        {/* RIGHT: Recent reports (full width for admins/leaders) */}
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
              <div
                key={rep._id}
                className={
                  "report-item" +
                  (isReviewer ? " report-item-clickable" : "")
                }
                onClick={isReviewer ? () => handleSelectReport(rep) : undefined}
              >
                <div className="report-header">
                  <div>
                    <p className="report-title">
                      {rep.event?.title || "Clean-Up Event"}
                    </p>
                    <p className="report-meta">
                      {rep.locationCovered ||
                        rep.event?.location ||
                        "No area"}
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

          {/* Admin/leader detail view */}
          {isReviewer && selectedReport && (
            <div className="report-detail card mt-3">
              <h3 className="section-title mb-2">
                Report Details
              </h3>
              <p className="report-detail-title">
                {selectedReport.event?.title || "Clean-Up Event"}
              </p>
              <p className="report-detail-meta">
                Location:{" "}
                {selectedReport.locationCovered ||
                  selectedReport.event?.location ||
                  "Not specified"}
              </p>
              <p className="report-detail-meta">
                Submitted by{" "}
                <strong>
                  {selectedReport.submittedBy?.name || "Unknown"}
                </strong>{" "}
                on{" "}
                {new Date(selectedReport.createdAt).toLocaleString()}
              </p>

              <hr className="report-detail-divider" />

              <p className="report-detail-meta">
                <strong>Total waste:</strong>{" "}
                {Number(selectedReport.wasteVolumeKg || 0).toFixed(1)} kg
              </p>
              <ul className="report-detail-breakdown">
                <li>Plastic: {selectedReport.plasticKg} kg</li>
                <li>Paper: {selectedReport.paperKg} kg</li>
                <li>Metal: {selectedReport.metalKg} kg</li>
                <li>Glass: {selectedReport.glassKg} kg</li>
                <li>Other: {selectedReport.otherKg} kg</li>
              </ul>

              {selectedReport.notes && (
                <>
                  <hr className="report-detail-divider" />
                  <p className="report-detail-notes-label">
                    Notes / observations
                  </p>
                  <p className="report-detail-notes">
                    “{selectedReport.notes}”
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports;
