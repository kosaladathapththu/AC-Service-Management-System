import { useEffect, useState } from "react";
import { getAllData } from "../api/googleSheetApi";

function Services() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadServices();
  }, []);

  async function loadServices() {
    try {
      setLoading(true);
      setError("");

      const data = await getAllData("services");
      console.log("Services Data:", data);

      setServices(data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <p>Loading services...</p>;
  }

  if (error) {
    return <p className="error-text">Error: {error}</p>;
  }

  return (
    <div>
      <div className="page-header">
        <h2>Services</h2>
        <p>Manage free and paid AC service schedules.</p>
      </div>

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Service ID</th>
              <th>Customer ID</th>
              <th>AC ID</th>
              <th>Service Date</th>
              <th>Service Year</th>
              <th>Service No</th>
              <th>Service Type</th>
              <th>Category</th>
              <th>Technician</th>
              <th>Status</th>
              <th>Payment Required</th>
              <th>Notes</th>
            </tr>
          </thead>

          <tbody>
            {services.map((service, index) => (
              <tr key={service.Service_ID || index}>
                <td>{service.Service_ID || "-"}</td>
                <td>{service.Customer_ID || "-"}</td>
                <td>{service.AC_ID || "-"}</td>
                <td>{formatDate(service.Service_Date)}</td>
                <td>{service.Service_Year || "-"}</td>
                <td>{service.Service_No || "-"}</td>
                <td>
                  <span
                    className={`status-badge ${getServiceTypeClass(
                      service.Service_Type
                    )}`}
                  >
                    {service.Service_Type || "-"}
                  </span>
                </td>
                <td>{service.Service_Category || "-"}</td>
                <td>{service.Technician_Name || "-"}</td>
                <td>
                  <span
                    className={`status-badge ${getServiceStatusClass(
                      service.Service_Status
                    )}`}
                  >
                    {service.Service_Status || "-"}
                  </span>
                </td>
                <td>{service.Payment_Required || "-"}</td>
                <td>{service.Notes || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {services.length === 0 && <p>No service records found.</p>}
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

function getServiceStatusClass(status) {
  if (!status) return "";

  const value = String(status).toLowerCase();

  if (value === "completed") return "status-active";
  if (value === "pending") return "status-expired";
  if (value === "rescheduled") return "status-info";
  if (value === "cancelled") return "status-cancelled";

  return "";
}

function getServiceTypeClass(type) {
  if (!type) return "";

  const value = String(type).toLowerCase();

  if (value === "free") return "status-active";
  if (value === "paid") return "status-info";

  return "";
}

export default Services;