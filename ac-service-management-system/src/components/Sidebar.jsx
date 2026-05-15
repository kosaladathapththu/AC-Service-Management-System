import { NavLink } from "react-router-dom";

function Sidebar() {
  return (
    <aside className="sidebar">
      <h2 className="logo">AC Service</h2>

      <nav>
        <NavLink to="/">Dashboard</NavLink>
        <NavLink to="/customers">Customers</NavLink>
        <NavLink to="/ac-units">AC Units</NavLink>
        <NavLink to="/installations">Installations</NavLink>
        <NavLink to="/services">Services</NavLink>
        <NavLink to="/payments">Payments</NavLink>
        <NavLink to="/complaints">Complaints</NavLink>
      </nav>
    </aside>
  );
}

export default Sidebar;