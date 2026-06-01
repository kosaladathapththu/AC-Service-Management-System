import { NavLink } from "react-router-dom";

function Navbar() {
  return (
    <header className="navbar">
      <div className="navbar-title">
        <h1>Supun Group Of Companies - AC Service Management</h1>
        <p>Welcome to your dashboard</p>
      </div>

      <div className="navbar-actions">
        <NavLink
          to="/data-sync"
          className={({ isActive }) =>
            isActive ? "data-sync-nav active" : "data-sync-nav"
          }
          aria-label="Open data sync"
          title="Data Sync"
        >
          <i className="ti ti-refresh" aria-hidden="true"></i>
          <span>Data Sync</span>
        </NavLink>

        <div className="admin-box">
          <span>Admin</span>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
