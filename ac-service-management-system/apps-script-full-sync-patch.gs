/**
 * Full source-sheet sync patch.
 *
 * Paste this block at the END of the Apps Script project. It intentionally
 * overrides doPost(), syncAllCompanySheetData(), and checkDuplicateCustomer().
 *
 * Source flow:
 *   Online AC + Showroom AC -> AC Service Management Database
 */

const SYNC_PATCH_PAYMENT_EVIDENCE_FOLDER_ID = "1vuN1-esqamsbXZTAfRRlTerAHCfvPW2f";

var SYNC_PATCH_CONFIG = {
  systemSpreadsheetId: "1ED6NXaLWpPxK0RJy7f4gIUqbyPNB9LHGIyedbU6VOuE",
  onlineSourceSpreadsheetId: "1hPQxj4XcrbnEp7eirGji8eRbMbjxi4Lb9qiz0BXe-qg",
  showroomSourceSpreadsheetId: "1BHp_irxumTPg2qY9Nz6V6WsRm9DjM_bOOi8-XyDwYoQ",
  sheets: {
    customers: "Customers",
    acUnits: "AC_Units",
    installations: "Installations",
    services: "Services",
    payments: "Payments",
    importLog: "Import_Log",
  },
  onlineSheets: {
    firstYear: "1ST YEAR FREE SERVICE",
    secondYear: "2nd Year",
    thirdYear: "3rd year",
  },
  showroomSheets: {
    firstYear: "AC Service 1st Year",
    secondYear: "2nd year status",
  },
};

function syncPatchHealthCheck() {
  return {
    patchInstalled: true,
    version: "full-sync-selectable-sources-2026-06-13",
    systemSpreadsheetId: SYNC_PATCH_CONFIG.systemSpreadsheetId,
    onlineSourceSpreadsheetId: SYNC_PATCH_CONFIG.onlineSourceSpreadsheetId,
    showroomSourceSpreadsheetId: SYNC_PATCH_CONFIG.showroomSourceSpreadsheetId,
    paymentEvidenceFolderId: SYNC_PATCH_PAYMENT_EVIDENCE_FOLDER_ID,
  };
}

function doGet(e) {
  try {
    const action = e.parameter.action;
    const type = e.parameter.type;
    const customerId = e.parameter.customerId;

    if (action === "syncPatchHealthCheck") {
      return jsonResponse({
        success: true,
        data: syncPatchHealthCheck(),
      });
    }

    if (action === "syncPatchListSourceSheets") {
      return jsonResponse({
        success: true,
        data: syncPatchListSourceSheets(),
      });
    }

    if (action === "getAll") {
      const data = getSheetData(type);

      return jsonResponse({
        success: true,
        data: data,
      });
    }

    if (action === "getDashboard") {
      const dashboardData = getDashboardData();

      return jsonResponse({
        success: true,
        data: dashboardData,
      });
    }

    if (action === "getCustomerProfile") {
      const profile = getCustomerProfile(customerId);

      return jsonResponse({
        success: true,
        data: profile,
      });
    }

    return jsonResponse({
      success: false,
      message: "Invalid action: " + action,
    });
  } catch (error) {
    return jsonResponse({
      success: false,
      message: error.message,
    });
  }
}

function syncPatchListSourceSheets() {
  const onlineSpreadsheet = SpreadsheetApp.openById(
    SYNC_PATCH_CONFIG.onlineSourceSpreadsheetId
  );
  const showroomSpreadsheet = SpreadsheetApp.openById(
    SYNC_PATCH_CONFIG.showroomSourceSpreadsheetId
  );

  return {
    online: onlineSpreadsheet.getSheets().map(function (sheet) {
      return sheet.getName();
    }),
    showroom: showroomSpreadsheet.getSheets().map(function (sheet) {
      return sheet.getName();
    }),
  };
}

function addSale(data) {
  if (!data) {
    throw new Error("Sale data is required.");
  }

  const customerSheet = getSheetByType("customers");
  const acSheet = getSheetByType("acUnits");
  const saleItems = syncPatchGetSaleACItems(data);

  if (saleItems.length === 0) {
    throw new Error("At least one AC model is required.");
  }

  let customerId = data.Customer_ID || "";
  let customerCreated = false;

  if (!customerId) {
    customerId = generateNextId("customers", "Customer_ID", "C");
    customerCreated = true;

    appendObjectToSheet(customerSheet, {
      Customer_ID: customerId,
      Customer_Name: data.Customer_Name || "",
      Phone: data.Phone || "",
      Email: data.Email || "",
      Address: data.Address || "",
      Google_Map_Link: data.Google_Map_Link || "",
      Created_Date: data.Created_Date || new Date(),
      Customer_Source: data.Customer_Source || saleItems[0].Sales_Channel || "",
      Notes: data.Notes || "",
    });
  }

  const acIds = saleItems.map(function (item) {
    const acId = generateNextId("acUnits", "AC_ID", "AC");

    appendObjectToSheet(acSheet, {
      AC_ID: acId,
      Customer_ID: customerId,
      AC_Model: item.AC_Model,
      Serial_Number: item.Serial_Number,
      Quantity: item.Quantity,
      Price: item.Price,
      Purchase_Date: item.Purchase_Date,
      Sales_Channel: item.Sales_Channel,
      Warranty_Start_Date: item.Warranty_Start_Date,
      Warranty_End_Date: item.Warranty_End_Date,
      Warranty_Status: item.Warranty_Status,
      Invoice_Number: item.Invoice_Number,
    });

    return acId;
  });

  return {
    customerId: customerId,
    acId: acIds[0],
    acIds: acIds,
    acCount: acIds.length,
    customerCreated: customerCreated,
  };
}

function syncPatchGetSaleACItems(data) {
  const items = Array.isArray(data.acUnits) ? data.acUnits : [data];

  return items
    .map(function (item) {
      return {
        AC_Model: syncPatchText(item.AC_Model),
        Serial_Number: syncPatchText(item.Serial_Number),
        Quantity: item.Quantity || "1",
        Price: item.Price || "",
        Purchase_Date: item.Purchase_Date || "",
        Sales_Channel: item.Sales_Channel || data.Sales_Channel || "",
        Warranty_Start_Date: item.Warranty_Start_Date || item.Purchase_Date || "",
        Warranty_End_Date: item.Warranty_End_Date || "",
        Warranty_Status: item.Warranty_Status || "Active",
        Invoice_Number: item.Invoice_Number || data.Invoice_Number || "",
      };
    })
    .filter(function (item) {
      return item.AC_Model;
    });
}

function doPost(e) {
  try {
    const requestBody = JSON.parse(e.postData.contents);
    const action = requestBody.action;
    const data = requestBody.data;

    if (action === "addSale") {
      const result = addSale(data);

      return jsonResponse({
        success: true,
        message: "Sale added successfully",
        data: result,
      });
    }

    if (action === "addInstallation") {
      const result = addInstallation(data);

      return jsonResponse({
        success: true,
        message: "Installation added successfully",
        data: result,
      });
    }

    if (action === "addService") {
      const result = addService(data);

      return jsonResponse({
        success: true,
        message: "Service added successfully",
        data: result,
      });
    }

    if (action === "addPayment") {
      const result = addPayment(data);

      return jsonResponse({
        success: true,
        message: "Payment added successfully",
        data: result,
      });
    }

    if (action === "addComplaint") {
      const result = addComplaint(data);

      return jsonResponse({
        success: true,
        message: "Complaint added successfully",
        data: result,
      });
    }

    if (action === "updateRecord") {
      const result = updateRecord(data);

      return jsonResponse({
        success: true,
        message: "Record updated successfully",
        data: result,
      });
    }

    if (action === "checkDuplicateCustomer") {
      const result = checkDuplicateCustomer(data);

      return jsonResponse({
        success: true,
        message: "Duplicate check completed",
        data: result,
      });
    }

    if (action === "syncCompanySheet") {
      const result = syncAllCompanySheetData(data);

      return jsonResponse({
        success: true,
        message: "Company sheet synced successfully",
        data: result,
      });
    }

    if (action === "sendManualReminder") {
      const result = sendManualReminder(data);

      return jsonResponse({
        success: true,
        message: "Manual reminder sent successfully",
        data: result,
      });
    }

    return jsonResponse({
      success: false,
      message: "Invalid POST action: " + action,
    });
  } catch (error) {
    return jsonResponse({
      success: false,
      message: error.message,
    });
  }
}

function checkDuplicateCustomer(data) {
  const phone = syncPatchNormalizePhone(data && data.phone);

  if (!phone) {
    return {
      exists: false,
      customer: null,
    };
  }

  const customerSheet = getSheetByType("customers");
  const customer = syncPatchFindCustomerByPhone(customerSheet, phone);

  return {
    exists: Boolean(customer),
    customer: customer,
  };
}

function syncAllCompanySheetData(options) {
  const context = syncPatchCreateContext();
  const selectedSourceKeys = syncPatchGetSelectedSourceKeys(options);
  const details = [];

  if (selectedSourceKeys.online) {
    details.push(syncPatchImportOnlineFirstYear(context));
    details.push(syncPatchImportOnlineSecondYear(context));
    details.push(syncPatchImportOnlineThirdYear(context));
  }

  if (selectedSourceKeys.showroom) {
    details.push(syncPatchImportShowroomFirstYear(context));
    details.push(syncPatchImportShowroomSecondYear(context));
  }

  return {
    message: "Full source-sheet sync completed.",
    details: details,
    stats: context.stats,
    syncedAt: new Date(),
  };
}

function syncPatchGetSelectedSourceKeys(options) {
  const defaultSelection = {
    online: true,
    showroom: true,
  };

  if (!options) {
    return defaultSelection;
  }

  const selectedKeys = Array.isArray(options.selectedSourceKeys)
    ? options.selectedSourceKeys
    : Array.isArray(options.sourceSheets)
      ? options.sourceSheets.map(function (sheet) {
          return sheet && sheet.key;
        })
      : [];

  if (selectedKeys.length === 0) {
    return defaultSelection;
  }

  return {
    online: selectedKeys.indexOf("online") !== -1,
    showroom: selectedKeys.indexOf("showroom") !== -1,
  };
}

function syncPatchCreateContext() {
  const systemSpreadsheet = SpreadsheetApp.openById(
    SYNC_PATCH_CONFIG.systemSpreadsheetId
  );
  const onlineSpreadsheet = SpreadsheetApp.openById(
    SYNC_PATCH_CONFIG.onlineSourceSpreadsheetId
  );
  const showroomSpreadsheet = SpreadsheetApp.openById(
    SYNC_PATCH_CONFIG.showroomSourceSpreadsheetId
  );

  const context = {
    systemSpreadsheet: systemSpreadsheet,
    onlineSpreadsheet: onlineSpreadsheet,
    showroomSpreadsheet: showroomSpreadsheet,
    sheets: {
      customers: systemSpreadsheet.getSheetByName(SYNC_PATCH_CONFIG.sheets.customers),
      acUnits: systemSpreadsheet.getSheetByName(SYNC_PATCH_CONFIG.sheets.acUnits),
      installations: systemSpreadsheet.getSheetByName(SYNC_PATCH_CONFIG.sheets.installations),
      services: systemSpreadsheet.getSheetByName(SYNC_PATCH_CONFIG.sheets.services),
      payments: systemSpreadsheet.getSheetByName(SYNC_PATCH_CONFIG.sheets.payments),
      importLog: systemSpreadsheet.getSheetByName(SYNC_PATCH_CONFIG.sheets.importLog),
    },
    stats: {
      customersCreated: 0,
      customersReused: 0,
      acUnitsCreated: 0,
      acUnitsReused: 0,
      installationsCreated: 0,
      installationsReused: 0,
      servicesCreated: 0,
      servicesReused: 0,
      paymentsCreated: 0,
      paymentsReused: 0,
      sourceRowsRead: 0,
      sourceRowsImported: 0,
      sourceRowsSkipped: 0,
      reviewRows: 0,
    },
  };

  syncPatchRequireSheet(context.sheets.customers, SYNC_PATCH_CONFIG.sheets.customers);
  syncPatchRequireSheet(context.sheets.acUnits, SYNC_PATCH_CONFIG.sheets.acUnits);
  syncPatchRequireSheet(context.sheets.installations, SYNC_PATCH_CONFIG.sheets.installations);
  syncPatchRequireSheet(context.sheets.services, SYNC_PATCH_CONFIG.sheets.services);
  syncPatchRequireSheet(context.sheets.payments, SYNC_PATCH_CONFIG.sheets.payments);
  syncPatchRequireSheet(context.sheets.importLog, SYNC_PATCH_CONFIG.sheets.importLog);
  syncPatchEnsureImportLogHeaders(context.sheets.importLog);

  context.indexes = syncPatchBuildIndexes(context.sheets);

  return context;
}

function syncPatchRequireSheet(sheet, name) {
  if (!sheet) {
    throw new Error("Required sheet not found: " + name);
  }
}

function syncPatchEnsureImportLogHeaders(logSheet) {
  if (logSheet.getLastRow() > 0) return;

  logSheet.appendRow([
    "Log_ID",
    "Source_Sheet",
    "Source_Row",
    "Action",
    "Status",
    "Customer_ID",
    "AC_ID",
    "Message",
    "Imported_Date",
  ]);
}

function syncPatchBuildIndexes(sheets) {
  const customers = syncPatchReadSheetObjects(sheets.customers);
  const acUnits = syncPatchReadSheetObjects(sheets.acUnits);
  const installations = syncPatchReadSheetObjects(sheets.installations);
  const services = syncPatchReadSheetObjects(sheets.services);
  const payments = syncPatchReadSheetObjects(sheets.payments);

  const indexes = {
    customersByPhone: {},
    customersByNameAddress: {},
    acByInvoice: {},
    acBySerial: {},
    acByCustomerModelDate: {},
    installationsByAcDate: {},
    servicesByAcYearNo: {},
    paymentsByAcYearTypeNote: {},
  };

  customers.forEach(function (customer) {
    const phone = syncPatchNormalizePhone(customer.Phone);
    if (phone) indexes.customersByPhone[phone] = customer;

    const nameAddressKey = syncPatchKey(customer.Customer_Name, customer.Address);
    if (nameAddressKey) indexes.customersByNameAddress[nameAddressKey] = customer;
  });

  acUnits.forEach(function (unit) {
    const invoice = syncPatchText(unit.Invoice_Number);
    const serial = syncPatchText(unit.Serial_Number);

    if (invoice) indexes.acByInvoice[invoice.toLowerCase()] = unit;
    if (serial) indexes.acBySerial[serial.toLowerCase()] = unit;

    indexes.acByCustomerModelDate[
      syncPatchKey(unit.Customer_ID, unit.AC_Model, syncPatchDateKey(unit.Purchase_Date))
    ] = unit;
  });

  installations.forEach(function (installation) {
    indexes.installationsByAcDate[
      syncPatchKey(installation.AC_ID, syncPatchDateKey(installation.Installation_Date))
    ] = installation;
  });

  services.forEach(function (service) {
    indexes.servicesByAcYearNo[
      syncPatchKey(service.AC_ID, service.Service_Year, service.Service_No)
    ] = service;
  });

  payments.forEach(function (payment) {
    indexes.paymentsByAcYearTypeNote[
      syncPatchPaymentKey(
        payment.AC_ID,
        payment.Payment_Year,
        payment.Payment_Type,
        payment.Notes
      )
    ] = payment;
  });

  return indexes;
}

function syncPatchReadSheetObjects(sheet) {
  const values = sheet.getDataRange().getValues();

  if (values.length < 2) return [];

  const headers = values[0].map(function (header) {
    return syncPatchText(header);
  });

  return values.slice(1)
    .filter(function (row) {
      return row.some(function (cell) {
        return cell !== "" && cell !== null;
      });
    })
    .map(function (row) {
      const item = {};

      headers.forEach(function (header, index) {
        if (header) item[header] = row[index];
      });

      return item;
    });
}

function syncPatchImportOnlineFirstYear(context) {
  const sourceSheet = syncPatchGetSourceSheet(
    context.onlineSpreadsheet,
    SYNC_PATCH_CONFIG.onlineSheets.firstYear
  );
  const values = sourceSheet.getDataRange().getValues();
  let imported = 0;
  let skipped = 0;

  for (let rowIndex = 2; rowIndex < values.length; rowIndex++) {
    const row = values[rowIndex];
    const sourceRow = rowIndex + 1;

    if (!syncPatchHasAny(row, [1, 2, 3, 6, 7, 8])) {
      skipped += syncPatchSkipEmpty(context, SYNC_PATCH_CONFIG.onlineSheets.firstYear, sourceRow);
      continue;
    }

    syncPatchImportRecord(context, {
      sourceSheet: SYNC_PATCH_CONFIG.onlineSheets.firstYear,
      sourceRow: sourceRow,
      sourceSystem: "Online",
      salesChannel: "Online",
      customerName: row[1],
      address: row[2],
      phone: row[3],
      invoiceNumber: row[6],
      acModel: row[7],
      serialNumber: row[8],
      quantity: 1,
      price: row[10],
      purchaseDate: row[5],
      installationDate: row[5],
      technicianName: row[9],
      notes: syncPatchJoinNotes([
        "Online first year source.",
        syncPatchLabel("No", row[0]),
        syncPatchLabel("ILU", row[4]),
        syncPatchLabel("Called Date", row[23]),
        syncPatchLabel("Customer Feedback", row[24]),
        syncPatchLabel("Status", row[25]),
        syncPatchLabel("Description", row[28]),
      ]),
      services: [
        syncPatchService("Year 1", "1", "Free", row[11], row[12], row[13], row[14]),
        syncPatchService("Year 1", "2", "Free", row[15], row[16], row[17], row[18]),
        syncPatchService("Year 1", "3", "Free", row[19], row[20], row[21], row[22]),
      ],
    });
    imported++;
  }

  return syncPatchSummary("Online 1st Year", imported, skipped);
}

function syncPatchImportOnlineSecondYear(context) {
  const sourceSheet = syncPatchGetSourceSheet(
    context.onlineSpreadsheet,
    SYNC_PATCH_CONFIG.onlineSheets.secondYear
  );
  const values = sourceSheet.getDataRange().getValues();
  let imported = 0;
  let skipped = 0;

  for (let rowIndex = 2; rowIndex < values.length; rowIndex++) {
    const row = values[rowIndex];
    const sourceRow = rowIndex + 1;

    if (!syncPatchHasAny(row, [1, 2, 5, 6, 7, 10, 11, 12, 16, 20])) {
      skipped += syncPatchSkipEmpty(context, SYNC_PATCH_CONFIG.onlineSheets.secondYear, sourceRow);
      continue;
    }

    syncPatchImportRecord(context, {
      sourceSheet: SYNC_PATCH_CONFIG.onlineSheets.secondYear,
      sourceRow: sourceRow,
      sourceSystem: "Online",
      salesChannel: "Online",
      customerName: row[5],
      address: row[6],
      phone: row[7],
      invoiceNumber: row[1],
      acModel: row[2],
      serialNumber: "",
      quantity: 1,
      price: "",
      purchaseDate: row[0],
      installationDate: row[0],
      technicianName: row[4],
      notes: syncPatchJoinNotes([
        "Online second year source.",
        syncPatchLabel("Previous Year 1 Service Date", row[3]),
        syncPatchLabel("Description", row[8]),
        syncPatchLabel("Status", row[9]),
      ]),
      services: [
        syncPatchService("Year 2", "1", "Paid", row[12], row[13], row[15], ""),
        syncPatchService("Year 2", "2", "Paid", row[16], row[17], row[19], ""),
        syncPatchService("Year 2", "3", "Paid", row[20], row[21], row[23], ""),
      ],
      payments: [
        syncPatchPayment("Year 2", "Annual Service", row[11], row[10], "Online Year 2 annual payment."),
      ],
    });
    imported++;
  }

  return syncPatchSummary("Online 2nd Year", imported, skipped);
}

function syncPatchImportOnlineThirdYear(context) {
  const sourceSheet = syncPatchGetSourceSheet(
    context.onlineSpreadsheet,
    SYNC_PATCH_CONFIG.onlineSheets.thirdYear
  );
  const values = sourceSheet.getDataRange().getValues();
  let imported = 0;
  let skipped = 0;

  for (let rowIndex = 2; rowIndex < values.length; rowIndex++) {
    const row = values[rowIndex];
    const sourceRow = rowIndex + 1;

    if (!syncPatchHasAny(row, [1, 2, 5, 6, 7, 9, 10, 11, 15, 19])) {
      skipped += syncPatchSkipEmpty(context, SYNC_PATCH_CONFIG.onlineSheets.thirdYear, sourceRow);
      continue;
    }

    syncPatchImportRecord(context, {
      sourceSheet: SYNC_PATCH_CONFIG.onlineSheets.thirdYear,
      sourceRow: sourceRow,
      sourceSystem: "Online",
      salesChannel: "Online",
      customerName: row[5],
      address: row[6],
      phone: row[7],
      invoiceNumber: row[1],
      acModel: row[2],
      serialNumber: "",
      quantity: 1,
      price: "",
      purchaseDate: row[0],
      installationDate: row[0],
      technicianName: row[4],
      notes: syncPatchJoinNotes([
        "Online third year source.",
        syncPatchLabel("Previous Year 2 Service Date", row[3]),
        syncPatchLabel("Description", row[8]),
      ]),
      services: [
        syncPatchService("Year 3", "1", "Paid", row[11], row[12], row[14], ""),
        syncPatchService("Year 3", "2", "Paid", row[15], row[16], row[18], ""),
        syncPatchService("Year 3", "3", "Paid", row[19], row[20], row[22], ""),
      ],
      payments: [
        syncPatchPayment("Year 3", "Annual Service", row[10], row[9], "Online Year 3 annual payment."),
      ],
    });
    imported++;
  }

  return syncPatchSummary("Online 3rd Year", imported, skipped);
}

function syncPatchImportShowroomFirstYear(context) {
  const sourceSheet = syncPatchGetSourceSheet(
    context.showroomSpreadsheet,
    SYNC_PATCH_CONFIG.showroomSheets.firstYear
  );
  const values = sourceSheet.getDataRange().getValues();
  let imported = 0;
  let skipped = 0;

  for (let rowIndex = 2; rowIndex < values.length; rowIndex++) {
    const row = values[rowIndex];
    const sourceRow = rowIndex + 1;

    if (!syncPatchHasAny(row, [0, 1, 2, 3, 4, 6, 8, 12, 16, 21, 25, 28])) {
      skipped += syncPatchSkipEmpty(context, SYNC_PATCH_CONFIG.showroomSheets.firstYear, sourceRow);
      continue;
    }

    syncPatchImportRecord(context, {
      sourceSheet: SYNC_PATCH_CONFIG.showroomSheets.firstYear,
      sourceRow: sourceRow,
      sourceSystem: "Showroom",
      salesChannel: "Showroom",
      customerName: row[0],
      address: row[1],
      phone: row[2],
      invoiceNumber: row[3],
      acModel: row[4],
      serialNumber: "",
      quantity: row[7] || 1,
      price: "",
      purchaseDate: row[6],
      installationDate: row[6],
      technicianName: row[5],
      notes: syncPatchJoinNotes([
        "Showroom first year source.",
        syncPatchLabel("Description", row[20]),
      ]),
      services: [
        syncPatchService("Year 1", "1", "Free", row[8], row[9], row[10], row[11]),
        syncPatchService("Year 1", "2", "Free", row[12], row[13], row[14], row[15]),
        syncPatchService("Year 1", "3", "Free", row[16], row[17], row[18], row[19]),
        syncPatchService("Year 2", "1", "Paid", row[21], row[22], row[24], row[23]),
        syncPatchService("Year 2", "2", "Paid", row[25], row[26], row[27], ""),
        syncPatchService("Year 2", "3", "Paid", row[28], row[29], row[30], ""),
      ],
    });
    imported++;
  }

  return syncPatchSummary("Showroom 1st Year", imported, skipped);
}

function syncPatchImportShowroomSecondYear(context) {
  const sourceSheet = syncPatchGetSourceSheet(
    context.showroomSpreadsheet,
    SYNC_PATCH_CONFIG.showroomSheets.secondYear
  );
  const values = sourceSheet.getDataRange().getValues();
  let imported = 0;
  let skipped = 0;

  for (let rowIndex = 2; rowIndex < values.length; rowIndex++) {
    const row = values[rowIndex];
    const sourceRow = rowIndex + 1;

    if (!syncPatchHasAny(row, [0, 1, 2, 3, 4, 6, 8, 10, 12, 14, 15, 16, 20, 24])) {
      skipped += syncPatchSkipEmpty(context, SYNC_PATCH_CONFIG.showroomSheets.secondYear, sourceRow);
      continue;
    }

    syncPatchImportRecord(context, {
      sourceSheet: SYNC_PATCH_CONFIG.showroomSheets.secondYear,
      sourceRow: sourceRow,
      sourceSystem: "Showroom",
      salesChannel: "Showroom",
      customerName: row[0],
      address: row[1],
      phone: row[2],
      invoiceNumber: row[3],
      acModel: row[4],
      serialNumber: "",
      quantity: row[7] || 1,
      price: "",
      purchaseDate: row[6],
      installationDate: row[6],
      technicianName: row[5],
      notes: syncPatchJoinNotes([
        "Showroom second year source.",
        syncPatchLabel("Description", row[28]),
      ]),
      services: [
        syncPatchService("Year 1", "1", "Free", row[8], row[9], "", ""),
        syncPatchService("Year 1", "2", "Free", row[10], row[11], "", ""),
        syncPatchService("Year 1", "3", "Free", row[12], row[13], "", ""),
        syncPatchService("Year 2", "1", "Paid", row[16], row[17], row[18], row[19]),
        syncPatchService("Year 2", "2", "Paid", row[20], row[21], row[22], row[23]),
        syncPatchService("Year 2", "3", "Paid", row[24], row[25], row[26], row[27]),
      ],
      payments: [
        syncPatchPayment("Year 2", "Annual Service", row[14], row[15], "Showroom Year 2 annual payment."),
      ],
    });
    imported++;
  }

  return syncPatchSummary("Showroom 2nd Year", imported, skipped);
}

function syncPatchImportRecord(context, record) {
  context.stats.sourceRowsRead++;

  const customer = syncPatchFindOrCreateCustomer(context, record);
  const acUnit = syncPatchFindOrCreateACUnit(context, record, customer.Customer_ID);

  syncPatchFindOrCreateInstallation(context, record, customer.Customer_ID, acUnit.AC_ID);

  (record.services || []).forEach(function (service) {
    syncPatchFindOrCreateService(context, record, service, customer.Customer_ID, acUnit.AC_ID);
  });

  (record.payments || []).forEach(function (payment) {
    syncPatchFindOrCreatePayment(context, record, payment, customer.Customer_ID, acUnit.AC_ID);
  });

  context.stats.sourceRowsImported++;

  syncPatchWriteLog(
    context,
    record.sourceSheet,
    record.sourceRow,
    "Full Sync",
    "Imported",
    customer.Customer_ID,
    acUnit.AC_ID,
    "Imported/reused customer, AC, installation, services, and payments from " +
      record.sourceSystem +
      "."
  );
}

function syncPatchFindOrCreateCustomer(context, record) {
  const phone = syncPatchNormalizePhone(record.phone);
  const name = syncPatchText(record.customerName) ||
    "Unknown Customer " + record.sourceSystem + " Row " + record.sourceRow;
  const address = syncPatchText(record.address);

  if (phone && context.indexes.customersByPhone[phone]) {
    context.stats.customersReused++;
    return context.indexes.customersByPhone[phone];
  }

  const nameAddressKey = syncPatchKey(name, address);
  if (!phone && context.indexes.customersByNameAddress[nameAddressKey]) {
    context.stats.customersReused++;
    return context.indexes.customersByNameAddress[nameAddressKey];
  }

  const customerId = generateNextId("customers", "Customer_ID", "C");
  const customer = {
    Customer_ID: customerId,
    Customer_Name: name,
    Phone: syncPatchText(record.phone),
    Email: "",
    Address: address,
    Google_Map_Link: "",
    Created_Date: record.purchaseDate || record.installationDate || new Date(),
    Customer_Source: record.sourceSystem,
    Notes: record.notes || "",
  };

  appendObjectToSheet(context.sheets.customers, customer);

  context.indexes.customersByNameAddress[nameAddressKey] = customer;
  if (phone) context.indexes.customersByPhone[phone] = customer;
  context.stats.customersCreated++;

  return customer;
}

function syncPatchFindOrCreateACUnit(context, record, customerId) {
  const invoiceNumber = syncPatchText(record.invoiceNumber);
  const serialNumber = syncPatchText(record.serialNumber);
  const acModel = syncPatchText(record.acModel) ||
    "Unknown AC " + record.sourceSystem + " Row " + record.sourceRow;

  if (invoiceNumber && context.indexes.acByInvoice[invoiceNumber.toLowerCase()]) {
    context.stats.acUnitsReused++;
    return context.indexes.acByInvoice[invoiceNumber.toLowerCase()];
  }

  if (serialNumber && context.indexes.acBySerial[serialNumber.toLowerCase()]) {
    context.stats.acUnitsReused++;
    return context.indexes.acBySerial[serialNumber.toLowerCase()];
  }

  const modelDateKey = syncPatchKey(customerId, acModel, syncPatchDateKey(record.purchaseDate));
  if (!invoiceNumber && !serialNumber && context.indexes.acByCustomerModelDate[modelDateKey]) {
    context.stats.acUnitsReused++;
    return context.indexes.acByCustomerModelDate[modelDateKey];
  }

  const acId = generateNextId("acUnits", "AC_ID", "AC");
  const startDate = record.purchaseDate || record.installationDate || "";
  const acUnit = {
    AC_ID: acId,
    Customer_ID: customerId,
    AC_Model: acModel,
    Serial_Number: serialNumber,
    Quantity: record.quantity || "1",
    Price: record.price || "",
    Purchase_Date: record.purchaseDate || "",
    Sales_Channel: record.salesChannel,
    Warranty_Start_Date: startDate,
    Warranty_End_Date: syncPatchAddYear(startDate),
    Warranty_Status: syncPatchIsDiscontinued(record.notes) ? "Cancelled" : "Active",
    Invoice_Number: invoiceNumber,
  };

  appendObjectToSheet(context.sheets.acUnits, acUnit);

  if (invoiceNumber) context.indexes.acByInvoice[invoiceNumber.toLowerCase()] = acUnit;
  if (serialNumber) context.indexes.acBySerial[serialNumber.toLowerCase()] = acUnit;
  context.indexes.acByCustomerModelDate[modelDateKey] = acUnit;
  context.stats.acUnitsCreated++;

  return acUnit;
}

function syncPatchFindOrCreateInstallation(context, record, customerId, acId) {
  if (!record.installationDate && !record.technicianName) return null;

  const key = syncPatchKey(acId, syncPatchDateKey(record.installationDate));

  if (context.indexes.installationsByAcDate[key]) {
    context.stats.installationsReused++;
    return context.indexes.installationsByAcDate[key];
  }

  const installationId = generateNextId("installations", "Installation_ID", "INS");
  const installation = {
    Installation_ID: installationId,
    Customer_ID: customerId,
    AC_ID: acId,
    Installation_Date: record.installationDate || "",
    Installation_Type: "In-house",
    Technician_Name: record.technicianName || "",
    Technician_type: "In-house",
    Outsource_Payment: "",
    Installation_Payment_Date: "",
    Installation_Status: record.installationDate ? "Completed" : "Pending",
    Notes: record.notes || "",
    Auto_Service_Generated: "Imported",
    Free_Service_Count: "3",
  };

  appendObjectToSheet(context.sheets.installations, installation);

  context.indexes.installationsByAcDate[key] = installation;
  context.stats.installationsCreated++;

  return installation;
}

function syncPatchFindOrCreateService(context, record, service, customerId, acId) {
  if (!syncPatchHasServiceData(service)) return null;

  const key = syncPatchKey(acId, service.year, service.no);

  if (context.indexes.servicesByAcYearNo[key]) {
    context.stats.servicesReused++;
    syncPatchFindOrCreatePaymentFromService(context, record, service, customerId, acId);
    return context.indexes.servicesByAcYearNo[key];
  }

  const serviceId = generateNextId("services", "Service_ID", "SER");
  const serviceStatus = syncPatchServiceCompleted(service) ? "Completed" : "Pending";
  const serviceRecord = {
    Service_ID: serviceId,
    Customer_ID: customerId,
    AC_ID: acId,
    Service_Date: service.date || service.paymentDate || "",
    Service_Year: service.year,
    Service_No: service.no,
    Service_Type: service.type,
    Service_Category: "Normal",
    Technician_Name: service.technician || "",
    Technician_Type: "In-house",
    Technician_Payment: "",
    Service_Status: serviceStatus,
    Service_Completed_Date: serviceStatus === "Completed" ? service.date || service.paymentDate || "" : "",
    Payment_Required: service.paymentAmount ? "Yes" : "No",
    Notes: syncPatchJoinNotes([
      "Imported from " + record.sourceSystem + " " + record.sourceSheet + ".",
      syncPatchLabel("Source row", record.sourceRow),
      syncPatchLabel("Service payment", service.paymentAmount),
      syncPatchLabel("Payment date", service.paymentDate),
    ]),
    Reminder_Status: "",
    Reminder_Sent_Date: "",
  };

  appendObjectToSheet(context.sheets.services, serviceRecord);

  context.indexes.servicesByAcYearNo[key] = serviceRecord;
  context.stats.servicesCreated++;

  syncPatchFindOrCreatePaymentFromService(context, record, service, customerId, acId);

  return serviceRecord;
}

function syncPatchFindOrCreatePaymentFromService(context, record, service, customerId, acId) {
  if (!service.paymentAmount && !service.paymentDate) return null;

  return syncPatchFindOrCreatePayment(
    context,
    record,
    syncPatchPayment(
      service.year,
      "Service Payment",
      service.paymentDate,
      service.paymentAmount,
      "Service No " + service.no + " payment from source sheet."
    ),
    customerId,
    acId
  );
}

function syncPatchFindOrCreatePayment(context, record, payment, customerId, acId) {
  if (!payment || (!payment.amount && !payment.date)) return null;

  const note = syncPatchJoinNotes([
    payment.note,
    "Imported from " + record.sourceSystem + " " + record.sourceSheet + ".",
    syncPatchLabel("Source row", record.sourceRow),
  ]);
  const key = syncPatchPaymentKey(acId, payment.year, payment.type, note);

  if (context.indexes.paymentsByAcYearTypeNote[key]) {
    context.stats.paymentsReused++;
    return context.indexes.paymentsByAcYearTypeNote[key];
  }

  const paymentId = generateNextId("payments", "Payment_ID", "PAY");
  const paymentRecord = {
    Payment_ID: paymentId,
    Customer_ID: customerId,
    AC_ID: acId,
    Payment_Year: payment.year,
    Payment_Date: payment.date || "",
    Amount: payment.amount || "",
    Payment_Type: payment.type,
    Payment_Status: payment.date || payment.amount ? "Paid" : "Pending",
    Due_Date: payment.date || "",
    Notes: note,
    Reminder_Status: "",
    Reminder_Sent_Date: "",
    Annual_Service_Count: "3",
    Service_Generated: "",
    Payment_Evidence: "",
  };

  appendObjectToSheet(context.sheets.payments, paymentRecord);

  context.indexes.paymentsByAcYearTypeNote[key] = paymentRecord;
  context.stats.paymentsCreated++;

  return paymentRecord;
}

function syncPatchGetSourceSheet(spreadsheet, sheetName) {
  const exactSheet = spreadsheet.getSheetByName(sheetName);

  if (exactSheet) {
    return exactSheet;
  }

  const expectedName = syncPatchNormalizeSheetName(sheetName);
  const sheets = spreadsheet.getSheets();

  for (let i = 0; i < sheets.length; i++) {
    if (syncPatchNormalizeSheetName(sheets[i].getName()) === expectedName) {
      return sheets[i];
    }
  }

  const availableNames = sheets.map(function (sheet) {
    return '"' + sheet.getName() + '"';
  }).join(", ");

  throw new Error(
    "Source sheet not found: " +
      sheetName +
      ". Available sheets: " +
      availableNames
  );
}

function getOrCreatePaymentEvidenceFolder() {
  return DriveApp.getFolderById(SYNC_PATCH_PAYMENT_EVIDENCE_FOLDER_ID);
}

function syncPatchSkipEmpty(context, sourceSheet, sourceRow) {
  context.stats.sourceRowsRead++;
  context.stats.sourceRowsSkipped++;

  syncPatchWriteLog(
    context,
    sourceSheet,
    sourceRow,
    "Full Sync",
    "Skipped",
    "",
    "",
    "Empty source row skipped."
  );

  return 1;
}

function syncPatchWriteLog(context, sourceSheet, sourceRow, action, status, customerId, acId, message) {
  writeImportLog(
    context.sheets.importLog,
    sourceSheet,
    sourceRow,
    action,
    status,
    customerId,
    acId,
    message,
    new Date()
  );
}

function syncPatchFindCustomerByPhone(customerSheet, normalizedPhone) {
  const customers = syncPatchReadSheetObjects(customerSheet);

  for (let i = 0; i < customers.length; i++) {
    if (syncPatchNormalizePhone(customers[i].Phone) === normalizedPhone) {
      return customers[i];
    }
  }

  return null;
}

function syncPatchService(year, no, type, date, technician, paymentAmount, paymentDate) {
  return {
    year: year,
    no: String(no),
    type: type,
    date: date || "",
    technician: syncPatchText(technician),
    paymentAmount: paymentAmount || "",
    paymentDate: paymentDate || "",
  };
}

function syncPatchPayment(year, type, date, amount, note) {
  return {
    year: year,
    type: type,
    date: date || "",
    amount: amount || "",
    note: note || "",
  };
}

function syncPatchHasServiceData(service) {
  return Boolean(
    service &&
      (service.date || service.technician || service.paymentAmount || service.paymentDate)
  );
}

function syncPatchServiceCompleted(service) {
  return Boolean(service.technician || service.paymentDate || syncPatchPaymentLooksDone(service.paymentAmount));
}

function syncPatchPaymentLooksDone(value) {
  const text = syncPatchText(value).toLowerCase();

  return Boolean(
    text &&
      text !== "-" &&
      (text === "done" ||
        text === "paid" ||
        text.indexOf("done") !== -1 ||
        text.indexOf("paid") !== -1 ||
        !Number.isNaN(Number(text)))
  );
}

function syncPatchHasAny(row, indexes) {
  return indexes.some(function (index) {
    return syncPatchText(row[index]) !== "";
  });
}

function syncPatchText(value) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function syncPatchNormalizeSheetName(value) {
  return syncPatchText(value).replace(/\s+/g, " ").toLowerCase();
}

function syncPatchNormalizePhone(value) {
  const text = syncPatchText(value);

  if (!text) return "";

  if (/[eE]/.test(text) && !Number.isNaN(Number(text))) {
    const numericPhone = String(Math.trunc(Number(text)));
    return numericPhone.length > 9 ? numericPhone.slice(-9) : numericPhone.replace(/^0+/, "");
  }

  const candidates = text.match(/\d{7,12}/g) || [];
  const digits = candidates.length > 0 ? candidates[0] : text.replace(/\D/g, "");

  if (!digits) return "";

  if (digits.length > 9) {
    return digits.slice(-9);
  }

  if (digits.length === 9 && digits.charAt(0) === "7") {
    return digits;
  }

  return digits.replace(/^0+/, "");
}

function syncPatchKey() {
  const parts = Array.prototype.slice.call(arguments).map(function (value) {
    return syncPatchText(value).toLowerCase();
  });

  return parts.join("|");
}

function syncPatchPaymentKey(acId, year, type, note) {
  return syncPatchKey(acId, year, type, note);
}

function syncPatchDateKey(value) {
  if (!value) return "";

  if (Object.prototype.toString.call(value) === "[object Date]" && !Number.isNaN(value.getTime())) {
    return Utilities.formatDate(value, Session.getScriptTimeZone(), "yyyy-MM-dd");
  }

  return syncPatchText(value);
}

function syncPatchAddYear(value) {
  if (!value || Object.prototype.toString.call(value) !== "[object Date]") {
    return "";
  }

  const date = new Date(value.getTime());
  date.setFullYear(date.getFullYear() + 1);
  return date;
}

function syncPatchJoinNotes(parts) {
  return parts
    .map(function (part) {
      return syncPatchText(part);
    })
    .filter(function (part) {
      return part;
    })
    .join(" | ");
}

function syncPatchLabel(label, value) {
  const text = syncPatchText(value);
  return text ? label + ": " + text : "";
}

function syncPatchIsDiscontinued(value) {
  const text = syncPatchText(value).toLowerCase();
  return (
    text.indexOf("discontinued") !== -1 ||
    text.indexOf("disagreed") !== -1 ||
    text.indexOf("not responded") !== -1 ||
    text.indexOf("cancel") !== -1
  );
}

function syncPatchSummary(label, imported, skipped) {
  return label + " sync completed. Imported rows: " + imported + ", skipped empty rows: " + skipped + ".";
}
