import { NavLink } from "react-router-dom";
import logoImage from "../assets/supun-logo.png";

const navItems = [
  { to: "/", label: "Dashboard" },
  { to: "/add-sale", label: "Add Sale" },
  { to: "/customers", label: "Customers" },
  { to: "/ac-units", label: "AC Units" },
  { to: "/add-installation", label: "Add Installation" },
  { to: "/installations", label: "Installations" },
  { to: "/add-service", label: "Add Service" },
  { to: "/services", label: "Services" },
  { to: "/payments", label: "Payments" },
  { to: "/complaints", label: "Complaints" },
];

function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="logo-box">
        <img src={logoImage} alt="Supun Group of Companies" className="sidebar-logo" />
        
      </div>

      <nav>
        {navItems.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.to === "/"}>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

export default Sidebar;