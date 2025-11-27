// frontend/src/pages/AdminDashboard.jsx
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const AdminDashboard = () => {
  const { user } = useAuth();
  const token = user?.token;

  const [reports, setReports] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;

    const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

    const fetchAll = async () => {
      try {
        const [repRes, evtRes] = await Promise.all([
          axios.get(`${API}/api/reports/admin`, authHeaders),
          axios.get(`${API}/api/events`, authHeaders),
        ]);
        setReports(repRes.data || []);
        setEvents(evtRes.data || []);
      } catch (err) {
        console.error("Failed to load admin analytics:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [token]);

  // ---- aggregate stats for analytics ----
  const analytics = useMemo(() => {
    if (!reports.length) {
      return {
        totalWaste: 0,
        totalReports: 0,
        avgWaste: 0,
        eventsWithReports: 0,
        wasteByType: {
          plastic: 0,
          paper: 0,
          metal: 0,
          glass: 0,
          other: 0,
        },
        barangayRows: [],
      };
    }

    let totalWaste = 0;
    let eventsWithReportsSet = new Set();

    const wasteByType = {
      plastic: 0,
      paper: 0,
      metal: 0,
      glass: 0,
      other: 0,
    };

    const barangayMap = new Map();

    for (const rep of reports) {
      const w = Number(rep.wasteVolumeKg || 0);
      const plastic = Number(rep.plasticKg || 0);
      const paper = Number(rep.paperKg || 0);
      const metal = Number(rep.metalKg || 0);
      const glass = Number(rep.glassKg || 0);
      const other = Number(rep.otherKg || 0);

      totalWaste += w;
      wasteByType.plastic += plastic;
      wasteByType.paper += paper;
      wasteByType.metal += metal;
      wasteByType.glass += glass;
      wasteByType.other += other;

      if (rep.event?._id) {
        eventsWithReportsSet.add(rep.event._id);
      }

      const barangayKey =
        rep.assignedBarangay ||
        rep.locationCovered ||
        rep.event?.location ||
        "Unassigned / Other";

      if (!barangayMap.has(barangayKey)) {
        barangayMap.set(barangayKey, {
          barangay: barangayKey,
          totalWaste: 0,
          reportCount: 0,
        });
      }

      const row = barangayMap.get(barangayKey);
      row.totalWaste += w;
      row.reportCount += 1;
    }

    const totalReports = reports.length;
    const avgWaste = totalReports ? totalWaste / totalReports : 0;

    const barangayRows = Array.from(barangayMap.values())
      .sort((a, b) => b.totalWaste - a.totalWaste)
      .slice(0, 6); // top 6

    return {
      totalWaste,
      totalReports,
      avgWaste,
      eventsWithReports: eventsWithReportsSet.size,
      wasteByType,
      barangayRows,
    };
  }, [reports]);

  const {
    totalWaste,
    totalReports,
    avgWaste,
    eventsWithReports,
    wasteByType,
    barangayRows,
  } = analytics;

  const typeTotal =
    wasteByType.plastic +
    wasteByType.paper +
    wasteByType.metal +
    wasteByType.glass +
    wasteByType.other || 1; // avoid division by 0

  const formatKg = (n) => n.toFixed(1) + " kg";

  return (
    <div className="page-container">
      <header className="mb-4">
        <h1 className="page-title">Admin Analytics – City Overview</h1>
        <p className="page-subtitle">
          High-level view of all clean-up reports across Las Piñas. Use this
          page to understand waste volumes, hotspots, and participation trends.
        </p>
      </header>

      {loading ? (
        <p className="text-sm text-muted">Loading analytics…</p>
      ) : (
        <>
          {/* KPI cards */}
          <div className="kpi-grid mb-4">
            <div className="card kpi-card">
              <p className="kpi-label">Total waste recorded</p>
              <p className="kpi-value">{formatKg(totalWaste)}</p>
              <p className="kpi-caption">
                Across all submitted reports city-wide.
              </p>
            </div>

            <div className="card kpi-card">
              <p className="kpi-label">Total reports</p>
              <p className="kpi-value">{totalReports}</p>
              <p className="kpi-caption">
                Cleanup summaries from barangays, schools, and volunteers.
              </p>
            </div>

            <div className="card kpi-card">
              <p className="kpi-label">Events with reports</p>
              <p className="kpi-value">
                {eventsWithReports} / {events.length}
              </p>
              <p className="kpi-caption">
                Helps spot events where data is still missing.
              </p>
            </div>

            <div className="card kpi-card">
              <p className="kpi-label">Average waste per report</p>
              <p className="kpi-value">{formatKg(avgWaste || 0)}</p>
              <p className="kpi-caption">
                Typical volume handled in a single clean-up.
              </p>
            </div>
          </div>

          {/* Waste by type + explanation */}
          <div className="dashboard-grid mb-4">
            <div className="card">
              <div className="card-header">
                <h2>Waste by Type (City-wide)</h2>
                <p className="card-subtitle">
                  Total kilograms recorded for each waste type across all
                  reports.
                </p>
              </div>

              <div className="waste-type-list">
                {[
                  ["Plastic", wasteByType.plastic],
                  ["Paper", wasteByType.paper],
                  ["Metal", wasteByType.metal],
                  ["Glass", wasteByType.glass],
                  ["Other", wasteByType.other],
                ].map(([label, value]) => {
                  const pct = (value / typeTotal) * 100;
                  return (
                    <div key={label} className="waste-type-row">
                      <div className="waste-type-label">
                        {label} ({pct.toFixed(0)}%)
                      </div>
                      <div className="waste-type-bar-outer">
                        <div
                          className="waste-type-bar-inner"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="waste-type-value">
                        {value.toFixed(1)} kg
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h2>How to use this data</h2>
              </div>
              <div className="card-body">
                <ul className="bullet-list">
                  <li>
                    <strong>Target hotspots.</strong> Focus drives on barangays
                    with the highest total waste.
                  </li>
                  <li>
                    <strong>Plan segregation.</strong> Use waste type
                    percentages to prepare the right number of sacks for
                    plastic, recyclables, and residuals.
                  </li>
                  <li>
                    <strong>Follow up on events.</strong> Events without
                    reports may need reminders from coordinators.
                  </li>
                  <li>
                    <strong>Share progress.</strong> Use these numbers in
                    presentations and reports to LGUs and schools.
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Barangay table */}
          <div className="card">
            <div className="card-header">
              <h2>Top Barangays / Locations by Waste Collected</h2>
              <p className="card-subtitle">
                Based on total kilograms recorded in submitted reports.
              </p>
            </div>

            {barangayRows.length === 0 ? (
              <p className="text-sm text-muted">
                No barangay data yet. Once reports are submitted, a breakdown
                will appear here.
              </p>
            ) : (
              <div className="table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Barangay / Area</th>
                      <th className="text-right">Total waste (kg)</th>
                      <th className="text-right">Reports</th>
                      <th className="text-right">Avg per report (kg)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {barangayRows.map((row) => {
                      const avg = row.reportCount
                        ? row.totalWaste / row.reportCount
                        : 0;
                      return (
                        <tr key={row.barangay}>
                          <td>{row.barangay}</td>
                          <td className="text-right">
                            {row.totalWaste.toFixed(1)}
                          </td>
                          <td className="text-right">{row.reportCount}</td>
                          <td className="text-right">{avg.toFixed(1)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;
