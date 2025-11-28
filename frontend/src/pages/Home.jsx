// frontend/src/pages/Home.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const Home = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // 🔓 Public endpoint – no token needed
        const res = await axios.get(`${API}/api/stats/public`);
        setStats(res.data);
      } catch (err) {
        console.error("Home stats error:", err);
        setStats(null); // fallback
      }
    };

    fetchStats();
  }, []); // no dependency on user

  const totalWaste = stats?.totalWasteKg ?? 0;
  const totalReports = stats?.totalReports ?? 0;
  const eventsReported = stats?.eventsReported ?? 0;

  return (
    <div className="page-container">
      <section className="hero lp-hero">
        <div className="lp-hero-top">
          <span className="lp-city-pill">
            <span className="dot" />
            Las Piñas City • Community Clean-Up Platform
          </span>
          <span className="lp-location-tag">Philippines</span>
        </div>

        <div className="hero-grid">
          {/* LEFT — MAIN TEXT */}
          <div className="hero-copy">
            <h1 className="hero-title">
              <span className="lp-title-line">Bantay Kalinisan</span>
              <span className="lp-title-sub">Las Piñas Clean-Up Tracker</span>
            </h1>

            <p className="hero-subtitle">
              A digital hub for Las Piñas residents, barangays, schools, and
              volunteers to coordinate clean-up drives, monitor collected waste,
              and protect our rivers, streets, and coastal areas.
            </p>

            <ul className="hero-list">
              <li>
                <strong>Mobilize the community</strong> — organize barangay
                clean-ups, school drives, and riverside campaigns.
              </li>
              <li>
                <strong>Track &amp; manage waste</strong> — log volume, waste
                types, and locations cleaned.
              </li>
              <li>
                <strong>Showcase city impact</strong> — share dashboards and
                reports with LGU, schools, and residents.
              </li>
            </ul>

            <div className="hero-actions">
              {user ? (
                <>
                  <Link to="/dashboard" className="btn btn-primary">
                    Go to Dashboard
                  </Link>
                  <Link to="/events" className="btn btn-secondary">
                    View Clean-Up Events
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/signup" className="btn btn-primary">
                    Join as Volunteer
                  </Link>
                  <Link to="/login" className="btn btn-secondary">
                    Barangay / School Login
                  </Link>
                </>
              )}
            </div>

            <p className="lp-footnote">
              Built for Las Piñas City — ideal for NSTP, barangay initiatives,
              youth orgs, and city-wide environmental programs.
            </p>
          </div>

          {/* RIGHT — LIVE SNAPSHOT */}
          <div className="hero-side">
            <div className="hero-card lp-hero-card">
              <div className="hero-card-header">
                <p className="hero-card-title">Today’s Las Piñas Snapshot</p>
                <span className="pill pill-green">Live city view</span>
              </div>

              <div className="kpi-row">
                <div className="kpi">
                  <span className="kpi-label">Waste Collected</span>
                  <span className="kpi-value">
                    {Number(totalWaste).toFixed(1)} kg
                  </span>
                  <span className="lp-kpi-caption">Across all barangays</span>
                </div>

                <div className="kpi">
                  <span className="kpi-label">Active Events</span>
                  <span className="kpi-value">{eventsReported}</span>
                  <span className="lp-kpi-caption">Today’s drives</span>
                </div>

                <div className="kpi">
                  <span className="kpi-label">Total Reports</span>
                  <span className="kpi-value">{totalReports}</span>
                  <span className="lp-kpi-caption">Submitted city-wide</span>
                </div>
              </div>

              <div className="hero-card-footer">
                <p className="hero-card-note">
                  As reports come in, this card highlights how Las Piñas is
                  keeping communities, esteros, and coastal zones clean.
                </p>

                <div className="tag-row">
                  <span className="pill pill-soft">Barangay clean-ups</span>
                  <span className="pill pill-soft">School drives</span>
                  <span className="pill pill-soft">Coastal actions</span>
                </div>
              </div>
            </div>

            <div className="lp-city-strip">
              <div className="lp-strip-dot" />
              <span className="lp-strip-text">
                Let’s keep Las Piñas{" "}
                <strong>clean, green, and disaster-ready.</strong>
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
