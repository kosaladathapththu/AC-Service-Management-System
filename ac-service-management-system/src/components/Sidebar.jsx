import { NavLink } from "react-router-dom";

const navItems = [
  { to: "/",             label: "Dashboard"     },
  { to: "/customers",    label: "Customers"     },
  { to: "/ac-units",     label: "AC Units"      },
  { to: "/installations",label: "Installations" },
  { to: "/services",     label: "Services"      },
  { to: "/payments",     label: "Payments"      },
  { to: "/complaints",   label: "Complaints"    },
];

function Sidebar() {
  return (
    <aside className="sidebar">
      <h2 className="logo">
        AC Service
        <span>Management System</span>
      </h2>

      <nav>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

export default Sidebar;