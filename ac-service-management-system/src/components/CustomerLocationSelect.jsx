import { getLocationLabel, getLocationsForCustomer } from "../utils/customerLocations";

function CustomerLocationSelect({
  customerId,
  locations,
  value,
  onChange,
  required = false,
  disabled = false,
  label = "Branch / Service Location",
}) {
  const options = getLocationsForCustomer(locations, customerId);

  return (
    <div className="form-group">
      <label>
        {label} {required && <span className="required">*</span>}
      </label>
      <select
        name="Location_ID"
        value={value || ""}
        onChange={onChange}
        required={required}
        disabled={disabled || !customerId}
      >
        <option value="">Customer&apos;s main address (no branch)</option>
        {options.map((location) => (
          <option key={location.Location_ID} value={location.Location_ID}>
            {getLocationLabel(location)}
            {location.Phone ? ` — ${location.Phone}` : ""}
          </option>
        ))}
      </select>
      <span className="form-hint">
        Optional. Leave this on the main address for ordinary customers.
      </span>
    </div>
  );
}

export default CustomerLocationSelect;
