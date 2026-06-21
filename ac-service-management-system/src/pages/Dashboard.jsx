import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { getAllData, getCustomerProfile, getDashboardData } from "../api/googleSheetApi";
import PaymentEvidence from "../components/PaymentEvidence";
import { getPaymentEvidence } from "../utils/paymentEvidence";

function Dashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [notInstalledCount, setNotInstalledCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [error, setError] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedProfile, setSelectedProfile] = useState(null);
  const profileCacheRef = useRef(new Map());
  const profileRequestRef = useRef(0);

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    try {
      setLoading(true);
      setError("");

      const [data, customersData, acUnitsData, installationsData] = await Promise.all([
        getDashboardData(),
        getAllData("customers"),
        getAllData("acUnits"),
        getAllData("installations"),
      ]);

      setDashboardData(data);
      setCustomers(customersData);
      setNotInstalledCount(
        acUnitsData.filter(
          (unit) => !isACUnitInstalled(unit.AC_ID, installationsData)
        ).length
      );
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function openCustomerProfile(customer) {
    const customerId = getValue(customer, [
      "Customer_ID",
      "customer_ID",
      "Customer ID",
      "id",
    ]);

    if (!customerId || customerId === "-") return;

    const cachedProfile = profileCacheRef.current.get(customerId);
    if (cachedProfile) {
      setProfileError("");
      setSelectedProfile(cachedProfile);
      return;
    }

    const requestId = ++profileRequestRef.current;
    setSelectedProfile({ customer });
    setProfileError("");

    try {
      setProfileLoading(true);
      const profile = await getCustomerProfile(customerId);
      profileCacheRef.current.set(customerId, profile);
      if (profileRequestRef.current === requestId) {
        setSelectedProfile(profile);
      }
    } catch (error) {
      if (profileRequestRef.current === requestId) {
        setProfileError(error.message);
      }
    } finally {
      if (profileRequestRef.current === requestId) {
        setProfileLoading(false);
      }
    }
  }

  function closeCustomerProfile() {
    profileRequestRef.current += 1;
    setProfileLoading(false);
    setProfileError("");
    setSelectedProfile(null);
  }

  if (loading) {
    return <p>Loading dashboard data...</p>;
  }

  if (error) {
    return <p className="error-text">Error: {error}</p>;
  }

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <div>
          <span className="page-eyebrow">Operations overview</span>
          <h2>{getGreeting()}, Administrator</h2>
          <p>Main action center for services, payments, complaints, and warranties.</p>
        </div>
        <div className="live-status"><span /> Live workspace</div>
      </div>

      <CustomerLookup
        query={customerSearch}
        customers={customers}
        loading={profileLoading}
        onQueryChange={setCustomerSearch}
        onOpenProfile={openCustomerProfile}
      />

      <div className="dashboard-action-grid">
        <DashboardActionCard
          title="Total Customers"
          value={dashboardData.totalCustomers}
          note="All registered customers"
          link="/customers"
          type="neutral"
          icon="ti-users"
        />

        <DashboardActionCard
          title="Services Due This Month"
          value={dashboardData.servicesDueThisMonth}
          note="Pending services this month"
          link="/services?filter=due-this-month"
          type="info"
          icon="ti-calendar-event"
        />

        <DashboardActionCard
          title="Overdue Services"
          value={dashboardData.overdueServices}
          note="Previous services not completed"
          link="/services?filter=overdue"
          type="danger"
          icon="ti-clock-exclamation"
        />

        <DashboardActionCard
          title="Pending Payments"
          value={dashboardData.pendingPayments}
          note="Customers waiting to pay"
          link="/payments?filter=pending"
          type="warning"
          icon="ti-wallet"
        />

        <DashboardActionCard
          title="Overdue Payments"
          value={dashboardData.overduePayments}
          note="Payment due date passed"
          link="/payments?filter=overdue"
          type="danger"
          icon="ti-alert-triangle"
        />

        <DashboardActionCard
          title="Active Warranties"
          value={dashboardData.activeWarranties}
          note="Currently valid warranties"
          link="/ac-units?filter=active-warranty"
          type="success"
          icon="ti-shield-check"
        />

        <DashboardActionCard
          title="Pending Installed Units"
          value={notInstalledCount}
          note="Sold units waiting for installation"
          link="/ac-units?filter=not-installed"
          type="warning"
          icon="ti-package"
        />

        <DashboardActionCard
          title="Open Complaints"
          value={dashboardData.openComplaints}
          note="Complaints needing action"
          link="/complaints?filter=open"
          type="danger"
          icon="ti-message-exclamation"
        />
      </div>

      <ReminderSection
        title="Services Due This Month"
        description="Pending or rescheduled services scheduled for this month."
        type="service"
        data={dashboardData.servicesDueThisMonthList}
      />

      <ReminderSection
        title="Overdue Services"
        description="Previous month services that are still pending or rescheduled."
        type="service"
        data={dashboardData.overdueServicesList}
      />

      <ReminderSection
        title="Pending Payments"
        description="Customers who still need to complete payment."
        type="payment"
        data={dashboardData.pendingPaymentsList}
      />

      <ReminderSection
        title="Overdue Payments"
        description="Pending payments where the due date has already passed."
        type="payment"
        data={dashboardData.overduePaymentsList}
      />

      <ReminderSection
        title="Open Complaints"
        description="Complaints that are open or currently in progress."
        type="complaint"
        data={dashboardData.openComplaintsList}
      />

      {selectedProfile && (
        <CustomerProfileModal
          profile={selectedProfile}
          loading={profileLoading}
          error={profileError}
          onClose={closeCustomerProfile}
        />
      )}
    </div>
  );
}

function CustomerLookup({
  query,
  customers,
  loading,
  onQueryChange,
  onOpenProfile,
}) {
  const results = getCustomerSearchResults(customers, query);

  return (
    <div className="dashboard-customer-lookup">
      <div>
        <h3>Find Customer</h3>
        <p>Search by customer name or phone number to view full details.</p>
      </div>

      <div className="dashboard-customer-search">
        <input
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Enter customer name or phone number"
        />
        {query && (
          <button type="button" onClick={() => onQueryChange("")}>
            Clear
          </button>
        )}
      </div>

      {query.trim() && (
        <div className="dashboard-customer-results">
          {results.length === 0 ? (
            <p className="dashboard-customer-empty">No customer found.</p>
          ) : (
            results.map((customer, index) => {
              const customerId = getValue(customer, [
                "Customer_ID",
                "customer_ID",
                "Customer ID",
                "id",
              ]);
              const customerName = getValue(customer, [
                "Customer_Name",
                "Customer Name",
                "name",
              ]);
              const phone = getValue(customer, ["Phone", "phone"]);

              return (
                <button
                  key={customerId !== "-" ? customerId : index}
                  type="button"
                  onClick={() => onOpenProfile(customer)}
                  disabled={loading}
                >
                  <span>{customerId} - {customerName}</span>
                  <small>{phone}</small>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

function CustomerProfileModal({ profile, loading, error, onClose }) {
  if (loading || error) {
    const customerName = getValue(profile?.customer, [
      "Customer_Name",
      "Customer Name",
      "name",
    ]);

    return (
      <div className="modal-overlay customer-profile-loading-overlay">
        <div className="modal-card dashboard-profile-modal customer-profile-loading-modal">
          <div className="modal-header">
            <div>
              <span className="profile-loading-eyebrow">Customer profile</span>
              <h3>{customerName}</h3>
            </div>
            <button className="close-btn" onClick={onClose} aria-label="Close">×</button>
          </div>

          {error ? (
            <div className="profile-load-error">
              <i className="ti ti-alert-circle" aria-hidden="true" />
              <div>
                <strong>Could not load customer details</strong>
                <p>{error}</p>
              </div>
            </div>
          ) : (
            <div className="profile-loading-content" role="status" aria-live="polite">
              <div className="profile-loading-spinner" aria-hidden="true">
                <span />
              </div>
              <h4>Loading customer details</h4>
              <p>Collecting units, services, payments, and complaints…</p>
              <div className="profile-skeleton-grid" aria-hidden="true">
                {[0, 1, 2, 3].map((item) => (
                  <div className="profile-skeleton-card" key={item}>
                    <span />
                    <span />
                    <span />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  const {
    customer,
    acUnits = [],
    installations = [],
    services = [],
    payments = [],
    complaints = [],
  } = profile;

  const customerId = getValue(customer, ["Customer_ID", "customer_ID", "Customer ID", "id"]);
  const customerName = getValue(customer, ["Customer_Name", "Customer Name", "name"]);
  const phone = getValue(customer, ["Phone", "phone"]);
  const email = getValue(customer, ["Email", "email"]);
  const address = getValue(customer, ["Address", "address"]);
  const initials = customerName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  const profileCounts = [
    { label: "Units", value: acUnits.length, icon: "ti-air-conditioning", type: "units" },
    { label: "Installs", value: installations.length, icon: "ti-tool", type: "installs" },
    { label: "Services", value: services.length, icon: "ti-settings", type: "services" },
    { label: "Payments", value: payments.length, icon: "ti-wallet", type: "payments" },
    { label: "Complaints", value: complaints.length, icon: "ti-message-report", type: "complaints" },
  ];

  return (
    <div className="modal-overlay customer-profile-loaded-overlay">
      <div className="modal-card dashboard-profile-modal customer-profile-loaded-modal">
        <div className="customer-profile-hero">
          <div className="customer-profile-avatar" aria-hidden="true">{initials || "C"}</div>
          <div className="customer-profile-identity">
            <span className="customer-profile-label">Customer profile</span>
            <h3>{customerName}</h3>
            <span className="customer-id-pill">{customerId}</span>
          </div>
          <button className="close-btn customer-profile-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className="customer-profile-contact-grid">
          <div className="customer-contact-item">
            <i className="ti ti-phone" aria-hidden="true" />
            <div><small>Phone</small><strong>{phone}</strong></div>
          </div>
          <div className="customer-contact-item">
            <i className="ti ti-mail" aria-hidden="true" />
            <div><small>Email</small><strong>{email}</strong></div>
          </div>
          <div className="customer-contact-item customer-address-item">
            <i className="ti ti-map-pin" aria-hidden="true" />
            <div><small>Service address</small><strong>{address}</strong></div>
          </div>
        </div>

        <div className="customer-profile-counts" aria-label="Customer record summary">
          {profileCounts.map((item) => (
            <div className={`profile-count-card profile-count-${item.type}`} key={item.label}>
              <i className={`ti ${item.icon}`} aria-hidden="true" />
              <div><strong>{item.value}</strong><span>{item.label}</span></div>
            </div>
          ))}
        </div>

        <div className="customer-profile-sections">

        <DashboardProfileSection title="AC Units" count={acUnits.length} icon="ti-air-conditioning" type="units">
          {acUnits.map((unit, index) => (
            <MiniRecord key={unit.AC_ID || index} id={unit.AC_ID}>
              <span>{unit.AC_Model || "-"}</span>
              <span>{unit.Serial_Number || "-"}</span>
              <span className={`status-badge ${getWarrantyStatusClass(unit.Warranty_Status)}`}>
                {unit.Warranty_Status || "-"}
              </span>
            </MiniRecord>
          ))}
        </DashboardProfileSection>

        <DashboardProfileSection title="Installations" count={installations.length} icon="ti-tool" type="installs">
          {installations.map((item, index) => (
            <MiniRecord key={item.Installation_ID || index} id={item.Installation_ID}>
              <span>AC: {item.AC_ID || "-"}</span>
              <span>{formatDate(item.Installation_Date)}</span>
              <span className={`status-badge ${getInstallationStatusClass(item.Installation_Status)}`}>
                {item.Installation_Status || "-"}
              </span>
            </MiniRecord>
          ))}
        </DashboardProfileSection>

        <DashboardProfileSection title="Services" count={services.length} icon="ti-settings" type="services">
          {services.map((item, index) => (
            <MiniRecord key={item.Service_ID || index} id={item.Service_ID}>
              <span>AC: {item.AC_ID || "-"}</span>
              <span>{formatDate(item.Service_Date)}</span>
              <span className={`status-badge ${getServiceStatusClass(item.Service_Status)}`}>
                {item.Service_Status || "-"}
              </span>
            </MiniRecord>
          ))}
        </DashboardProfileSection>

        <DashboardProfileSection title="Payments" count={payments.length} icon="ti-wallet" type="payments">
          {payments.map((item, index) => {
            const evidence = getPaymentEvidence(item);

            return (
              <MiniRecord key={item.Payment_ID || index} id={item.Payment_ID}>
                <span>{formatPrice(item.Amount)}</span>
                <span>{item.Payment_Type || "-"}</span>
                <span className={`status-badge ${getPaymentStatusClass(item.Payment_Status)}`}>
                  {item.Payment_Status || "-"}
                </span>
                {evidence.hasEvidence && (
                  <div className="profile-payment-evidence">
                    <strong>Payment Evidence</strong>
                    <PaymentEvidence evidence={evidence} />
                  </div>
                )}
              </MiniRecord>
            );
          })}
        </DashboardProfileSection>

        <DashboardProfileSection title="Complaints" count={complaints.length} icon="ti-message-report" type="complaints">
          {complaints.map((item, index) => (
            <MiniRecord key={item.Complaint_ID || index} id={item.Complaint_ID}>
              <span>AC: {item.AC_ID || "-"}</span>
              <span>{item.Issue_Description || "-"}</span>
              <span className={`status-badge ${getComplaintStatusClass(item.Complaint_Status)}`}>
                {item.Complaint_Status || "-"}
              </span>
            </MiniRecord>
          ))}
        </DashboardProfileSection>
        </div>
      </div>
    </div>
  );
}

function DashboardProfileSection({ title, count, children, icon, type }) {
  return (
    <div className={`dashboard-profile-section profile-section-${type}`}>
      <div className="dashboard-profile-section-header">
        <h4><i className={`ti ${icon}`} aria-hidden="true" />{title}</h4>
        <span>{count}</span>
      </div>
      {count === 0 ? (
        <div className="profile-section-empty">
          <i className="ti ti-circle-check" aria-hidden="true" />
          <p>No records found</p>
        </div>
      ) : <div className="profile-section-records">{children}</div>}
    </div>
  );
}

function MiniRecord({ id, children }) {
  return (
    <div className="dashboard-mini-record">
      <strong>{id || "-"}</strong>
      <div>{children}</div>
    </div>
  );
}

function DashboardActionCard({ title, value, note, link, type, icon }) {
  return (
    <Link to={link} className={`dashboard-action-card dashboard-action-${type}`}>
      <div className="dashboard-action-icon"><i className={`ti ${icon}`} /></div>
      <div>
        <p className="dashboard-action-title">{title}</p>
        <h3>{value}</h3>
        <span>{note}</span>
      </div>

      <div className="dashboard-action-arrow" aria-label={`View ${title}`}>
        <i className="ti ti-arrow-up-right" />
      </div>
    </Link>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function ReminderSection({ title, description, type, data = [] }) {
  return (
    <div className="table-card reminder-section">
      <div className="reminder-header">
        <div>
          <h3>{title}</h3>
          <p>{description}</p>
        </div>

        <span className="reminder-count">{data.length}</span>
      </div>

      {data.length === 0 ? (
        <p className="empty-reminder">No records found.</p>
      ) : (
        <table>
          <thead>
            {type === "service" && (
              <tr>
                <th>Service ID</th>
                <th>Customer</th>
                <th>AC ID</th>
                <th>Service Date</th>
                <th>Type</th>
                <th>Status</th>
                <th>Technician</th>
                <th>Profile</th>
              </tr>
            )}

            {type === "payment" && (
              <tr>
                <th>Payment ID</th>
                <th>Customer</th>
                <th>AC ID</th>
                <th>Year</th>
                <th>Amount</th>
                <th>Type</th>
                <th>Status</th>
                <th>Due Date</th>
                <th>Evidence</th>
                <th>Profile</th>
              </tr>
            )}

            {type === "complaint" && (
              <tr>
                <th>Complaint ID</th>
                <th>Customer</th>
                <th>AC ID</th>
                <th>Date</th>
                <th>Issue</th>
                <th>Status</th>
                <th>Technician</th>
                <th>Profile</th>
              </tr>
            )}
          </thead>

          <tbody>
            {data.map((item, index) => {
              if (type === "service") {
                return (
                  <tr key={item.Service_ID || index}>
                    <td>{item.Service_ID || "-"}</td>
                    <td>
                      {item.Customer_ID} - {item.Customer_Name}
                    </td>
                    <td>{item.AC_ID || "-"}</td>
                    <td>{formatDate(item.Service_Date)}</td>
                    <td>{item.Service_Type || "-"}</td>
                    <td>
                      <span
                        className={`status-badge ${getServiceStatusClass(
                          item.Service_Status
                        )}`}
                      >
                        {item.Service_Status || "-"}
                      </span>
                    </td>
                    <td>{item.Technician_Name || "-"}</td>
                    <td>
                      <Link
                        className="view-link"
                        to={`/customers/${item.Customer_ID}`}
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                );
              }

              if (type === "payment") {
                const evidence = getPaymentEvidence(item);

                return (
                  <tr key={item.Payment_ID || index}>
                    <td>{item.Payment_ID || "-"}</td>
                    <td>
                      {item.Customer_ID} - {item.Customer_Name}
                    </td>
                    <td>{item.AC_ID || "-"}</td>
                    <td>{item.Payment_Year || "-"}</td>
                    <td>{formatPrice(item.Amount)}</td>
                    <td>{item.Payment_Type || "-"}</td>
                    <td>
                      <span
                        className={`status-badge ${getPaymentStatusClass(
                          item.Payment_Status
                        )}`}
                      >
                        {item.Payment_Status || "-"}
                      </span>
                    </td>
                    <td>{formatDate(item.Due_Date)}</td>
                    <td>
                      {evidence.openUrl ? (
                        <a
                          className="view-link"
                          href={evidence.openUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          View
                        </a>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td>
                      <Link
                        className="view-link"
                        to={`/customers/${item.Customer_ID}`}
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                );
              }

              return (
                <tr key={item.Complaint_ID || index}>
                  <td>{item.Complaint_ID || "-"}</td>
                  <td>
                    {item.Customer_ID} - {item.Customer_Name}
                  </td>
                  <td>{item.AC_ID || "-"}</td>
                  <td>{formatDate(item.Complaint_Date)}</td>
                  <td>{item.Issue_Description || "-"}</td>
                  <td>
                    <span
                      className={`status-badge ${getComplaintStatusClass(
                        item.Complaint_Status
                      )}`}
                    >
                      {item.Complaint_Status || "-"}
                    </span>
                  </td>
                  <td>{item.Technician_Name || "-"}</td>
                  <td>
                    <Link
                      className="view-link"
                      to={`/customers/${item.Customer_ID}`}
                    >
                      View
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

function getCustomerSearchResults(customers, query) {
  const cleanQuery = String(query || "").trim().toLowerCase();
  const queryDigits = String(query || "").replace(/\D/g, "");
  const searchPhone = normalizePhoneSearchQuery(query);
  if (!cleanQuery) return [];

  return customers
    .filter((customer) => {
      const name = getValue(customer, ["Customer_Name", "Customer Name", "name"]);
      const phone = getValue(customer, ["Phone", "phone"]);
      const customerPhone = normalizePhone(phone);
      const customerId = getValue(customer, [
        "Customer_ID",
        "customer_ID",
        "Customer ID",
        "id",
      ]);

      const textMatches = [name, phone, customerId].some((value) =>
        String(value || "").toLowerCase().includes(cleanQuery)
      );

      if (textMatches) return true;

      return (
        (searchPhone.length >= 1 && customerPhone.includes(searchPhone)) ||
        (queryDigits && /^0+$/.test(queryDigits) && customerPhone !== "")
      );
    })
    .slice(0, 8);
}

function getValue(row, keys) {
  if (!row) return "-";

  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null && row[key] !== "") {
      return row[key];
    }
  }

  return "-";
}

function formatDate(value) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleDateString("en-GB");
}

function formatPrice(value) {
  if (!value) return "-";

  const numberValue = Number(value);
  if (Number.isNaN(numberValue)) return String(value);

  return `Rs. ${numberValue.toLocaleString("en-LK")}`;
}

function normalizePhoneSearchQuery(value) {
  const digits = String(value || "").replace(/\D/g, "");

  if (!digits) return "";

  let phone = digits;

  if (phone.startsWith("0094")) {
    phone = phone.slice(4);
  } else if (phone.startsWith("94")) {
    phone = phone.slice(2);
  }

  return phone.replace(/^0+/, "");
}

function normalizePhone(value) {
  const digits = String(value || "").replace(/\D/g, "");

  if (!digits) return "";

  let phone = digits;

  if (phone.startsWith("0094") && phone.length > 9) {
    phone = phone.slice(4);
  } else if (phone.startsWith("94") && phone.length > 9) {
    phone = phone.slice(2);
  } else if (phone.startsWith("0") && phone.length > 9) {
    phone = phone.replace(/^0+/, "");
  }

  return phone.length > 9 ? phone.slice(-9) : phone;
}

function isACUnitInstalled(acId, installations) {
  const cleanAcId = normalizeValue(acId);
  if (!cleanAcId) return false;

  return installations.some((installation) => {
    const status = normalizeValue(installation.Installation_Status);

    return (
      normalizeValue(installation.AC_ID) === cleanAcId &&
      status !== "cancelled"
    );
  });
}

function normalizeValue(value) {
  return String(value || "").trim().toLowerCase();
}

function getWarrantyStatusClass(status) {
  if (!status) return "";

  const value = String(status).toLowerCase();

  if (value === "active") return "status-active";
  if (value === "expired") return "status-expired";
  if (value === "cancelled") return "status-cancelled";

  return "";
}

function getInstallationStatusClass(status) {
  if (!status) return "";

  const value = String(status).toLowerCase();

  if (value === "completed") return "status-active";
  if (value === "pending") return "status-expired";
  if (value === "cancelled") return "status-cancelled";

  return "";
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

function getPaymentStatusClass(status) {
  if (!status) return "";

  const value = String(status).toLowerCase();

  if (value === "paid") return "status-active";
  if (value === "pending") return "status-expired";

  return "";
}

function getComplaintStatusClass(status) {
  if (!status) return "";

  const value = String(status).toLowerCase();

  if (value === "open") return "status-expired";
  if (value === "in progress") return "status-info";
  if (value === "completed") return "status-active";
  if (value === "cancelled") return "status-cancelled";

  return "";
}

export default Dashboard;
