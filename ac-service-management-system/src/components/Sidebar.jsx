import { NavLink } from "react-router-dom";
import logoImage from "../assets/supun-logo.png";

const navGroups = [
  {
    label: "Overview",
    items: [
      { to: "/", label: "Dashboard", icon: "ti-layout-dashboard", badge: null },
    ],
  },
  {
    label: "Sales & Customers",
    items: [
      { to: "/add-sale", label: "New Sale", icon: "ti-plus", badge: null },
      { to: "/customers", label: "Customers", icon: "ti-users", badge: null },
    ],
  },
  {
    label: "Units & Installations",
    items: [
      { to: "/ac-units", label: "AC Units", icon: "ti-air-conditioning", badge: null },
      { to: "/add-installation", label: "New Installation", icon: "ti-tool", badge: null },
      { to: "/installations", label: "Installations", icon: "ti-clipboard-list", badge: null },
    ],
  },
  {
    label: "Service",
    items: [
      { to: "/add-service", label: "Create Service", icon: "ti-settings", badge: null },
      { to: "/services", label: "Services", icon: "ti-list-check", badge: null },
    ],
  },
  {
    label: "Payments",
    items: [
      { to: "/add-payment", label: "New Payment", icon: "ti-credit-card", badge: null },
      { to: "/payments", label: "Payments", icon: "ti-report-money", badge: null },
    ],
  },
  {
    label: "Support",
    items: [
      { to: "/add-complaint", label: "New Complaint", icon: "ti-message-report", badge: null },
      { to: "/complaints", label: "Complaints", icon: "ti-messages", badge: null },
    ],
  },
];

function Sidebar({ open = false, onClose }) {
  return (
    <aside className={`sidebar${open ? " sidebar-open" : ""}`}>
      {/* Logo */}
      <div className="logo-box">
        <NavLink to="/" className="sidebar-logo-link" aria-label="Go to dashboard" onClick={onClose}>
          <img src={logoImage} alt="Supun Group of Companies" className="sidebar-logo" />
        </NavLink>
      </div>

      {/* Navigation */}
      <nav>
        {navGroups.map((group) => (
          <div key={group.label} className="nav-group">
            <div className="nav-group-label">{group.label}</div>
            {group.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) =>
                  isActive ? "nav-item active" : "nav-item"
                }
                onClick={onClose}
              >
                <i className={`ti ${item.icon}`}></i>
                <span>{item.label}</span>
                {item.badge && (
                  <span className="nav-badge">{item.badge}</span>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar">A</div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">Administrator</div>
            <div className="sidebar-user-role">System Admin</div>
          </div>
          <i className="ti ti-dots-vertical sidebar-dots"></i>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;

