/**
 * ============================================================
 *  ByziStumbler API — Google Apps Script
 * ============================================================
 *  Deploy: Web app → Execute as: Me → Who has access: Anyone
 *
 *  SETUP SCRIPT PROPERTIES (penting!):
 *  1. Di editor Apps Script → ikon gear (Project Settings)
 *  2. Scroll ke "Script properties" → Add script property
 *     Key  : ADMIN_PASSWORD
 *     Value: Bismillaah
 *  ATAU jalankan fungsi setupScriptProperties() sekali dari editor.
 *
 *  Password TIDAK pernah disimpan di frontend / GitHub Pages.
 * ============================================================
 */

var SHEET_PRODUCTS  = "Products";
var SHEET_ORDERS    = "Orders";
var SHEET_INQUIRIES = "Inquiries";

/* ========== ENTRY ========== */

function doGet(e) {
  return handleRequest_(e);
}

function doPost(e) {
  return handleRequest_(e);
}

function handleRequest_(e) {
  try {
    var body = parseBody_(e);
    var action = (body && body.action) || (e.parameter && e.parameter.action) || "getProducts";

    var publicActions = ["getProducts", "createOrder", "createInquiry"];
    var isPublic = publicActions.indexOf(action) !== -1;

    if (!isPublic) {
      var auth = checkAdmin_(body);
      if (!auth.ok) {
        return json_({ success: false, message: auth.message || "Unauthorized", code: 401 });
      }
    }

    var result;
    switch (action) {
      case "getProducts":   result = getProducts_(); break;
      case "createOrder":   result = createOrder_(body); break;
      case "createInquiry": result = createInquiry_(body); break;

      case "adminLogin":    result = adminLogin_(body); break;

      case "adminGetProducts":    result = getProducts_(); break;
      case "adminCreateProduct":  result = adminCreateProduct_(body); break;
      case "adminUpdateProduct":  result = adminUpdateProduct_(body); break;
      case "adminDeleteProduct":  result = adminDeleteProduct_(body); break;

      case "adminGetOrders":     result = adminGetOrders_(); break;
      case "adminUpdateOrder":   result = adminUpdateOrder_(body); break;
      case "adminDeleteOrder":   result = adminDeleteOrder_(body); break;

      case "adminGetInquiries":   result = adminGetInquiries_(); break;
      case "adminUpdateInquiry":  result = adminUpdateInquiry_(body); break;
      case "adminDeleteInquiry":  result = adminDeleteInquiry_(body); break;

      case "adminGetStats": result = adminGetStats_(); break;

      default:
        result = { success: false, message: "Unknown action: " + action };
    }

    return json_(result);
  } catch (err) {
    return json_({ success: false, message: String(err) });
  }
}

/* ========== AUTH (Script Properties) ========== */

function getAdminPassword_() {
  var props = PropertiesService.getScriptProperties();
  var pwd = props.getProperty("ADMIN_PASSWORD");
  if (!pwd) {
    props.setProperty("ADMIN_PASSWORD", "Bismillaah");
    pwd = "Bismillaah";
  }
  return pwd;
}

function checkAdmin_(body) {
  if (!body || !body.password) {
    return { ok: false, message: "Password admin diperlukan" };
  }
  var stored = getAdminPassword_();
  if (String(body.password) !== String(stored)) {
    return { ok: false, message: "Password salah" };
  }
  return { ok: true };
}

function adminLogin_(body) {
  var auth = checkAdmin_(body);
  if (!auth.ok) return { success: false, message: auth.message };
  return { success: true, message: "Login berhasil" };
}

/* ========== PUBLIC: PRODUCTS ========== */

function getProducts_() {
  var sheet = getSheet_(SHEET_PRODUCTS);
  ensureProductsHeader_(sheet);
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return { success: true, data: [] };

  var headers = data[0].map(function (h) { return String(h).toLowerCase().trim(); });
  var products = [];

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (!row[0] && row[0] !== 0) continue;

    var p = {};
    headers.forEach(function (h, idx) { p[h] = row[idx]; });

    products.push({
      id:          p.id,
      name:        p.name || "",
      slug:        p.slug || "",
      price:       Number(p.price) || 0,
      stock:       Number(p.stock) || 0,
      status:      p.status || "available",
      image_url:   p.image_url || "",
      description: p.description || "",
      color:       p.color || "",
      sort:        Number(p.sort) || i,
      row:         i + 1
    });
  }

  products.sort(function (a, b) { return a.sort - b.sort; });
  return { success: true, data: products };
}

/* ========== PUBLIC: CREATE ORDER ========== */

function createOrder_(body) {
  if (!body) return { success: false, message: "Body kosong" };

  var required = ["nama", "whatsapp", "product_name", "qty"];
  for (var i = 0; i < required.length; i++) {
    if (!body[required[i]] && body[required[i]] !== 0) {
      return { success: false, message: "Field wajib: " + required[i] };
    }
  }

  var orderSheet = getSheet_(SHEET_ORDERS);
  ensureOrdersHeader_(orderSheet);
  var productSheet = getSheet_(SHEET_PRODUCTS);

  var now = new Date();
  var dateStr = Utilities.formatDate(now, "Asia/Jakarta", "yyyyMMdd");
  var lastRow = Math.max(orderSheet.getLastRow(), 1);
  var seq = String(lastRow).padStart(4, "0");
  var orderId = "BZ-" + dateStr + "-" + seq;
  var timestamp = Utilities.formatDate(now, "Asia/Jakarta", "yyyy-MM-dd HH:mm:ss");
  var qty = Number(body.qty) || 1;
  var price = Number(body.price) || 0;
  var total = price * qty;

  if (body.product_id) {
    var productData = productSheet.getDataRange().getValues();
    var headers = productData[0].map(function (h) { return String(h).toLowerCase().trim(); });
    var idCol = headers.indexOf("id");
    var stockCol = headers.indexOf("stock");
    var statusCol = headers.indexOf("status");

    if (idCol >= 0 && stockCol >= 0) {
      for (var r = 1; r < productData.length; r++) {
        if (String(productData[r][idCol]) === String(body.product_id)) {
          var currentStock = Number(productData[r][stockCol]);
          if (currentStock < qty) {
            return { success: false, message: "Stok tidak cukup. Sisa: " + currentStock };
          }
          productSheet.getRange(r + 1, stockCol + 1).setValue(currentStock - qty);
          if (currentStock - qty <= 0 && statusCol >= 0) {
            productSheet.getRange(r + 1, statusCol + 1).setValue("soldout");
          }
          break;
        }
      }
    }
  }

  orderSheet.appendRow([
    orderId, timestamp, body.nama, body.whatsapp,
    body.product_name, qty, total, body.catatan || "", "pending"
  ]);

  return {
    success: true,
    message: "Order berhasil dibuat",
    order_id: orderId,
    timestamp: timestamp,
    total: total
  };
}

/* ========== PUBLIC: CREATE INQUIRY ========== */

function createInquiry_(body) {
  if (!body) return { success: false, message: "Body kosong" };
  if (!body.nama || !body.kontak || !body.pesan) {
    return { success: false, message: "Field wajib: nama, kontak, pesan" };
  }

  var sheet = getSheet_(SHEET_INQUIRIES);
  ensureInquiriesHeader_(sheet);

  var now = new Date();
  var timestamp = Utilities.formatDate(now, "Asia/Jakarta", "yyyy-MM-dd HH:mm:ss");
  var lastRow = Math.max(sheet.getLastRow(), 1);
  var id = "INQ-" + Utilities.formatDate(now, "Asia/Jakarta", "yyyyMMdd") + "-" + String(lastRow).padStart(3, "0");

  sheet.appendRow([id, timestamp, body.nama, body.kontak, body.pesan, "new"]);

  return { success: true, message: "Pesan berhasil dikirim", inquiry_id: id };
}

/* ========== ADMIN: PRODUCTS CRUD ========== */

function adminCreateProduct_(body) {
  var sheet = getSheet_(SHEET_PRODUCTS);
  ensureProductsHeader_(sheet);

  var data = sheet.getDataRange().getValues();
  var maxId = 0;
  for (var i = 1; i < data.length; i++) {
    var id = Number(data[i][0]);
    if (id > maxId) maxId = id;
  }
  var newId = maxId + 1;

  sheet.appendRow([
    newId,
    body.name || "",
    body.slug || slugify_(body.name || ""),
    Number(body.price) || 0,
    Number(body.stock) || 0,
    body.status || "available",
    body.image_url || "",
    body.description || "",
    body.color || "",
    Number(body.sort) || newId
  ]);

  return { success: true, message: "Produk ditambahkan", id: newId };
}

function adminUpdateProduct_(body) {
  if (!body.id && !body.row) return { success: false, message: "id atau row diperlukan" };

  var sheet = getSheet_(SHEET_PRODUCTS);
  var data = sheet.getDataRange().getValues();
  var headers = data[0].map(function (h) { return String(h).toLowerCase().trim(); });
  var idCol = headers.indexOf("id");

  var targetRow = null;
  if (body.row) {
    targetRow = Number(body.row);
  } else {
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][idCol]) === String(body.id)) {
        targetRow = i + 1;
        break;
      }
    }
  }
  if (!targetRow) return { success: false, message: "Produk tidak ditemukan" };

  var fields = ["name", "slug", "price", "stock", "status", "image_url", "description", "color", "sort"];
  fields.forEach(function (f) {
    if (body[f] !== undefined && body[f] !== null) {
      var col = headers.indexOf(f);
      if (col >= 0) {
        var val = body[f];
        if (f === "price" || f === "stock" || f === "sort") val = Number(val) || 0;
        sheet.getRange(targetRow, col + 1).setValue(val);
      }
    }
  });

  var stockCol = headers.indexOf("stock");
  var statusCol = headers.indexOf("status");
  if (stockCol >= 0 && statusCol >= 0) {
    var st = Number(sheet.getRange(targetRow, stockCol + 1).getValue());
    if (st <= 0) sheet.getRange(targetRow, statusCol + 1).setValue("soldout");
  }

  return { success: true, message: "Produk diperbarui" };
}

function adminDeleteProduct_(body) {
  if (!body.id && !body.row) return { success: false, message: "id atau row diperlukan" };

  var sheet = getSheet_(SHEET_PRODUCTS);
  var data = sheet.getDataRange().getValues();
  var headers = data[0].map(function (h) { return String(h).toLowerCase().trim(); });
  var idCol = headers.indexOf("id");

  var targetRow = null;
  if (body.row) {
    targetRow = Number(body.row);
  } else {
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][idCol]) === String(body.id)) {
        targetRow = i + 1;
        break;
      }
    }
  }
  if (!targetRow) return { success: false, message: "Produk tidak ditemukan" };

  sheet.deleteRow(targetRow);
  return { success: true, message: "Produk dihapus" };
}

/* ========== ADMIN: ORDERS CRUD ========== */

function adminGetOrders_() {
  var sheet = getSheet_(SHEET_ORDERS);
  ensureOrdersHeader_(sheet);
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return { success: true, data: [] };

  var headers = data[0].map(function (h) { return String(h).toLowerCase().trim(); });
  var orders = [];

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (!row[0]) continue;
    var o = { row: i + 1 };
    headers.forEach(function (h, idx) { o[h] = row[idx]; });
    orders.push(o);
  }

  orders.reverse();
  return { success: true, data: orders };
}

function adminUpdateOrder_(body) {
  if (!body.row && !body.order_id) return { success: false, message: "row atau order_id diperlukan" };

  var sheet = getSheet_(SHEET_ORDERS);
  var data = sheet.getDataRange().getValues();
  var headers = data[0].map(function (h) { return String(h).toLowerCase().trim(); });

  var targetRow = null;
  if (body.row) {
    targetRow = Number(body.row);
  } else {
    var idCol = headers.indexOf("order_id");
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][idCol]) === String(body.order_id)) {
        targetRow = i + 1;
        break;
      }
    }
  }
  if (!targetRow) return { success: false, message: "Order tidak ditemukan" };

  var updatable = ["nama", "whatsapp", "product_name", "qty", "total", "catatan", "status"];
  updatable.forEach(function (f) {
    if (body[f] !== undefined && body[f] !== null) {
      var col = headers.indexOf(f);
      if (col >= 0) {
        var val = body[f];
        if (f === "qty" || f === "total") val = Number(val) || 0;
        sheet.getRange(targetRow, col + 1).setValue(val);
      }
    }
  });

  return { success: true, message: "Order diperbarui" };
}

function adminDeleteOrder_(body) {
  if (!body.row && !body.order_id) return { success: false, message: "row atau order_id diperlukan" };

  var sheet = getSheet_(SHEET_ORDERS);
  var data = sheet.getDataRange().getValues();
  var headers = data[0].map(function (h) { return String(h).toLowerCase().trim(); });

  var targetRow = null;
  if (body.row) {
    targetRow = Number(body.row);
  } else {
    var idCol = headers.indexOf("order_id");
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][idCol]) === String(body.order_id)) {
        targetRow = i + 1;
        break;
      }
    }
  }
  if (!targetRow) return { success: false, message: "Order tidak ditemukan" };

  sheet.deleteRow(targetRow);
  return { success: true, message: "Order dihapus" };
}

/* ========== ADMIN: INQUIRIES CRUD ========== */

function adminGetInquiries_() {
  var sheet = getSheet_(SHEET_INQUIRIES);
  ensureInquiriesHeader_(sheet);
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return { success: true, data: [] };

  var headers = data[0].map(function (h) { return String(h).toLowerCase().trim(); });
  var list = [];

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (!row[0]) continue;
    var o = { row: i + 1 };
    headers.forEach(function (h, idx) { o[h] = row[idx]; });
    list.push(o);
  }

  list.reverse();
  return { success: true, data: list };
}

function adminUpdateInquiry_(body) {
  if (!body.row && !body.id) return { success: false, message: "row atau id diperlukan" };

  var sheet = getSheet_(SHEET_INQUIRIES);
  var data = sheet.getDataRange().getValues();
  var headers = data[0].map(function (h) { return String(h).toLowerCase().trim(); });

  var targetRow = null;
  if (body.row) {
    targetRow = Number(body.row);
  } else {
    var idCol = headers.indexOf("id");
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][idCol]) === String(body.id)) {
        targetRow = i + 1;
        break;
      }
    }
  }
  if (!targetRow) return { success: false, message: "Inquiry tidak ditemukan" };

  var updatable = ["nama", "kontak", "pesan", "status"];
  updatable.forEach(function (f) {
    if (body[f] !== undefined && body[f] !== null) {
      var col = headers.indexOf(f);
      if (col >= 0) sheet.getRange(targetRow, col + 1).setValue(body[f]);
    }
  });

  return { success: true, message: "Inquiry diperbarui" };
}

function adminDeleteInquiry_(body) {
  if (!body.row && !body.id) return { success: false, message: "row atau id diperlukan" };

  var sheet = getSheet_(SHEET_INQUIRIES);
  var data = sheet.getDataRange().getValues();
  var headers = data[0].map(function (h) { return String(h).toLowerCase().trim(); });

  var targetRow = null;
  if (body.row) {
    targetRow = Number(body.row);
  } else {
    var idCol = headers.indexOf("id");
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][idCol]) === String(body.id)) {
        targetRow = i + 1;
        break;
      }
    }
  }
  if (!targetRow) return { success: false, message: "Inquiry tidak ditemukan" };

  sheet.deleteRow(targetRow);
  return { success: true, message: "Inquiry dihapus" };
}

/* ========== ADMIN: STATS ========== */

function adminGetStats_() {
  var products = getProducts_().data || [];
  var orders = adminGetOrders_().data || [];
  var inquiries = adminGetInquiries_().data || [];

  var totalRevenue = 0;
  var pendingOrders = 0;
  orders.forEach(function (o) {
    totalRevenue += Number(o.total) || 0;
    if (String(o.status).toLowerCase() === "pending") pendingOrders++;
  });

  var lowStock = products.filter(function (p) {
    return Number(p.stock) > 0 && Number(p.stock) <= 3;
  }).length;

  var soldOut = products.filter(function (p) {
    return p.status === "soldout" || Number(p.stock) <= 0;
  }).length;

  var newInquiries = inquiries.filter(function (i) {
    return String(i.status).toLowerCase() === "new";
  }).length;

  return {
    success: true,
    data: {
      products: products.length,
      orders: orders.length,
      inquiries: inquiries.length,
      pendingOrders: pendingOrders,
      totalRevenue: totalRevenue,
      lowStock: lowStock,
      soldOut: soldOut,
      newInquiries: newInquiries
    }
  };
}

/* ========== HELPERS ========== */

function getSheet_(name) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name);
  return sheet;
}

function ensureProductsHeader_(sheet) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["id", "name", "slug", "price", "stock", "status", "image_url", "description", "color", "sort"]);
  }
}

function ensureOrdersHeader_(sheet) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["order_id", "timestamp", "nama", "whatsapp", "product_name", "qty", "total", "catatan", "status"]);
  }
}

function ensureInquiriesHeader_(sheet) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["id", "timestamp", "nama", "kontak", "pesan", "status"]);
  }
}

function slugify_(text) {
  return String(text || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function parseBody_(e) {
  try {
    if (e.postData && e.postData.contents) {
      return JSON.parse(e.postData.contents);
    }
  } catch (err) { /* ignore */ }
  if (e.parameter) return e.parameter;
  return {};
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Jalankan sekali dari editor Apps Script:
 * Run → setupScriptProperties
 * Ini set ADMIN_PASSWORD = Bismillaah di Script Properties.
 */
function setupScriptProperties() {
  var props = PropertiesService.getScriptProperties();
  props.setProperty("ADMIN_PASSWORD", "Bismillaah");
  Logger.log("ADMIN_PASSWORD set. Deploy Web App jika belum.");
}
