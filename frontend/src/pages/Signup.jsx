// frontend/src/pages/Signup.jsx
import { useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";

const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const Signup = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "student", // default role
  });
  const [error, setError] = useState("");

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await axios.post(`${API}/api/auth/register`, form);
      login(res.data);
      navigate("/dashboard");
    } catch (err) {
      const message =
        err.response?.data?.message || "Signup failed. Please try again.";
      setError(message);
    }
  };

  return (
    <div className="auth-wrapper mt-10">
      <div className="card auth-card">
        <h2 className="text-2xl font-bold mb-4 text-center text-green-700">
          Sign Up
        </h2>

        {error && <div className="alert alert-danger mb-3">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="block mb-1 text-sm">Name</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Full name"
              required
            />
          </div>

          <div className="mb-3">
            <label className="block mb-1 text-sm">Email</label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="mb-3">
            <label className="block mb-1 text-sm">Password</label>
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Create a password"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block mb-1 text-sm">Role</label>
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              required
            >
              <option value="student">Student</option>
              <option value="volunteer">Volunteer</option>
              <option value="leader">Community Leader</option>
            </select>
          </div>

          <button type="submit" className="btn btn-primary w-full">
            Create account
          </button>

          <p className="mt-3 text-xs text-center text-muted">
            Already have an account?{" "}
            <Link to="/login" className="link">
              Login
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Signup;
