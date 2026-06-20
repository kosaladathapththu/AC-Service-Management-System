export function normalizeId(value) {
  return String(value || "").trim().toLowerCase();
}

export function getLocationsForCustomer(locations, customerId, includeInactive = false) {
  const cleanCustomerId = normalizeId(customerId);

  return (locations || [])
    .filter((location) => {
      if (normalizeId(location.Customer_ID) !== cleanCustomerId) return false;
      return includeInactive || normalizeId(location.Status || "Active") !== "inactive";
    })
    .sort((a, b) => {
      const defaultDifference = Number(isDefaultLocation(b)) - Number(isDefaultLocation(a));
      if (defaultDifference) return defaultDifference;
      return getLocationLabel(a).localeCompare(getLocationLabel(b));
    });
}

export function isDefaultLocation(location) {
  return ["yes", "true", "1"].includes(normalizeId(location?.Is_Default));
}

export function getLocationLabel(location) {
  if (!location) return "Customer's main address";
  return location.Branch_Name || location.Address || location.Location_ID || "Unnamed location";
}

export function findLocation(locations, locationId) {
  const cleanId = normalizeId(locationId);
  if (!cleanId) return null;
  return (locations || []).find(
    (location) => normalizeId(location.Location_ID) === cleanId
  ) || null;
}

export function resolveRecordLocation(record, acUnits, locations) {
  const directLocation = findLocation(locations, record?.Location_ID);
  if (directLocation) return directLocation;

  const acId = normalizeId(record?.AC_ID);
  const unit = (acUnits || []).find((item) => normalizeId(item.AC_ID) === acId);
  return findLocation(locations, unit?.Location_ID);
}

export function emptyLocationData(customerId = "") {
  return {
    Location_ID: "",
    Customer_ID: customerId,
    Branch_Name: "",
    Contact_Person: "",
    Phone: "",
    Address: "",
    Google_Map_Link: "",
    Is_Default: "No",
    Status: "Active",
    Notes: "",
  };
}
