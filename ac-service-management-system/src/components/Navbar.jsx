import { useEffect, useState } from "react";

function Navbar() {
  const [theme, setTheme] = useState(() =>
    document.documentElement.dataset.theme === "dark" ? "dark" : "light"
  );

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    localStorage.setItem("ac-service-theme", theme);
  }, [theme]);

  const nextTheme = theme === "dark" ? "light" : "dark";

  return (
    <header className="navbar">
      <div className="navbar-title">
        <h1>Supun Group Of Companies - AC Service Management</h1>
        <p>Welcome to your dashboard</p>
      </div>

      <div className="navbar-actions">
        <button
          type="button"
          className="theme-toggle"
          onClick={() => setTheme(nextTheme)}
          aria-label={`Switch to ${nextTheme} mode`}
          title={`Switch to ${nextTheme} mode`}
        >
          <i className={`ti ${theme === "dark" ? "ti-sun" : "ti-moon"}`} aria-hidden="true" />
          <span>{theme === "dark" ? "Light" : "Dark"}</span>
        </button>

        <div className="admin-box">
          <span>Admin</span>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
