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

  // filters
  const [filterText, setFilterText] = useState("");
  const [filterBarangay, setFilterBarangay] = useState("");
  const [filterStart, setFilterStart] = useState("");
  const [filterEnd, setFilterEnd] = useState("");

  const fetchReports = async () => {
    try {
      const res = await axios.get(`${API}/api/reports/admin`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setReports(res.data);
    } catch (err) {
      console.error("Failed to load admin reports:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchReports();
  }, [token]);

  const handleMarkReviewed = async (id) => {
    try {
      await axios.patch(
        `${API}/api/reports/${id}/review`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchReports();
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
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchReports();
    } catch (err) {
      console.error("Failed to assign barangay:", err);
      alert("Failed to assign barangay.");
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
      // include entire end day
      end.setHours(23, 59, 59, 999);
      if (created > end) matchesDate = false;
    }

    return matchesText && matchesBarangay && matchesDate;
  });

  return (
    <div className="page-container">
      <header className="mb-4">
        <h1 className="page-title">Barangay Reports Inbox</h1>
        <p className="page-subtitle">
          View and manage all clean-up reports submitted by residents, students,
          and volunteers across Las Piñas. Assign reports to barangays and mark
          them as reviewed.
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

      {/* Inbox */}
      <div className="card admin-inbox">
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
  );
};

export default AdminReports;
