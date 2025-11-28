// frontend/src/pages/Feedback.jsx
import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const Feedback = () => {
  const { user } = useAuth();
  const token = user?.token;
  const isOfficial = user?.role === "admin" || user?.role === "leader";

  const [events, setEvents] = useState([]);
  const [feedbackList, setFeedbackList] = useState([]);
  const [selected, setSelected] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [savingReply, setSavingReply] = useState(false);

  // form state (values match schema enum)
  const [form, setForm] = useState({
    category: "suggestion",
    eventId: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Load events + feedback
  useEffect(() => {
    if (!token) return;

    const headers = { Authorization: `Bearer ${token}` };

    axios
      .get(`${API}/api/events`, { headers })
      .then((res) => setEvents(res.data))
      .catch((err) => console.error("Events load error:", err));

    axios
      .get(`${API}/api/feedback`, { headers })
      .then((res) => setFeedbackList(res.data))
      .catch((err) => console.error("Feedback load error:", err));
  }, [token]);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  // USER: submit feedback
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.message.trim()) {
      setError("Please enter your feedback.");
      return;
    }

    setSubmitting(true);
    try {
      await axios.post(
        `${API}/api/feedback`,
        {
          category: form.category, // matches enum
          relatedEvent: form.eventId || null, // backend expects relatedEvent
          message: form.message,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // reset form
      setForm({ category: "suggestion", eventId: "", message: "" });

      // reload list so user sees their new feedback
      const res = await axios.get(`${API}/api/feedback`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFeedbackList(res.data);
    } catch (err) {
      console.error("Feedback submit error:", err);
      const msg =
        err.response?.data?.message ||
        "Failed to send feedback. Please try again.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // ADMIN: open a feedback item
  const openFeedback = (fb) => {
    setSelected(fb);
    setReplyText(fb.adminReply || "");
  };

  // ADMIN: save reply
  const handleSaveReply = async () => {
    if (!selected) return;
    setSavingReply(true);
    try {
      await axios.patch(
        `${API}/api/feedback/${selected._id}/reply`,
        { adminReply: replyText },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // refresh list & selected item
      const res = await axios.get(`${API}/api/feedback`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFeedbackList(res.data);
      const updated = res.data.find((f) => f._id === selected._id);
      setSelected(updated || null);
    } catch (err) {
      console.error("Save reply error:", err);
      alert("Failed to save reply.");
    } finally {
      setSavingReply(false);
    }
  };

  /* ===========================
     OFFICIAL VIEW (admin/leader)
     =========================== */
  if (isOfficial) {
    return (
      <div className="page-container">
        <header className="mb-4">
          <h1 className="page-title">Community Feedback</h1>
          <p className="page-subtitle">
            Review feedback submitted by residents, students, and volunteers,
            and respond to them directly.
          </p>
        </header>

        <div className="admin-feedback-layout">
          {/* Left: Inbox list */}
          <div className="card">
            <div className="card-header">
              <h2>Feedback Inbox</h2>
              <p className="card-subtitle">
                Click an item to view full details and send a response.
              </p>
            </div>

            <div className="scroll-box feedback-list">
              {feedbackList.length === 0 && (
                <p className="text-sm text-muted">
                  No feedback has been submitted yet.
                </p>
              )}

              {feedbackList.map((fb) => (
                <div
                  key={fb._id}
                  className={
                    "feedback-item" +
                    (selected && selected._id === fb._id
                      ? " feedback-item-active"
                      : "")
                  }
                  onClick={() => openFeedback(fb)}
                >
                  <div className="feedback-item-header">
                    <span className="feedback-category pill pill-soft">
                      {fb.category}
                    </span>
                    <span className="feedback-status">
                      {fb.adminReply ? "Replied" : "Pending"}
                    </span>
                  </div>
                  <p className="feedback-item-title">
                    {fb.relatedEvent?.title || "General feedback"}
                  </p>
                  <p className="feedback-item-meta">
                    From {fb.user?.name || "Unknown"} ·{" "}
                    {new Date(fb.createdAt).toLocaleString()}
                  </p>
                  <p className="feedback-item-preview">
                    {fb.message?.slice(0, 80)}
                    {fb.message && fb.message.length > 80 ? "…" : ""}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Detail + reply box */}
          {selected && (
            <div className="card admin-feedback-detail">
              <div className="card-header">
                <h2>Feedback Details</h2>
              </div>

              <p className="text-sm text-muted mb-2">
                From <strong>{selected.user?.name || "Unknown user"}</strong>{" "}
                {selected.user?.email && <>({selected.user.email})</>} ·{" "}
                {new Date(selected.createdAt).toLocaleString()}
              </p>
              <p className="text-sm mb-2">
                Category: <strong>{selected.category}</strong>
              </p>
              {selected.relatedEvent && (
                <p className="text-sm mb-2">
                  Related event:{" "}
                  <strong>{selected.relatedEvent.title}</strong>{" "}
                  {selected.relatedEvent.location &&
                    `(${selected.relatedEvent.location})`}
                </p>
              )}

              <div className="feedback-message-box">
                <p className="feedback-message-label">User feedback</p>
                <p className="feedback-message-body">{selected.message}</p>
              </div>

              <div className="mt-3">
                <label className="block mb-1 text-sm">
                  Your response (visible to the user)
                </label>
                <textarea
                  rows={4}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type your reply or guidance for this user…"
                />
              </div>

              <button
                className="btn btn-primary mt-3"
                onClick={handleSaveReply}
                disabled={savingReply}
              >
                {savingReply ? "Saving reply…" : "Save reply"}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ====================
     REGULAR USER VIEW
     ==================== */
  return (
    <div className="page-container">
      <header className="mb-4">
        <h1 className="page-title">Share Feedback</h1>
        <p className="page-subtitle">
          Help barangay officials and coordinators improve future clean-up
          drives. You can report issues, give suggestions, or ask questions.
        </p>
      </header>

      {/* Feedback form */}
      <div className="card">
        <div className="card-header">
          <h2>Feedback Form</h2>
          <p className="card-subtitle">
            Your name ({user?.name}) will be visible to authorized officials
            only.
          </p>
        </div>

        {error && <div className="alert alert-danger mb-3">{error}</div>}

        <form onSubmit={handleSubmit} className="feedback-form">
          <div className="mb-3">
            <label className="block mb-1 text-sm">Category</label>
            <select
              name="category"
              value={form.category}
              onChange={handleChange}
            >
              <option value="suggestion">Suggestion</option>
              <option value="issue">Issue / Problem</option>
              <option value="question">Question</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="mb-3">
            <label className="block mb-1 text-sm">
              Related event (optional)
            </label>
            <select
              name="eventId"
              value={form.eventId}
              onChange={handleChange}
            >
              <option value="">No specific event</option>
              {events.map((evt) => (
                <option key={evt._id} value={evt._id}>
                  {evt.title} – {new Date(evt.date).toLocaleDateString()}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="block mb-1 text-sm">Your feedback</label>
            <textarea
              name="message"
              rows={4}
              placeholder="Describe your suggestion, issue, or question…"
              value={form.message}
              onChange={handleChange}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary w-full"
            disabled={submitting}
          >
            {submitting ? "Sending…" : "Submit Feedback"}
          </button>
        </form>
      </div>

      {/* User's own feedback + replies */}
      <div className="card mt-4">
        <div className="card-header">
          <h2>Your previous feedback</h2>
          <p className="card-subtitle">
            You can see the status of feedback you’ve sent and any replies from
            officials.
          </p>
        </div>

        <div className="scroll-box feedback-list">
          {feedbackList.length === 0 && (
            <p className="text-sm text-muted">
              You haven&apos;t submitted any feedback yet.
            </p>
          )}

          {feedbackList.map((fb) => (
            <div key={fb._id} className="feedback-item">
              <div className="feedback-item-header">
                <span className="feedback-category pill pill-soft">
                  {fb.category}
                </span>
                <span className="feedback-status">
                  {fb.adminReply ? "Replied" : "Pending"}
                </span>
              </div>
              <p className="feedback-item-title">
                {fb.relatedEvent?.title || "General feedback"}
              </p>
              <p className="feedback-item-meta">
                {new Date(fb.createdAt).toLocaleString()}
              </p>
              <p className="feedback-item-preview">{fb.message}</p>

              {fb.adminReply && (
                <div className="feedback-reply-box">
                  <p className="feedback-reply-label">Reply from officials</p>
                  <p className="feedback-reply-text">{fb.adminReply}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Feedback;
