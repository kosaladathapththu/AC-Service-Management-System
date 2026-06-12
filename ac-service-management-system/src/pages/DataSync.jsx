import { useState } from "react";
import { syncCompanySheet, getAllData } from "../api/googleSheetApi";
import { SOURCE_SHEETS, SYSTEM_DATABASE_SHEET } from "../config/sourceSheets";

function DataSync() {
  const [syncing, setSyncing] = useState(false);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState("");
  const [syncDetails, setSyncDetails] = useState([]);
  const [logs, setLogs] = useState([]);

  async function handleSync() {
    const confirmSync = window.confirm(
      "This will sync data from the Online Orders and Showroom source sheets into the system database. Continue?"
    );

    if (!confirmSync) return;

    try {
      setSyncing(true);
      setSuccessMessage("");
      setError("");
      setSyncDetails([]);

      const result = await syncCompanySheet(SOURCE_SHEETS);

      setSuccessMessage(result.message || "Company sheet synced successfully.");
      setSyncDetails(result.details || []);

      await loadImportLogs();
    } catch (error) {
      setError(error.message);
    } finally {
      setSyncing(false);
    }
  }

  async function loadImportLogs() {
    try {
      setLoadingLogs(true);
      setError("");

      const data = await getAllData("importLog");
      setLogs(data.reverse().slice(0, 50));
    } catch (error) {
      setError(error.message);
    } finally {
      setLoadingLogs(false);
    }
  }

  return (
    <div className="page-content data-sync-page">
      <div className="page-header">
        <h2>Data Sync</h2>
        <p>
          Sync old company sheet records into the new AC Management System
          database.
        </p>
      </div>

      {successMessage && <p className="success-text">{successMessage}</p>}
      {error && <p className="error-text">Error: {error}</p>}

      <div className="sync-info-card">
        <h3>Sync Flow</h3>
        <p>
          Online Orders + Showroom Sheets - Import Process - System Database -
          React Dashboard
        </p>

        <div className="sync-warning">
          <strong>Important:</strong> This is a one-way sync. Data comes from
          the Google source sheets into the new system database.
        </div>
      </div>

      <div className="sync-action-card">
        <h3>Company Sheet Sync</h3>
        <p>
          Click the button below to import customers, AC units, services, and
          payments from the Online Orders and Showroom source sheets.
        </p>

        <div className="sync-source-list">
          <a
            className="sync-source-link system-database"
            href={SYSTEM_DATABASE_SHEET.url}
            target="_blank"
            rel="noreferrer"
          >
            <span>{SYSTEM_DATABASE_SHEET.label}</span>
            <small>Database</small>
          </a>

          {SOURCE_SHEETS.map((sheet) => (
            <a
              key={sheet.key}
              className="sync-source-link"
              href={sheet.url}
              target="_blank"
              rel="noreferrer"
            >
              <span>{sheet.label}</span>
              <small>{sheet.channel}</small>
            </a>
          ))}
        </div>

        <button
          className="primary-sync-btn"
          onClick={handleSync}
          disabled={syncing}
        >
          {syncing ? "Syncing..." : "Sync Company Sheet"}
        </button>

        <button
          className="secondary-sync-btn"
          onClick={loadImportLogs}
          disabled={loadingLogs}
        >
          {loadingLogs ? "Loading Logs..." : "View Import Log"}
        </button>
      </div>

      {syncDetails.length > 0 && (
        <div className="sync-result-card">
          <h3>Sync Result</h3>

          {syncDetails.map((item, index) => (
            <p key={index}>{item}</p>
          ))}
        </div>
      )}

      <div className="sync-log-card">
        <h3>Recent Import Logs</h3>

        {logs.length === 0 && (
          <p className="empty-text">
            No logs loaded yet. Click "View Import Log".
          </p>
        )}

        {logs.length > 0 && (
          <div className="sync-log-table-wrap">
            <table className="sync-log-table">
              <thead>
                <tr>
                  <th>Log ID</th>
                  <th>Source Sheet</th>
                  <th>Row</th>
                  <th>Action</th>
                  <th>Status</th>
                  <th>Customer</th>
                  <th>AC</th>
                  <th>Message</th>
                  <th>Date</th>
                </tr>
              </thead>

              <tbody>
                {logs.map((log, index) => (
                  <tr key={log.Log_ID || index}>
                    <td>{log.Log_ID || "-"}</td>
                    <td>{log.Source_Sheet || "-"}</td>
                    <td>{log.Source_Row || "-"}</td>
                    <td>{log.Action || "-"}</td>
                    <td>
                      <span className={`sync-status ${getStatusClass(log.Status)}`}>
                        {log.Status || "-"}
                      </span>
                    </td>
                    <td>{log.Customer_ID || "-"}</td>
                    <td>{log.AC_ID || "-"}</td>
                    <td>{log.Message || "-"}</td>
                    <td>{formatDate(log.Imported_Date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function getStatusClass(status) {
  const value = String(status || "").toLowerCase();

  if (value === "imported" || value === "success") return "status-success";
  if (value === "duplicate") return "status-warning";
  if (value === "needs review") return "status-danger";
  if (value === "skipped") return "status-muted";

  return "";
}

function formatDate(value) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleString("en-GB");
}

export default DataSync;
