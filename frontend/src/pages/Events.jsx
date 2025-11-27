// frontend/src/pages/Events.jsx
import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import emailjs from "emailjs-com";

const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

// EmailJS env vars
const EMAIL_SERVICE = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const EMAIL_TEMPLATE = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const EMAIL_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

const Events = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [form, setForm] = useState({
    title: "",
    description: "",
    location: "",
    date: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  const token = user?.token;

  const fetchEvents = async () => {
    try {
      const res = await axios.get(`${API}/api/events`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // 🔹 Auto-remove past events (only show today and future)
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const upcoming = res.data.filter((evt) => {
        const d = new Date(evt.date);
        d.setHours(0, 0, 0, 0);
        return d >= today;
      });

      setEvents(upcoming);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (token) fetchEvents();
    // eslint-disable-next-line
  }, [token]);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await axios.post(`${API}/api/events`, form, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setForm({ title: "", description: "", location: "", date: "" });
      setShowCreate(false);
      setSuccess("Event created and added to the community feed.");
      fetchEvents();
    } catch (err) {
      const message =
        err.response?.data?.message || "Failed to create event.";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  // 🔹 Send confirmation/reminder email via EmailJS
  const sendJoinEmail = async (evt) => {
    try {
      if (!EMAIL_SERVICE || !EMAIL_TEMPLATE || !EMAIL_PUBLIC_KEY) {
        console.warn("EmailJS env vars missing – skipping email send.");
        return;
      }
      if (!user?.email) return;

      const eventDate = new Date(evt.date).toLocaleDateString();

      const templateParams = {
        to_name: user.name,
        to_email: user.email,
        event_title: evt.title,
        event_date: eventDate,
        event_location: evt.location,
      };

      await emailjs.send(
        EMAIL_SERVICE,
        EMAIL_TEMPLATE,
        templateParams,
        EMAIL_PUBLIC_KEY
      );
      console.log("Join confirmation email sent.");
    } catch (err) {
      console.error("EmailJS error:", err);
    }
  };

  const handleJoin = async (evt) => {
    setError("");
    setSuccess("");

    try {
      await axios.post(
        `${API}/api/events/${evt._id}/join`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // send confirmation / reminder email
      await sendJoinEmail(evt);

      setSuccess(
        `You joined "${evt.title}". A confirmation/reminder has been sent to ${user.email}.`
      );
      fetchEvents();
    } catch (err) {
      console.error(err);
      const message =
        err.response?.data?.message || "Failed to join event.";
      setError(message);
    }
  };

  const isJoined = (event) =>
    event.participants?.some(
      (p) => String(p._id || p) === String(user._id)
    );

  return (
    <div className="page-container">
      <header className="mb-4">
        <h1 className="page-title">Community Clean-Up Events</h1>
        <p className="page-subtitle">
          Plan upcoming drives, invite participants, and keep track of where
          clean-ups are happening across the community.
        </p>
      </header>

      <div className="events-page-inner">
        {/* Toggle button */}
        <div className="create-toggle-row">
          <button
            type="button"
            className="btn btn-primary btn-small"
            onClick={() => setShowCreate((s) => !s)}
          >
            {showCreate ? "Hide create form" : "Create new event"}
          </button>
        </div>

        {/* Global messages */}
        {error && <div className="alert alert-danger mb-3">{error}</div>}
        {success && <div className="alert alert-success mb-3">{success}</div>}

        {/* Create event card – only shown when toggled */}
        {showCreate && (
          <div className="card mb-4">
            <div className="card-header">
              <h2>Create New Event</h2>
              <p className="card-subtitle">
                Post a new clean-up so residents, students, and volunteers can
                join.
              </p>
            </div>

            <form onSubmit={handleCreate} className="event-form">
              <div className="form-grid mb-3">
                <div>
                  <label className="block mb-1 text-sm">Title</label>
                  <input
                    name="title"
                    placeholder="e.g. Riverbank Clean-Up"
                    value={form.title}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm">Location</label>
                  <input
                    name="location"
                    placeholder="e.g. Villar Sipag"
                    value={form.location}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="mb-3">
                <label className="block mb-1 text-sm">Date</label>
                <input
                  name="date"
                  type="date"
                  value={form.date}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block mb-1 text-sm">Short description</label>
                <textarea
                  name="description"
                  rows={2}
                  placeholder="What area will you cover? Any focus (plastic, coastal, barangay streets, etc.)?"
                  value={form.description}
                  onChange={handleChange}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving}
              >
                {saving ? "Posting…" : "Create Event"}
              </button>
            </form>
          </div>
        )}

        {/* Community feed centered */}
        <div className="card">
          <div className="card-header">
            <h2>Community Events Feed</h2>
            <p className="card-subtitle">
              All upcoming clean-up events posted by barangays, schools, and
              volunteers. Any logged-in user can see and join these events.
            </p>
          </div>

          {events.length === 0 ? (
            <p className="text-sm text-muted">
              No upcoming events. Use &quot;Create new event&quot; above to
              start your community clean-up feed.
            </p>
          ) : (
            <div className="events-feed">
              {events.map((evt) => {
                const joined = isJoined(evt);
                const dateStr = new Date(evt.date).toLocaleDateString();

                return (
                  <article key={evt._id} className="event-post">
                    <header className="event-post-header">
                      <div>
                        <h3 className="event-post-title">{evt.title}</h3>
                        <div className="event-post-meta">
                          <span className="event-location-tag">
                            {evt.location}
                          </span>
                          <span className="event-dot">•</span>
                          <span className="event-date">{dateStr}</span>
                        </div>
                      </div>
                      <div className="event-right-meta">
                        <span className="event-participants">
                          {evt.participants?.length || 0}{" "}
                          {evt.participants?.length === 1
                            ? "volunteer"
                            : "volunteers"}
                        </span>
                        {joined ? (
                          <span className="pill pill-soft event-joined-pill">
                            Joined
                          </span>
                        ) : (
                          <button
                            onClick={() => handleJoin(evt)}
                            className="btn btn-primary btn-small"
                          >
                            Join Event
                          </button>
                        )}
                      </div>
                    </header>

                    {evt.description && (
                      <p className="event-post-body">{evt.description}</p>
                    )}

                    <footer className="event-post-footer">
                      <span className="event-author">
                        Posted by{" "}
                        <strong>
                          {evt.createdBy?.name || "Community member"}
                        </strong>
                      </span>
                    </footer>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Events;
