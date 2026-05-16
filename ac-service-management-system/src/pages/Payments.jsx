import { useEffect, useState } from "react";
import { getAllData } from "../api/googleSheetApi";

function Payments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadPayments();
  }, []);

  async function loadPayments() {
    try {
      setLoading(true);
      setError("");

      const data = await getAllData("payments");
      console.log("Payments Data:", data);

      setPayments(data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <p>Loading payments...</p>;
  }

  if (error) {
    return <p className="error-text">Error: {error}</p>;
  }

  return (
    <div>
      <div className="page-header">
        <h2>Payments</h2>
        <p>Manage annual service, repair, and installation payments.</p>
      </div>

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Payment ID</th>
              <th>Customer ID</th>
              <th>AC ID</th>
              <th>Payment Year</th>
              <th>Payment Date</th>
              <th>Amount</th>
              <th>Payment Type</th>
              <th>Status</th>
              <th>Due Date</th>
              <th>Notes</th>
            </tr>
          </thead>

          <tbody>
            {payments.map((payment, index) => (
              <tr key={payment.Payment_ID || index}>
                <td>{payment.Payment_ID || "-"}</td>
                <td>{payment.Customer_ID || "-"}</td>
                <td>{payment.AC_ID || "-"}</td>
                <td>{payment.Payment_Year || "-"}</td>
                <td>{formatDate(payment.Payment_Date)}</td>
                <td>{formatPrice(payment.Amount)}</td>
                <td>
                  <span
                    className={`status-badge ${getPaymentTypeClass(
                      payment.Payment_Type
                    )}`}
                  >
                    {payment.Payment_Type || "-"}
                  </span>
                </td>
                <td>
                  <span
                    className={`status-badge ${getPaymentStatusClass(
                      payment.Payment_Status
                    )}`}
                  >
                    {payment.Payment_Status || "-"}
                  </span>
                </td>
                <td>{formatDate(payment.Due_Date)}</td>
                <td>{payment.Notes || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {payments.length === 0 && <p>No payment records found.</p>}
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

function getPaymentStatusClass(status) {
  if (!status) return "";

  const value = String(status).toLowerCase();

  if (value === "paid") return "status-active";
  if (value === "pending") return "status-expired";

  return "";
}

function getPaymentTypeClass(type) {
  if (!type) return "";

  const value = String(type).toLowerCase();

  if (value === "annual service") return "status-info";
  if (value === "repair") return "status-expired";
  if (value === "installation") return "status-active";

  return "";
}

export default Payments;