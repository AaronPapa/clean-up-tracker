// frontend/src/components/Navbar.jsx
import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Navbar = () => {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const linkClass = ({ isActive }) =>
    "nav-link" + (isActive ? " nav-link-active" : "");

  const handleLogout = () => {
    logout();
    setMobileOpen(false);
  };

  const closeMenu = () => setMobileOpen(false);

  return (
    <nav className="navbar">
      <div className="nav-inner">
        {/* Brand / Logo */}
        <Link to="/" className="nav-brand" onClick={closeMenu}>
          <span className="nav-logo-circle">C</span>
          <span className="nav-brand-text">
            Clean-Up Tracker
            <span className="nav-brand-sub">Las Piñas Community</span>
          </span>
        </Link>

        {/* Right side */}
        <div className="nav-right">
          {/* Desktop user greeting */}
          {user && (
            <span className="nav-user desktop-only">
              Hi,&nbsp;<strong>{user.name}</strong>
              {user.role === "admin" && (
                <span className="nav-role-badge nav-role-admin">Admin</span>
              )}
              {user.role === "leader" && (
                <span className="nav-role-badge nav-role-leader">
                  Barangay Leader
                </span>
              )}
            </span>
          )}

          {/* Desktop links */}
          <div className="nav-links desktop-only">
            <NavLink to="/" className={linkClass} end>
              Home
            </NavLink>

            {user && (
              <>
                <NavLink to="/dashboard" className={linkClass}>
                  Dashboard
                </NavLink>
                <NavLink to="/events" className={linkClass}>
                  Events
                </NavLink>
                <NavLink to="/reports" className={linkClass}>
                  Reports
                </NavLink>
                <NavLink to="/feedback" className={linkClass}>
                  Feedback
                </NavLink>

                {(user.role === "admin" || user.role === "leader") && (
                  <>
                    <NavLink to="/admin" className={linkClass}>
                      Admin Analytics
                    </NavLink>
                    <NavLink to="/admin-inbox" className={linkClass}>
                      Admin Inbox
                    </NavLink>
                  </>
                )}
              </>
            )}

            {!user && (
              <>
                <NavLink to="/login" className={linkClass}>
                  Login
                </NavLink>
                <NavLink to="/signup" className={linkClass}>
                  Sign Up
                </NavLink>
              </>
            )}

            {user && (
              <button
                onClick={handleLogout}
                className="btn btn-ghost btn-small logout-btn"
              >
                Logout
              </button>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="nav-toggle mobile-only"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Toggle navigation menu"
          >
            <span
              className={mobileOpen ? "nav-toggle-bar open" : "nav-toggle-bar"}
            />
          </button>
        </div>
      </div>

      {/* Mobile slide-down menu */}
      {mobileOpen && (
        <div className="mobile-menu">
          {user && (
            <div className="mobile-user">
              <span className="mobile-user-name">
                Signed in as <strong>{user.name}</strong>
              </span>
              <span className="mobile-user-role">
                {user.role === "admin"
                  ? "Admin"
                  : user.role === "leader"
                  ? "Barangay Leader"
                  : "Volunteer / Student"}
              </span>
            </div>
          )}

          <div className="mobile-links">
            <NavLink
              to="/"
              className={linkClass}
              end
              onClick={closeMenu}
            >
              Home
            </NavLink>

            {user && (
              <>
                <NavLink
                  to="/dashboard"
                  className={linkClass}
                  onClick={closeMenu}
                >
                  Dashboard
                </NavLink>
                <NavLink
                  to="/events"
                  className={linkClass}
                  onClick={closeMenu}
                >
                  Events
                </NavLink>
                <NavLink
                  to="/reports"
                  className={linkClass}
                  onClick={closeMenu}
                >
                  Reports
                </NavLink>
                <NavLink
                  to="/feedback"
                  className={linkClass}
                  onClick={closeMenu}
                >
                  Feedback
                </NavLink>

                {(user.role === "admin" || user.role === "leader") && (
                  <>
                    <NavLink
                      to="/admin"
                      className={linkClass}
                      onClick={closeMenu}
                    >
                      Admin Analytics
                    </NavLink>
                    <NavLink
                      to="/admin-inbox"
                      className={linkClass}
                      onClick={closeMenu}
                    >
                      Admin Inbox
                    </NavLink>
                  </>
                )}
              </>
            )}

            {!user && (
              <>
                <NavLink
                  to="/login"
                  className={linkClass}
                  onClick={closeMenu}
                >
                  Login
                </NavLink>
                <NavLink
                  to="/signup"
                  className={linkClass}
                  onClick={closeMenu}
                >
                  Sign Up
                </NavLink>
              </>
            )}

            {user && (
              <button onClick={handleLogout} className="btn btn-ghost btn-full">
                Logout
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
