// frontend/src/pages/AdminReports.jsx
import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const AdminReports = () => {
  const { user } = useAuth();
  const token = user?.token;

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  // filters for reports
  const [filterText, setFilterText] = useState("");
  const [filterBarangay, setFilterBarangay] = useState("");
  const [filterStart, setFilterStart] = useState("");
  const [filterEnd, setFilterEnd] = useState("");

  // feedback state
  const [feedbacks, setFeedbacks] = useState([]);
  const [feedbackLoading, setFeedbackLoading] = useState(true);

  // selected report for detail view
  const [selectedReport, setSelectedReport] = useState(null);

  const authHeaders = {
    headers: { Authorization: `Bearer ${token}` },
  };

  const fetchReports = async () => {
    try {
      const res = await axios.get(`${API}/api/reports/admin`, authHeaders);
      setReports(res.data);
    } catch (err) {
      console.error("Failed to load admin reports:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFeedbacks = async () => {
    try {
      const res = await axios.get(`${API}/api/feedback/admin`, authHeaders);
      setFeedbacks(res.data);
    } catch (err) {
      console.error("Failed to load feedback:", err);
    } finally {
      setFeedbackLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchReports();
      fetchFeedbacks();
    }
  }, [token]);

  const handleMarkReviewed = async (id) => {
    try {
      await axios.patch(`${API}/api/reports/${id}/review`, {}, authHeaders);
      await fetchReports();

      // refresh selected report if it’s the one we just updated
      if (selectedReport && selectedReport._id === id) {
        const updated = await axios.get(`${API}/api/reports/admin`, authHeaders);
        const rep = updated.data.find((r) => r._id === id);
        setSelectedReport(rep || null);
      }
    } catch (err) {
      console.error("Failed to mark reviewed:", err);
      alert("Failed to mark as reviewed.");
    }
  };

  const handleAssignBarangay = async (rep) => {
    const current = rep.assignedBarangay || "";
    const assignedBarangay = prompt(
      "Enter barangay name to assign this report:",
      current
    );
    if (assignedBarangay === null) return; // cancelled

    try {
      await axios.patch(
        `${API}/api/reports/${rep._id}/assign`,
        { assignedBarangay },
        authHeaders
      );
      await fetchReports();

      if (selectedReport && selectedReport._id === rep._id) {
        setSelectedReport({ ...selectedReport, assignedBarangay });
      }
    } catch (err) {
      console.error("Failed to assign barangay:", err);
      alert("Failed to assign barangay.");
    }
  };

  const handleFeedbackStatus = async (id, status) => {
    try {
      await axios.patch(
        `${API}/api/feedback/${id}/status`,
        { status },
        authHeaders
      );
      fetchFeedbacks();
    } catch (err) {
      console.error("Failed to update feedback status:", err);
      alert("Failed to update feedback status.");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const filteredReports = reports.filter((rep) => {
    const textBlob = (
      (rep.locationCovered || "") +
      " " +
      (rep.event?.location || "") +
      " " +
      (rep.event?.title || "") +
      " " +
      (rep.submittedBy?.name || "") +
      " " +
      (rep.assignedBarangay || "")
    ).toLowerCase();

    const matchesText = textBlob.includes(filterText.toLowerCase());

    const barangay = (rep.assignedBarangay || "").toLowerCase();
    const matchesBarangay = filterBarangay
      ? barangay.includes(filterBarangay.toLowerCase())
      : true;

    const created = new Date(rep.createdAt);

    let matchesDate = true;
    if (filterStart) {
      const start = new Date(filterStart);
      if (created < start) matchesDate = false;
    }
    if (filterEnd) {
      const end = new Date(filterEnd);
      end.setHours(23, 59, 59, 999);
      if (created > end) matchesDate = false;
    }

    return matchesText && matchesBarangay && matchesDate;
  });

  const statusBadgeClass = (status) => {
    if (status === "resolved") return "status-pill status-pill-reviewed";
    if (status === "in_review") return "status-pill status-pill-pending";
    return "status-pill status-pill-new";
  };

  return (
    <div className="page-container">
      <header className="mb-4">
        <h1 className="page-title">Barangay Reports Inbox</h1>
        <p className="page-subtitle">
          View and manage clean-up data and community feedback submitted by
          residents, students, and volunteers across Las Piñas.
        </p>
      </header>

      {/* Filters + Print */}
      <div className="card mb-4 admin-filter-bar">
        <div className="admin-filter-left">
          <div className="admin-filter-row">
            <div className="admin-filter-block">
              <label className="admin-filter-label">Search</label>
              <input
                type="text"
                placeholder="Search by event, location, reporter…"
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
              />
            </div>
            <div className="admin-filter-block">
              <label className="admin-filter-label">Assigned barangay</label>
              <input
                type="text"
                placeholder="e.g. Barangay 1, Talon Dos"
                value={filterBarangay}
                onChange={(e) => setFilterBarangay(e.target.value)}
              />
            </div>
          </div>

          <div className="admin-filter-row">
            <div className="admin-filter-block">
              <label className="admin-filter-label">From date</label>
              <input
                type="date"
                value={filterStart}
                onChange={(e) => setFilterStart(e.target.value)}
              />
            </div>
            <div className="admin-filter-block">
              <label className="admin-filter-label">To date</label>
              <input
                type="date"
                value={filterEnd}
                onChange={(e) => setFilterEnd(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="admin-filter-right">
          <span className="badge-pill">
            Showing {filteredReports.length} of {reports.length} reports
          </span>
          <button className="btn btn-secondary btn-small" onClick={handlePrint}>
            Print view
          </button>
        </div>
      </div>

      {/* MAIN GRID: list on left, details on right */}
      <div className="admin-main-grid">
        {/* LEFT: Reports inbox */}
        <div className="admin-main-left">
          <div className="card admin-inbox mb-4">
            {loading && (
              <p className="text-sm text-muted">Loading reports…</p>
            )}

            {!loading && filteredReports.length === 0 && (
              <p className="text-sm text-muted">
                No reports match your filters. Try clearing the search or date
                range.
              </p>
            )}

            <div className="admin-report-list">
              {filteredReports.map((rep) => {
                const status = rep.status || "pending";
                const statusLabel =
                  status === "reviewed" ? "Reviewed" : "Pending review";

                return (
                  <article key={rep._id} className="admin-report-item">
                    <header className="admin-report-header">
                      <div>
                        <h3 className="admin-report-title">
                          {rep.event?.title || "Clean-Up Event"}
                        </h3>
                        <div className="admin-report-meta">
                          <span className="admin-report-location">
                            {rep.locationCovered ||
                              rep.event?.location ||
                              "Location not specified"}
                          </span>
                          <span>•</span>
                          <span>
                            {new Date(rep.createdAt).toLocaleString()}
                          </span>
                        </div>
                        {rep.assignedBarangay && (
                          <div className="admin-report-barangay">
                            Assigned to:{" "}
                            <strong>{rep.assignedBarangay}</strong>
                          </div>
                        )}
                      </div>

                      <div className="admin-report-summary">
                        <span className="admin-report-waste">
                          {Number(rep.wasteVolumeKg || 0).toFixed(1)} kg total
                        </span>
                        <span className="pill pill-soft">
                          Reporter: {rep.submittedBy?.name || "Unknown"}
                        </span>
                        <span
                          className={
                            "status-pill " +
                            (status === "reviewed"
                              ? "status-pill-reviewed"
                              : "status-pill-pending")
                          }
                        >
                          {statusLabel}
                        </span>
                        <div className="admin-report-actions">
                          <button
                            className="btn btn-small"
                            onClick={() => handleAssignBarangay(rep)}
                          >
                            Assign barangay
                          </button>
                          {status !== "reviewed" && (
                            <button
                              className="btn btn-primary btn-small"
                              onClick={() => handleMarkReviewed(rep._id)}
                            >
                              Mark reviewed
                            </button>
                          )}
                          <button
                            className="btn btn-ghost btn-small"
                            onClick={() => setSelectedReport(rep)}
                          >
                            View details
                          </button>
                        </div>
                      </div>
                    </header>

                    <p className="admin-report-types">
                      Types: P {rep.plasticKg} / Pa {rep.paperKg} / M{" "}
                      {rep.metalKg} / G {rep.glassKg} / O {rep.otherKg}
                    </p>

                    {rep.notes && (
                      <p className="admin-report-notes">“{rep.notes}”</p>
                    )}
                  </article>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT: Detail card */}
        <div className="admin-main-right">
          {selectedReport ? (
            <div className="card admin-detail-card">
              <div className="card-header">
                <h2>Report details</h2>
                <button
                  className="btn btn-ghost btn-small"
                  onClick={() => setSelectedReport(null)}
                >
                  Close
                </button>
              </div>

              <div className="admin-detail-grid">
                <div>
                  <h3 className="admin-detail-title">
                    {selectedReport.event?.title || "Clean-Up Event"}
                  </h3>
                  <p className="admin-detail-meta">
                    <strong>Location: </strong>
                    {selectedReport.locationCovered ||
                      selectedReport.event?.location ||
                      "Location not specified"}
                  </p>
                  <p className="admin-detail-meta">
                    <strong>Date submitted: </strong>
                    {new Date(selectedReport.createdAt).toLocaleString()}
                  </p>
                  <p className="admin-detail-meta">
                    <strong>Reporter: </strong>
                    {selectedReport.submittedBy?.name || "Unknown"}
                  </p>
                  {selectedReport.assignedBarangay && (
                    <p className="admin-detail-meta">
                      <strong>Assigned barangay: </strong>
                      {selectedReport.assignedBarangay}
                    </p>
                  )}
                </div>

                <div>
                  <h4 className="admin-detail-subtitle">Waste breakdown</h4>
                  <ul className="admin-detail-list">
                    <li>Plastic: {selectedReport.plasticKg} kg</li>
                    <li>Paper: {selectedReport.paperKg} kg</li>
                    <li>Metal: {selectedReport.metalKg} kg</li>
                    <li>Glass: {selectedReport.glassKg} kg</li>
                    <li>Other: {selectedReport.otherKg} kg</li>
                    <li>
                      <strong>Total: </strong>
                      {Number(selectedReport.wasteVolumeKg || 0).toFixed(1)} kg
                    </li>
                  </ul>

                  <p className="admin-detail-meta">
                    <strong>Status: </strong>
                    {selectedReport.status === "reviewed"
                      ? "Reviewed"
                      : "Pending review"}
                  </p>
                </div>
              </div>

              {selectedReport.notes && (
                <div className="admin-detail-notes">
                  <h4 className="admin-detail-subtitle">
                    Notes from reporter
                  </h4>
                  <p>“{selectedReport.notes}”</p>
                </div>
              )}
            </div>
          ) : (
            <div className="card admin-detail-card admin-detail-empty">
              <div className="card-header">
                <h2>Report details</h2>
              </div>
              <p className="text-sm text-muted">
                Select a report on the left to view full details here.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Feedback section (full width below) */}
      <div className="card admin-inbox">
        <div className="card-header">
          <h2>Community Feedback</h2>
          <p className="card-subtitle">
            Suggestions, issues, and questions submitted by residents, students,
            and volunteers.
          </p>
        </div>

        {feedbackLoading && (
          <p className="text-sm text-muted">Loading feedback…</p>
        )}

        {!feedbackLoading && feedbacks.length === 0 && (
          <p className="text-sm text-muted">
            No feedback submitted yet. Encourage users to share suggestions via
            the Feedback page.
          </p>
        )}

        <div className="admin-report-list">
          {feedbacks.map((fb) => (
            <article key={fb._id} className="admin-report-item">
              <header className="admin-report-header">
                <div>
                  <h3 className="admin-report-title">
                    {fb.category === "issue"
                      ? "Issue / Problem"
                      : fb.category === "question"
                      ? "Question"
                      : fb.category === "other"
                      ? "Feedback"
                      : "Suggestion"}
                  </h3>
                  <div className="admin-report-meta">
                    <span className="admin-report-location">
                      From {fb.user?.name || "Unknown"} (
                      {fb.user?.email || "no email"})
                    </span>
                    <span>•</span>
                    <span>{new Date(fb.createdAt).toLocaleString()}</span>
                  </div>
                  {fb.relatedEvent && (
                    <div className="admin-report-barangay">
                      Related event:{" "}
                      <strong>
                        {fb.relatedEvent.title} –{" "}
                        {new Date(fb.relatedEvent.date).toLocaleDateString()}
                      </strong>
                    </div>
                  )}
                </div>

                <div className="admin-report-summary">
                  <span className={statusBadgeClass(fb.status)}>
                    {fb.status === "in_review"
                      ? "In review"
                      : fb.status === "resolved"
                      ? "Resolved"
                      : "New"}
                  </span>
                  <div className="admin-report-actions">
                    {fb.status !== "new" && (
                      <button
                        className="btn btn-small"
                        onClick={() => handleFeedbackStatus(fb._id, "new")}
                      >
                        Mark new
                      </button>
                    )}
                    {fb.status !== "in_review" && (
                      <button
                        className="btn btn-small"
                        onClick={() =>
                          handleFeedbackStatus(fb._id, "in_review")
                        }
                      >
                        In review
                      </button>
                    )}
                    {fb.status !== "resolved" && (
                      <button
                        className="btn btn-primary btn-small"
                        onClick={() =>
                          handleFeedbackStatus(fb._id, "resolved")
                        }
                      >
                        Resolve
                      </button>
                    )}
                  </div>
                </div>
              </header>

              <p className="admin-report-notes">“{fb.message}”</p>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminReports;
