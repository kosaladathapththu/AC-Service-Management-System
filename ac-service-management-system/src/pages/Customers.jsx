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
      setCustomers(data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
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
              <th>Status</th>
              <th>Profile</th>
            </tr>
          </thead>

          <tbody>
            {customers.map((customer) => (
              <tr key={customer.id}>
                <td>{customer.id}</td>
                <td>{customer.name}</td>
                <td>{customer.phone}</td>
                <td>{customer.email}</td>
                <td>{customer.address}</td>
                <td>{customer.status}</td>
                <td>
                  <Link className="view-link" to={`/customers/${customer.id}`}>
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {customers.length === 0 && <p>No customers found.</p>}
      </div>
    </div>
  );
}

export default Customers;