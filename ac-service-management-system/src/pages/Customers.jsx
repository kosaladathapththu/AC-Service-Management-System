import { Link } from "react-router-dom";
import { customers } from "../data/dummyData";

function Customers() {
  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Customers</h2>
          <p>Manage all registered customer records.</p>
        </div>
        <button className="btn-primary">+ Add Customer</button>
      </div>

      <div className="table-card">
        <div className="table-card-header">
          <h3>All Customers ({customers.length})</h3>
        </div>

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
                <td style={{ color: "#6B7280", fontFamily: "monospace", fontSize: 12 }}>
                  {customer.id}
                </td>
                <td style={{ fontWeight: 500 }}>{customer.name}</td>
                <td>{customer.phone}</td>
                <td>{customer.email}</td>
                <td>{customer.address}</td>
                <td>
                  <span
                    className={`badge ${
                      customer.status === "Active"
                        ? "badge-active"
                        : "badge-inactive"
                    }`}
                  >
                    {customer.status}
                  </span>
                </td>
                <td>
                  <Link className="view-link" to={`/customers/${customer.id}`}>
                    View →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Customers;