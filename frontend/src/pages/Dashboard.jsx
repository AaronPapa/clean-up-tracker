// frontend/src/pages/Dashboard.jsx
import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const token = user?.token;
  const isAdmin = user?.role === "admin";

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

  // per-user stats
  const myStats = stats?.myStats || {
    totalWasteKg: 0,
    totalReports: 0,
    byType: { plastic: 0, paper: 0, metal: 0, glass: 0, other: 0 },
  };

  const myWaste = myStats.totalWasteKg || 0;
  const myReports = myStats.totalReports || 0;
  const myAvg = myReports > 0 ? (myWaste / myReports).toFixed(1) : "0.0";
  const myShare =
    totalWaste > 0 ? ((myWaste / totalWaste) * 100).toFixed(1) : "0.0";

  // pie chart data
  const segments = [
    { label: "Plastic", value: typeTotals.plastic, color: "#16a34a" },
    { label: "Paper", value: typeTotals.paper, color: "#22c55e" },
    { label: "Metal", value: typeTotals.metal, color: "#4ade80" },
    { label: "Glass", value: typeTotals.glass, color: "#86efac" },
    { label: "Other", value: typeTotals.other, color: "#bbf7d0" },
  ].filter((s) => s.value > 0);

  let cumulative = 0;
  const gradientParts =
    segments.length > 0
      ? segments
          .map((seg) => {
            const p = percent(seg.value);
            const start = cumulative;
            const end = cumulative + p;
            cumulative = end;
            return `${seg.color} ${start}% ${end}%`;
          })
          .join(", ")
      : "#e5e7eb 0 100%";

  const pieStyle = {
    backgroundImage: `conic-gradient(${gradientParts})`,
  };

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
            {/* City-wide total */}
            <div className="card metric-card">
              <p className="metric-label">Total waste collected</p>
              <p className="metric-value">{totalWaste.toFixed(1)} kg</p>
              <p className="metric-sub">
                Recorded across all submitted community reports.
              </p>
            </div>

            {/* Your contributions – only for non-admins */}
            {!isAdmin && (
              <div className="card metric-card">
                <p className="metric-label">Your collected waste</p>
                <p className="metric-value">{myWaste.toFixed(1)} kg</p>
                <p className="metric-sub">
                  From {myReports || "no"} report
                  {myReports === 1 ? "" : "s"} you&apos;ve submitted so far.
                </p>
              </div>
            )}

            <div className="card metric-card">
              <p className="metric-label">Total reports</p>
              <p className="metric-value">{totalReports}</p>
              <p className="metric-sub">
                Cleanup summaries logged by barangays, schools, and volunteers.
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

          {/* LOWER: waste-by-type + right column */}
          <section className="dashboard-columns">
            <div className="card">
              <h2 className="section-title">Waste by Type (kg)</h2>

              {typeSum === 0 ? (
                <p className="text-sm text-muted">
                  No waste breakdown recorded yet. Submit reports with waste
                  details to see distribution here.
                </p>
              ) : (
                <>
                  {/* Pie chart block */}
                  <div className="pie-wrapper">
                    <div className="pie-chart" style={pieStyle}>
                      <div className="pie-center">
                        <span className="pie-total">
                          {totalWaste.toFixed(1)} kg
                        </span>
                        <span className="pie-label">City total</span>
                      </div>
                    </div>
                    <div className="pie-legend">
                      {segments.map((seg) => (
                        <div key={seg.label} className="pie-legend-item">
                          <span
                            className="pie-swatch"
                            style={{ backgroundColor: seg.color }}
                          />
                          <span className="pie-legend-text">
                            {seg.label} • {percent(seg.value)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Bar list */}
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
                </>
              )}
            </div>

            {/* RIGHT COLUMN */}
            {isAdmin ? (
              // ADMIN: tools & insights
              <div className="card">
                <h2 className="section-title">Admin tools & insights</h2>
                <p className="text-sm text-muted">
                  Quick facts to help you plan drives, assign barangays, and
                  monitor city-wide trends.
                </p>
                <ul className="tips-list">
                  <li>
                    Las Piñas averages <strong>6–8 kg</strong> of collected
                    waste per clean-up drive.
                  </li>
                  <li>
                    Plastic usually makes up around{" "}
                    <strong>25–35% of all recorded waste</strong> in reports.
                  </li>
                  <li>
                    Areas with frequent clean-ups can show{" "}
                    <strong>20–40% lower waste accumulation</strong> over time.
                  </li>
                  <li>
                    Assigning barangays promptly increases report completion
                    rates by up to <strong>60%</strong>.
                  </li>
                  <li>
                    Events without reports often mean{" "}
                    <strong>missing participation data</strong> or incomplete
                    submissions.
                  </li>
                  <li>
                    High-waste locations commonly include{" "}
                    <strong>main roads, schools, and dense residential areas</strong>.
                  </li>
                </ul>
              </div>
            ) : (
              // REGULAR USER: personal impact
              <div className="card">
                <h2 className="section-title">Your clean-up impact</h2>

                <div className="dashboard-grid impact-grid">
                  <div className="metric-card">
                    <p className="metric-label">Reports submitted</p>
                    <p className="metric-value">{myReports}</p>
                    <p className="metric-sub">
                      Clean-up summaries you&apos;ve contributed.
                    </p>
                  </div>

                  <div className="metric-card">
                    <p className="metric-label">Total waste you logged</p>
                    <p className="metric-value">{myWaste.toFixed(1)} kg</p>
                    <p className="metric-sub">
                      Across all reports submitted under your account.
                    </p>
                  </div>

                  <div className="metric-card">
                    <p className="metric-label">Average per report</p>
                    <p className="metric-value">{myAvg} kg</p>
                    <p className="metric-sub">
                      Typical volume you help collect each clean-up.
                    </p>
                  </div>

                  <div className="metric-card">
                    <p className="metric-label">Share of city total</p>
                    <p className="metric-value">{myShare}%</p>
                    <p className="metric-sub">
                      Your contribution compared to all logged waste.
                    </p>
                  </div>
                </div>

                <p className="text-sm text-muted">
                  Join more events and submit reports to grow your personal
                  impact and support your barangay&apos;s cleanliness efforts.
                </p>
              </div>
            )}
          </section>
        </>
      )}

      {/* ENVIRONMENTAL TIPS (same for everyone) */}
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
              Prepare separate sacks for plastic, recyclables, and residual
              waste; label them visibly.
            </li>
            <li>
              Take photos and quick notes during clean-ups to support city
              reports and school documentation.
            </li>
            <li>
              Share dashboard snapshots with residents and on social media to
              build a culture of cleanliness.
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
