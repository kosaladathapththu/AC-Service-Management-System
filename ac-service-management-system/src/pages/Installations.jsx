import { useEffect, useState } from "react";
import { getAllData } from "../api/googleSheetApi";

function Installations() {
  const [installations, setInstallations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadInstallations();
  }, []);

  async function loadInstallations() {
    try {
      setLoading(true);
      setError("");

      const data = await getAllData("installations");
      console.log("Installations Data:", data);

      setInstallations(data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <p>Loading installations...</p>;
  }

  if (error) {
    return <p className="error-text">Error: {error}</p>;
  }

  return (
    <div>
      <div className="page-header">
        <h2>Installations</h2>
        <p>Manage AC installation records.</p>
      </div>

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Installation ID</th>
              <th>Customer ID</th>
              <th>AC ID</th>
              <th>Installation Date</th>
              <th>Installation Type</th>
              <th>Technician Name</th>
              <th>Outsource Payment</th>
              <th>Status</th>
              <th>Notes</th>
            </tr>
          </thead>

          <tbody>
            {installations.map((installation, index) => (
              <tr key={installation.Installation_ID || index}>
                <td>{installation.Installation_ID || "-"}</td>
                <td>{installation.Customer_ID || "-"}</td>
                <td>{installation.AC_ID || "-"}</td>
                <td>{formatDate(installation.Installation_Date)}</td>
                <td>
                  <span
                    className={`status-badge ${getInstallationTypeClass(
                      installation.Installation_Type
                    )}`}
                  >
                    {installation.Installation_Type || "-"}
                  </span>
                </td>
                <td>{installation.Technician_Name || "-"}</td>
                <td>{formatPrice(installation.Outsource_Payment)}</td>
                <td>
                  <span
                    className={`status-badge ${getInstallationStatusClass(
                      installation.Installation_Status
                    )}`}
                  >
                    {installation.Installation_Status || "-"}
                  </span>
                </td>
                <td>{installation.Notes || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {installations.length === 0 && <p>No installation records found.</p>}
      </div>
    </div>
  );
}

function formatDate(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleDateString("en-GB");
}

function formatPrice(value) {
  if (!value) {
    return "-";
  }

  const numberValue = Number(value);

  if (Number.isNaN(numberValue)) {
    return String(value);
  }

  return `Rs. ${numberValue.toLocaleString("en-LK")}`;
}

function getInstallationStatusClass(status) {
  if (!status) return "";

  const value = String(status).toLowerCase();

  if (value === "completed") return "status-active";
  if (value === "pending") return "status-expired";
  if (value === "cancelled") return "status-cancelled";

  return "";
}

function getInstallationTypeClass(type) {
  if (!type) return "";

  const value = String(type).toLowerCase();

  if (value === "in-house") return "status-active";
  if (value === "outsourced") return "status-expired";

  return "";
}

export default Installations;