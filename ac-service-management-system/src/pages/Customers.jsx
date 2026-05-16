import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAllData } from "../api/googleSheetApi";

function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadCustomers();
  }, []);

  async function loadCustomers() {
    try {
      setLoading(true);
      setError("");

      const data = await getAllData("customers");
      console.log("Customers from Google Sheet:", data);

      setCustomers(data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  function getValue(row, keys) {
    for (const key of keys) {
      if (row[key] !== undefined && row[key] !== null && row[key] !== "") {
        return row[key];
      }
    }
    return "-";
  }

  if (loading) {
    return <p>Loading customers...</p>;
  }

  if (error) {
    return <p className="error-text">Error: {error}</p>;
  }

  return (
    <div>
      <div className="page-header">
        <h2>Customers</h2>
        <p>Manage all customer records.</p>
      </div>

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Customer ID</th>
              <th>Name</th>
              <th>Phone</th>
              <th>Email</th>
              <th>Address</th>
              <th>Created Date</th>
              <th>Profile</th>
            </tr>
          </thead>

          <tbody>
            {customers.map((customer, index) => {
              const customerId = getValue(customer, [
                "customer_ID",
                "customer_ID ",
                "Customer_ID",
                "Customer ID",
                "id",
              ]);

              const customerName = getValue(customer, [
                "Customer_Name",
                "Customer Name",
                "name",
              ]);

              const phone = getValue(customer, ["Phone", "phone"]);
              const email = getValue(customer, ["Email", "email"]);
              const address = getValue(customer, ["Address", "address"]);

              const createdDate = getValue(customer, [
                "Created_Date",
                "Created Date",
                "createdDate",
              ]);

              return (
                <tr key={customerId !== "-" ? customerId : index}>
                  <td>{customerId}</td>
                  <td>{customerName}</td>
                  <td>{phone}</td>
                  <td>{email}</td>
                  <td>{address}</td>
                  <td>{createdDate}</td>
                  <td>
                    {customerId !== "-" ? (
                      <Link
                        className="view-link"
                        to={`/customers/${customerId}`}
                      >
                        View
                      </Link>
                    ) : (
                      "-"
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {customers.length === 0 && <p>No customers found.</p>}
      </div>
    </div>
  );
}

export default Customers;