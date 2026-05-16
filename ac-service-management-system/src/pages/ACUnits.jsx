import { useEffect, useState } from "react";
import { getAllData } from "../api/googleSheetApi";

function ACUnits() {
  const [acUnits, setAcUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadACUnits();
  }, []);

  async function loadACUnits() {
    try {
      setLoading(true);
      setError("");

      const data = await getAllData("acUnits");
      console.log("AC Units Data:", data);

      setAcUnits(data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  function formatDate(value) {
    if (!value) return "-";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return String(value);
    }

    return date.toLocaleDateString("en-GB");
  }

  function formatPrice(value) {
    if (!value) return "-";

    return `Rs. ${Number(value).toLocaleString("en-LK")}`;
  }

  if (loading) {
    return <p>Loading AC units...</p>;
  }

  if (error) {
    return <p className="error-text">Error: {error}</p>;
  }

  return (
    <div>
      <div className="page-header">
        <h2>AC Units</h2>
        <p>Manage all sold AC units and warranty details.</p>
      </div>

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>AC ID</th>
              <th>Customer ID</th>
              <th>AC Model</th>
              <th>Serial Number</th>
              <th>Quantity</th>
              <th>Price</th>
              <th>Purchase Date</th>
              <th>Sales Channel</th>
              <th>Warranty Start</th>
              <th>Warranty End</th>
              <th>Warranty Status</th>
            </tr>
          </thead>

          <tbody>
            {acUnits.map((unit, index) => (
              <tr key={unit.AC_ID || index}>
                <td>{unit.AC_ID || "-"}</td>
                <td>{unit.Customer_ID || "-"}</td>
                <td>{unit.AC_Model || "-"}</td>
                <td>{unit.Serial_Number || "-"}</td>
                <td>{unit.Quantity || "-"}</td>
                <td>{formatPrice(unit.Price)}</td>
                <td>{formatDate(unit.Purchase_Date)}</td>
                <td>{unit.Sales_Channel || "-"}</td>
                <td>{formatDate(unit.Warranty_Start_Date)}</td>
                <td>{formatDate(unit.Warranty_End_Date)}</td>
                <td>
                  <span className={`status-badge ${getStatusClass(unit.Warranty_Status)}`}>
                    {unit.Warranty_Status || "-"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {acUnits.length === 0 && <p>No AC units found.</p>}
      </div>
    </div>
  );
}

function getStatusClass(status) {
  if (!status) return "";

  const value = String(status).toLowerCase();

  if (value === "active") return "status-active";
  if (value === "cancelled") return "status-cancelled";
  if (value === "expired") return "status-expired";

  return "";
}

export default ACUnits;