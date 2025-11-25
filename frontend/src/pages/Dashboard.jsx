// src/pages/Dashboard.jsx
import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const token = user?.token;

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get(`${API}/api/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setStats(res.data);
      } catch (err) {
        console.error("Error loading stats:", err);
      } finally {
        setLoading(false);
      }
    };

    if (token) fetchStats();
  }, [token]);

  const totalWaste = stats?.totalWasteKg || 0;
  const totalReports = stats?.totalReports || 0;
  const eventsReported = stats?.eventsReported || 0;
  const avgWaste =
    totalReports > 0 ? (totalWaste / totalReports).toFixed(1) : "0.0";

  const typeTotals = stats?.byType || {
    plastic: 0,
    paper: 0,
    metal: 0,
    glass: 0,
    other: 0,
  };
  const typeSum =
    typeTotals.plastic +
    typeTotals.paper +
    typeTotals.metal +
    typeTotals.glass +
    typeTotals.other || 0;

  const percent = (value) =>
    typeSum > 0 ? Math.round((value / typeSum) * 100) : 0;

  return (
    <div className="page-container">
      <header className="dashboard-header">
        <div>
          <h1 className="page-title">Clean-Up Dashboard</h1>
          <p className="page-subtitle">
            Welcome back{user ? `, ${user.name}` : ""}. Track how Las Piñas
            clean-up events are performing at a glance.
          </p>
        </div>
        <div className="dashboard-badge">
          City status: <span className="badge-pill">Monitoring</span>
        </div>
      </header>

      {loading && (
        <p className="text-sm text-muted">Loading latest community data…</p>
      )}

      {stats && (
        <>
          {/* TOP METRICS ROW */}
          <section className="dashboard-grid">
            <div className="card metric-card">
              <p className="metric-label">Total waste collected</p>
              <p className="metric-value">{totalWaste.toFixed(1)} kg</p>
              <p className="metric-sub">
                Recorded across all submitted community reports.
              </p>
            </div>

            <div className="card metric-card">
              <p className="metric-label">Total reports</p>
              <p className="metric-value">{totalReports}</p>
              <p className="metric-sub">
                Cleanup summaries logged by barangays, schools, and volunteers.
              </p>
            </div>

            <div className="card metric-card">
              <p className="metric-label">Events with reports</p>
              <p className="metric-value">{eventsReported}</p>
              <p className="metric-sub">
                Events where waste data has already been submitted.
              </p>
            </div>

            <div className="card metric-card">
              <p className="metric-label">Average waste / report</p>
              <p className="metric-value">{avgWaste} kg</p>
              <p className="metric-sub">
                Helps estimate typical volume handled per clean-up drive.
              </p>
            </div>
          </section>

          {/* LOWER TWO-COLUMN LAYOUT */}
          <section className="dashboard-columns">
            {/* LEFT: WASTE BY TYPE */}
            <div className="card">
              <h2 className="section-title">Waste by Type (kg)</h2>
              {typeSum === 0 ? (
                <p className="text-sm text-muted">
                  No waste breakdown recorded yet. Submit reports with waste
                  details to see distribution here.
                </p>
              ) : (
                <div className="waste-bars">
                  {[
                    ["Plastic", typeTotals.plastic],
                    ["Paper", typeTotals.paper],
                    ["Metal", typeTotals.metal],
                    ["Glass", typeTotals.glass],
                    ["Other", typeTotals.other],
                  ].map(([label, value]) => (
                    <div key={label} className="waste-bar-row">
                      <div className="waste-bar-label">
                        <span>{label}</span>
                        <span className="waste-bar-fig">
                          {value} kg • {percent(value)}%
                        </span>
                      </div>
                      <div className="waste-bar-track">
                        <div
                          className="waste-bar-fill"
                          style={{ width: `${percent(value)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* RIGHT: SUMMARY / ACTIVITY */}
            <div className="card">
              <h2 className="section-title">Community Activity Summary</h2>
              <ul className="activity-list">
                <li>
                  <span className="activity-dot" />
                  <div>
                    <p className="activity-main">
                      {totalReports} report
                      {totalReports === 1 ? "" : "s"} submitted
                    </p>
                    <p className="activity-sub">
                      Encourage barangays and schools to log every clean-up to
                      keep this data accurate.
                    </p>
                  </div>
                </li>
                <li>
                  <span className="activity-dot" />
                  <div>
                    <p className="activity-main">
                      {eventsReported} event
                      {eventsReported === 1 ? "" : "s"} with recorded data
                    </p>
                    <p className="activity-sub">
                      Use the Events page to schedule more drives and increase
                      coverage.
                    </p>
                  </div>
                </li>
                <li>
                  <span className="activity-dot" />
                  <div>
                    <p className="activity-main">
                      Top waste type:{" "}
                      <strong>
                        {typeSum === 0
                          ? "Not enough data yet"
                          : (() => {
                              const entries = Object.entries(typeTotals);
                              const top = entries.reduce(
                                (max, cur) =>
                                  cur[1] > max[1] ? cur : max,
                                entries[0]
                              );
                              return `${top[0][0].toUpperCase()}${top[0].slice(
                                1
                              )} (${top[1]} kg)`;
                            })()}
                      </strong>
                    </p>
                    <p className="activity-sub">
                      Focus awareness campaigns on the most common waste found
                      in your city.
                    </p>
                  </div>
                </li>
              </ul>
            </div>
          </section>
        </>
      )}

      {/* ENVIRONMENTAL TIPS */}
      <section className="card tips-banner">
  <div className="tips-icon">🌿</div>
  <div className="tips-content">
    <h2 className="tips-title">Environmental Tips for Las Piñas</h2>
    <ul className="tips-list">
      <li>
        Coordinate with barangay leaders to assign clear zones for each
        clean-up group.
      </li>
      <li>
        Prepare separate sacks for plastic, recyclables, and residual waste;
        label them visibly.
      </li>
      <li>
        Take photos and quick notes during clean-ups to support city reports
        and school documentation.
      </li>
      <li>
        Share dashboard snapshots with residents and on social media to build
        a culture of cleanliness.
      </li>
    </ul>
  </div>
</section>

    </div>
  );
};

export default Dashboard;
