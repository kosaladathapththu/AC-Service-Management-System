/**
 * Optional customer branches / service locations.
 *
 * INSTALLATION
 * 1. Paste this entire file LAST in the existing Apps Script project (after
 *    apps-script-full-sync-patch.gs and apps-script-payment-evidence.gs).
 * 2. Run setupCustomerLocationsFeature() once from the Apps Script editor.
 * 3. Authorize it, then deploy a NEW web-app version.
 *
 * Single buyers do not need Customer_Locations rows. Their existing Customer
 * phone/address remains the fallback. Branch customers may have any number of
 * location rows linked by Customer_ID.
 */

var CUSTOMER_LOCATION_PATCH = {
  spreadsheetId: "1ED6NXaLWpPxK0RJy7f4gIUqbyPNB9LHGIyedbU6VOuE",
  locationSheet: "Customer_Locations",
  locationHeaders: [
    "Location_ID",
    "Customer_ID",
    "Branch_Name",
    "Contact_Person",
    "Phone",
    "Address",
    "Google_Map_Link",
    "Is_Default",
    "Status",
    "Notes",
  ],
  linkedSheets: ["AC_Units", "Installations", "Services", "Complaints"],
};

function setupCustomerLocationsFeature() {
  var spreadsheet = SpreadsheetApp.openById(CUSTOMER_LOCATION_PATCH.spreadsheetId);
  var locationSheet = spreadsheet.getSheetByName(CUSTOMER_LOCATION_PATCH.locationSheet);

  if (!locationSheet) {
    locationSheet = spreadsheet.insertSheet(CUSTOMER_LOCATION_PATCH.locationSheet);
  }

  locationPatchEnsureHeaders(locationSheet, CUSTOMER_LOCATION_PATCH.locationHeaders);

  CUSTOMER_LOCATION_PATCH.linkedSheets.forEach(function (sheetName) {
    var sheet = spreadsheet.getSheetByName(sheetName);
    if (!sheet) throw new Error("Required sheet not found: " + sheetName);
    locationPatchEnsureHeaders(sheet, ["Location_ID"]);
  });

  locationSheet.setFrozenRows(1);
  var warrantyExpiry = setupAutoWarrantyExpiry();
  return {
    success: true,
    message: "Customer location headers are ready.",
    locationHeaders: CUSTOMER_LOCATION_PATCH.locationHeaders,
    linkedSheets: CUSTOMER_LOCATION_PATCH.linkedSheets,
    warrantyExpiry: warrantyExpiry,
  };
}

/**
 * Creates one daily trigger and immediately synchronizes warranty statuses.
 * Cancelled warranties are never changed. Run this directly if the customer
 * location setup was already completed before automatic expiry was added.
 */
function setupAutoWarrantyExpiry() {
  var handlerName = "refreshWarrantyStatuses";
  locationPatchEnsureWarrantyHeaders();

  ScriptApp.getProjectTriggers().forEach(function (trigger) {
    if (trigger.getHandlerFunction() === handlerName) {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  ScriptApp.newTrigger(handlerName)
    .timeBased()
    .everyDays(1)
    .atHour(1)
    .create();

  var result = refreshWarrantyStatuses();
  result.triggerCreated = true;
  return result;
}

function locationPatchEnsureWarrantyHeaders() {
  var sheet = locationPatchGetSheet("AC_Units");
  var lastColumn = Math.max(sheet.getLastColumn(), 1);
  var headers = sheet.getRange(1, 1, 1, lastColumn).getValues()[0].map(String);

  if (
    locationPatchFindHeaderIndex(headers, [
      "Warranty_End_Date",
      "Warranty End Date",
      "WarrantyEndDate",
      "Warranty_End_Da",
    ]) === -1
  ) {
    locationPatchEnsureHeaders(sheet, ["Warranty_End_Date"]);
  }

  if (
    locationPatchFindHeaderIndex(headers, [
      "Warranty_Status",
      "Warranty Status",
      "WarrantyStatus",
      "Warranty_Statu",
    ]) === -1
  ) {
    locationPatchEnsureHeaders(sheet, ["Warranty_Status"]);
  }
}

function refreshWarrantyStatuses() {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    var sheet = locationPatchGetSheet("AC_Units");
    var values = sheet.getDataRange().getValues();
    if (values.length < 2) {
      return { checked: 0, expired: 0, reactivated: 0 };
    }

    var headers = values[0].map(String);
    var endDateIndex = locationPatchFindHeaderIndex(headers, [
      "Warranty_End_Date",
      "Warranty End Date",
      "WarrantyEndDate",
      "Warranty_End_Da",
      "Warranty End Da",
    ]);
    var statusIndex = locationPatchFindHeaderIndex(headers, [
      "Warranty_Status",
      "Warranty Status",
      "WarrantyStatus",
      "Warranty_Statu",
    ]);
    var missingHeaders = [];
    if (endDateIndex === -1) missingHeaders.push("Warranty_End_Date");
    if (statusIndex === -1) missingHeaders.push("Warranty_Status");
    if (missingHeaders.length > 0) {
      throw new Error(
        "AC_Units is missing: " +
          missingHeaders.join(", ") +
          ". Actual row-1 headers: " +
          headers.filter(Boolean).join(" | ")
      );
    }

    var today = new Date();
    today = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    var expiredCount = 0;
    var reactivatedCount = 0;
    var missingEndDateCount = 0;
    var statuses = values.slice(1).map(function (row) {
      var storedStatus = locationPatchKey(row[statusIndex]);
      if (storedStatus === "cancelled") return ["Cancelled"];

      var endDate = locationPatchDateOnly(row[endDateIndex]);
      if (!endDate) {
        missingEndDateCount++;
        return [row[statusIndex] || "Active"];
      }

      if (endDate.getTime() < today.getTime()) {
        if (storedStatus !== "expired") expiredCount++;
        return ["Expired"];
      }

      if (storedStatus === "expired") reactivatedCount++;
      return [storedStatus === "expired" || !storedStatus ? "Active" : row[statusIndex]];
    });

    sheet.getRange(2, statusIndex + 1, statuses.length, 1).setValues(statuses);
    return {
      checked: statuses.length,
      expired: expiredCount,
      reactivated: reactivatedCount,
      missingEndDates: missingEndDateCount,
      updatedAt: new Date(),
    };
  } finally {
    lock.releaseLock();
  }
}

function locationPatchDateOnly(value) {
  if (!value) return null;
  var date = value instanceof Date ? value : new Date(value);
  if (isNaN(date.getTime())) return null;
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function locationPatchFindHeaderIndex(headers, acceptedNames) {
  var normalizedNames = acceptedNames.map(locationPatchNormalizeHeader);

  for (var index = 0; index < headers.length; index++) {
    var normalizedHeader = locationPatchNormalizeHeader(headers[index]);
    if (!normalizedHeader) continue;

    for (var nameIndex = 0; nameIndex < normalizedNames.length; nameIndex++) {
      var normalizedName = normalizedNames[nameIndex];
      if (
        normalizedHeader === normalizedName ||
        (normalizedHeader.length >= 12 && normalizedName.indexOf(normalizedHeader) === 0)
      ) {
        return index;
      }
    }
  }

  return -1;
}

function locationPatchNormalizeHeader(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function doGet(e) {
  try {
    var action = e.parameter.action;
    var type = e.parameter.type;
    var customerId = e.parameter.customerId;

    if (action === "getAll" && type === "customerLocations") {
      return jsonResponse({ success: true, data: locationPatchReadLocations() });
    }

    if (action === "getAll") {
      var records = getSheetData(type);
      return jsonResponse({
        success: true,
        data: locationPatchAddInheritedLocations(records, type),
      });
    }

    if (action === "getCustomerProfile") {
      var profile = getCustomerProfile(customerId);
      profile.locations = locationPatchReadLocations().filter(function (location) {
        return locationPatchKey(location.Customer_ID) === locationPatchKey(customerId);
      });
      profile.acUnits = locationPatchAddInheritedLocations(profile.acUnits || [], "acUnits");
      profile.installations = locationPatchAddInheritedLocations(profile.installations || [], "installations", profile.acUnits);
      profile.services = locationPatchAddInheritedLocations(profile.services || [], "services", profile.acUnits);
      profile.complaints = locationPatchAddInheritedLocations(profile.complaints || [], "complaints", profile.acUnits);
      return jsonResponse({ success: true, data: profile });
    }

    if (action === "syncPatchHealthCheck") {
      var health = syncPatchHealthCheck();
      health.customerLocationsInstalled = true;
      health.customerLocationsVersion = "2026-06-21";
      return jsonResponse({ success: true, data: health });
    }

    if (action === "syncPatchListSourceSheets") {
      return jsonResponse({ success: true, data: syncPatchListSourceSheets() });
    }

    if (action === "getDashboard") {
      return jsonResponse({ success: true, data: getDashboardData() });
    }

    return jsonResponse({ success: false, message: "Invalid action: " + action });
  } catch (error) {
    return jsonResponse({ success: false, message: error.message });
  }
}

function doPost(e) {
  try {
    var requestBody = JSON.parse(e.postData.contents);
    var action = requestBody.action;
    var data = requestBody.data || {};
    var result;

    if (action === "addSale") {
      var branchSales = Array.isArray(data.Branch_Sales) ? data.Branch_Sales : [];
      var saleData = data;

      if (branchSales.length > 0) {
        var branchACUnits = [];
        branchSales.forEach(function (branchSale, branchIndex) {
          var branchLocation = branchSale.location || {};
          if (!locationPatchText(branchLocation.Branch_Name)) {
            throw new Error("Branch name is required for branch " + (branchIndex + 1) + ".");
          }
          if (!locationPatchText(branchLocation.Address)) {
            throw new Error("Branch address is required for branch " + (branchIndex + 1) + ".");
          }
          if (!Array.isArray(branchSale.acUnits) || branchSale.acUnits.length === 0) {
            throw new Error("At least one AC unit is required for branch " + (branchIndex + 1) + ".");
          }
          (branchSale.acUnits || []).forEach(function (unit) {
            branchACUnits.push(unit);
          });
        });
        saleData = locationPatchMerge(data, { acUnits: branchACUnits });
      }

      result = addSale(saleData);
      var saleLocationId = data.Location_ID || "";
      var savedLocations = [];
      var createdACIds = (result.acIds || [result.acId]).filter(Boolean);

      if (branchSales.length > 0) {
        var acCursor = 0;
        branchSales.forEach(function (branchSale) {
          var savedBranch = saveCustomerLocation(
            locationPatchMerge(branchSale.location || {}, {
              Customer_ID: result.customerId,
            })
          ).location;
          savedLocations.push(savedBranch);

          (branchSale.acUnits || []).forEach(function () {
            var acId = createdACIds[acCursor++];
            if (acId) {
              updateRecord({
                type: "acUnits",
                idColumn: "AC_ID",
                id: acId,
                updatedData: { Location_ID: savedBranch.Location_ID },
              });
            }
          });
        });
        saleLocationId = savedLocations[0].Location_ID;
      } else {
        var submittedLocations = Array.isArray(data.Customer_Locations)
          ? data.Customer_Locations
          : data.Customer_Location
            ? [data.Customer_Location]
            : [];

        submittedLocations.forEach(function (submittedLocation) {
          savedLocations.push(
            saveCustomerLocation(
              locationPatchMerge(submittedLocation, { Customer_ID: result.customerId })
            ).location
          );
        });

        if (savedLocations.length > 0) {
          saleLocationId = savedLocations[0].Location_ID;
        }

        if (saleLocationId) {
          createdACIds.forEach(function (acId) {
            updateRecord({
              type: "acUnits",
              idColumn: "AC_ID",
              id: acId,
              updatedData: { Location_ID: saleLocationId },
            });
          });
        }
      }

      result.locationId = saleLocationId;
      result.locations = savedLocations;
      return locationPatchSuccess("Sale added successfully", result);
    }

    if (action === "addInstallation") {
      result = addInstallation(data);
      locationPatchUpdateCreatedRecord("installations", "Installation_ID", result.installationId || result.Installation_ID, data.Location_ID);
      if (data.Location_ID && data.AC_ID) {
        locationPatchUpdateCreatedRecord("acUnits", "AC_ID", data.AC_ID, data.Location_ID);
        locationPatchFillBlankLocation("Services", data.Customer_ID, data.AC_ID, data.Location_ID);
      }
      return locationPatchSuccess("Installation added successfully", result);
    }

    if (action === "addService") {
      result = addService(data);
      locationPatchUpdateCreatedRecord("services", "Service_ID", result.serviceId || result.Service_ID, data.Location_ID);
      return locationPatchSuccess("Service added successfully", result);
    }

    if (action === "addComplaint") {
      result = addComplaint(data);
      locationPatchUpdateCreatedRecord("complaints", "Complaint_ID", result.complaintId || result.Complaint_ID, data.Location_ID);
      return locationPatchSuccess("Complaint added successfully", result);
    }

    if (action === "saveCustomerLocation") {
      return locationPatchSuccess("Customer location saved successfully", saveCustomerLocation(data));
    }

    if (action === "assignACUnitLocation") {
      return locationPatchSuccess(
        "AC unit branch assigned successfully",
        assignACUnitLocation(data)
      );
    }

    if (action === "addPayment") {
      return locationPatchSuccess("Payment added successfully", addPayment(data));
    }

    if (action === "updateRecord") {
      return locationPatchSuccess("Record updated successfully", updateRecord(data));
    }

    if (action === "checkDuplicateCustomer") {
      return locationPatchSuccess("Duplicate check completed", locationPatchCheckDuplicateCustomer(data));
    }

    if (action === "syncCompanySheet") {
      return locationPatchSuccess("Company sheet synced successfully", syncAllCompanySheetData(data));
    }

    if (action === "sendManualReminder") {
      return locationPatchSuccess("Manual reminder sent successfully", sendManualReminder(data));
    }

    return jsonResponse({ success: false, message: "Invalid POST action: " + action });
  } catch (error) {
    return jsonResponse({ success: false, message: error.message });
  }
}

function saveCustomerLocation(data) {
  if (!data || !locationPatchText(data.Customer_ID)) throw new Error("Customer ID is required.");
  if (!locationPatchText(data.Branch_Name)) throw new Error("Branch name is required.");
  if (!locationPatchText(data.Address)) throw new Error("Branch address is required.");

  var sheet = locationPatchGetSheet(CUSTOMER_LOCATION_PATCH.locationSheet);
  locationPatchEnsureHeaders(sheet, CUSTOMER_LOCATION_PATCH.locationHeaders);
  var locationId = locationPatchText(data.Location_ID);
  var isNew = !locationId;

  if (isNew) locationId = locationPatchNextLocationId(sheet);

  var location = {
    Location_ID: locationId,
    Customer_ID: locationPatchText(data.Customer_ID),
    Branch_Name: locationPatchText(data.Branch_Name),
    Contact_Person: locationPatchText(data.Contact_Person),
    Phone: locationPatchText(data.Phone),
    Address: locationPatchText(data.Address),
    Google_Map_Link: locationPatchText(data.Google_Map_Link || data.Google_Map_Li),
    Is_Default: locationPatchYes(data.Is_Default) ? "Yes" : "No",
    Status: locationPatchText(data.Status) || "Active",
    Notes: locationPatchText(data.Notes),
  };

  if (locationPatchYes(location.Is_Default)) {
    locationPatchClearOtherDefaults(sheet, location.Customer_ID, locationId);
  }

  if (isNew) {
    locationPatchAppendObject(sheet, location);
  } else {
    locationPatchUpdateObject(sheet, "Location_ID", locationId, location);
  }

  return { locationId: locationId, location: location, created: isNew };
}

function assignACUnitLocation(data) {
  var acId = locationPatchText(data && data.AC_ID);
  var customerId = locationPatchText(data && data.Customer_ID);
  var locationId = locationPatchText(data && data.Location_ID);

  if (!acId) throw new Error("AC ID is required.");
  if (!customerId) throw new Error("Customer ID is required.");
  if (!locationId) throw new Error("Location ID is required.");

  var location = locationPatchReadLocations().find(function (item) {
    return (
      locationPatchKey(item.Location_ID) === locationPatchKey(locationId) &&
      locationPatchKey(item.Customer_ID) === locationPatchKey(customerId)
    );
  });

  if (!location) {
    throw new Error("Selected branch does not belong to customer " + customerId + ".");
  }

  var sheet = locationPatchGetSheet("AC_Units");
  locationPatchEnsureHeaders(sheet, ["Location_ID"]);
  var values = sheet.getDataRange().getValues();
  var headers = values[0].map(String);
  var acIdIndex = locationPatchFindHeaderIndex(headers, ["AC_ID", "AC ID", "ACID"]);
  var customerIdIndex = locationPatchFindHeaderIndex(headers, [
    "Customer_ID",
    "Customer ID",
    "CustomerID",
  ]);
  var locationIdIndex = locationPatchFindHeaderIndex(headers, [
    "Location_ID",
    "Location ID",
    "LocationID",
  ]);

  if (acIdIndex === -1 || customerIdIndex === -1 || locationIdIndex === -1) {
    throw new Error("AC_Units requires AC_ID, Customer_ID and Location_ID headers.");
  }

  for (var rowIndex = 1; rowIndex < values.length; rowIndex++) {
    if (locationPatchKey(values[rowIndex][acIdIndex]) !== locationPatchKey(acId)) continue;

    if (locationPatchKey(values[rowIndex][customerIdIndex]) !== locationPatchKey(customerId)) {
      throw new Error("AC unit " + acId + " does not belong to customer " + customerId + ".");
    }

    sheet.getRange(rowIndex + 1, locationIdIndex + 1).setValue(locationId);
    return {
      AC_ID: acId,
      Customer_ID: customerId,
      Location_ID: locationId,
      Branch_Name: location.Branch_Name || "",
    };
  }

  throw new Error("AC unit not found: " + acId);
}

function locationPatchCheckDuplicateCustomer(data) {
  var customerResult = checkDuplicateCustomer(data);
  if (customerResult.exists) return customerResult;

  var phone = syncPatchNormalizePhone(data && data.phone);
  if (!phone) return customerResult;
  var matchingLocation = locationPatchReadLocations().find(function (location) {
    return syncPatchNormalizePhone(location.Phone) === phone;
  });

  if (!matchingLocation) return customerResult;
  var customer = getSheetData("customers").find(function (item) {
    return locationPatchKey(item.Customer_ID) === locationPatchKey(matchingLocation.Customer_ID);
  });

  return { exists: Boolean(customer), customer: customer || null, matchedLocation: matchingLocation };
}

function locationPatchAddInheritedLocations(records, type, suppliedACUnits) {
  var linkedTypes = ["installations", "services", "complaints"];
  if (linkedTypes.indexOf(type) === -1) return records || [];
  var acUnits = suppliedACUnits || getSheetData("acUnits");
  var locationByAC = {};
  acUnits.forEach(function (unit) {
    locationByAC[locationPatchKey(unit.AC_ID)] = unit.Location_ID || "";
  });

  return (records || []).map(function (record) {
    if (record.Location_ID) return record;
    return locationPatchMerge(record, {
      Location_ID: locationByAC[locationPatchKey(record.AC_ID)] || "",
    });
  });
}

function locationPatchUpdateCreatedRecord(type, idColumn, id, locationId) {
  if (!id || !locationId) return;
  updateRecord({
    type: type,
    idColumn: idColumn,
    id: id,
    updatedData: { Location_ID: locationId },
  });
}

function locationPatchFillBlankLocation(sheetName, customerId, acId, locationId) {
  var sheet = locationPatchGetSheet(sheetName);
  var values = sheet.getDataRange().getValues();
  if (values.length < 2) return;
  var headers = values[0].map(String);
  var customerIndex = headers.indexOf("Customer_ID");
  var acIndex = headers.indexOf("AC_ID");
  var locationIndex = headers.indexOf("Location_ID");
  if (locationIndex === -1) return;

  for (var rowIndex = 1; rowIndex < values.length; rowIndex++) {
    if (
      locationPatchKey(values[rowIndex][customerIndex]) === locationPatchKey(customerId) &&
      locationPatchKey(values[rowIndex][acIndex]) === locationPatchKey(acId) &&
      !locationPatchText(values[rowIndex][locationIndex])
    ) {
      sheet.getRange(rowIndex + 1, locationIndex + 1).setValue(locationId);
    }
  }
}

function locationPatchReadLocations() {
  return locationPatchReadObjects(locationPatchGetSheet(CUSTOMER_LOCATION_PATCH.locationSheet));
}

function locationPatchGetSheet(name) {
  var sheet = SpreadsheetApp.openById(CUSTOMER_LOCATION_PATCH.spreadsheetId).getSheetByName(name);
  if (!sheet) throw new Error("Sheet not found: " + name + ". Run setupCustomerLocationsFeature().");
  return sheet;
}

function locationPatchEnsureHeaders(sheet, requiredHeaders) {
  var lastColumn = Math.max(sheet.getLastColumn(), 1);
  var headers = sheet.getRange(1, 1, 1, lastColumn).getValues()[0].map(function (value) {
    return locationPatchText(value);
  });

  requiredHeaders.forEach(function (header) {
    if (headers.indexOf(header) === -1) {
      headers.push(header);
      sheet.getRange(1, headers.length).setValue(header);
    }
  });
}

function locationPatchReadObjects(sheet) {
  var values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];
  var headers = values[0].map(String);
  return values.slice(1).filter(function (row) {
    return row.some(function (value) { return value !== ""; });
  }).map(function (row) {
    var object = {};
    headers.forEach(function (header, index) { object[header] = row[index]; });
    return object;
  });
}

function locationPatchAppendObject(sheet, object) {
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(String);
  sheet.appendRow(headers.map(function (header) { return object[header] !== undefined ? object[header] : ""; }));
}

function locationPatchUpdateObject(sheet, idColumn, id, object) {
  var values = sheet.getDataRange().getValues();
  var headers = values[0].map(String);
  var idIndex = headers.indexOf(idColumn);
  var rowIndex = -1;
  for (var index = 1; index < values.length; index++) {
    if (locationPatchKey(values[index][idIndex]) === locationPatchKey(id)) {
      rowIndex = index + 1;
      break;
    }
  }
  if (rowIndex === -1) throw new Error("Location not found: " + id);
  var row = headers.map(function (header) {
    return object[header] !== undefined ? object[header] : values[rowIndex - 1][headers.indexOf(header)];
  });
  sheet.getRange(rowIndex, 1, 1, headers.length).setValues([row]);
}

function locationPatchClearOtherDefaults(sheet, customerId, currentLocationId) {
  var values = sheet.getDataRange().getValues();
  var headers = values[0].map(String);
  var customerIndex = headers.indexOf("Customer_ID");
  var locationIndex = headers.indexOf("Location_ID");
  var defaultIndex = headers.indexOf("Is_Default");
  for (var index = 1; index < values.length; index++) {
    if (
      locationPatchKey(values[index][customerIndex]) === locationPatchKey(customerId) &&
      locationPatchKey(values[index][locationIndex]) !== locationPatchKey(currentLocationId) &&
      locationPatchYes(values[index][defaultIndex])
    ) {
      sheet.getRange(index + 1, defaultIndex + 1).setValue("No");
    }
  }
}

function locationPatchNextLocationId(sheet) {
  var ids = locationPatchReadObjects(sheet).map(function (location) {
    var match = locationPatchText(location.Location_ID).match(/(\d+)$/);
    return match ? Number(match[1]) : 0;
  });
  var nextNumber = (ids.length ? Math.max.apply(null, ids) : 0) + 1;
  return "LOC" + String(nextNumber).padStart(4, "0");
}

function locationPatchSuccess(message, data) {
  return jsonResponse({ success: true, message: message, data: data });
}

function locationPatchMerge(base, extra) {
  var result = {};
  Object.keys(base || {}).forEach(function (key) { result[key] = base[key]; });
  Object.keys(extra || {}).forEach(function (key) { result[key] = extra[key]; });
  return result;
}

function locationPatchText(value) {
  return value === null || value === undefined ? "" : String(value).trim();
}

function locationPatchKey(value) {
  return locationPatchText(value).toLowerCase();
}

function locationPatchYes(value) {
  return ["yes", "true", "1"].indexOf(locationPatchKey(value)) !== -1;
}
