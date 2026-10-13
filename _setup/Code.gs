/**
 * ByziStumbler — Google Apps Script API
 * Deploy as Web App → Execute as: Me → Who has access: Anyone
 */

const SHEET_PRODUCTS  = "Products";
const SHEET_ORDERS    = "Orders";
const SHEET_INQUIRIES = "Inquiries";

/* ========== ENTRY POINTS ========== */

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  try {
    const action = (e.parameter && e.parameter.action) || 
                   (e.postData && JSON.parse(e.postData.contents).action) || 
                   "getProducts";

    let result;

    switch (action) {
      case "getProducts":
        result = getProducts();
        break;
      case "createOrder":
        result = createOrder(e);
        break;
      case "createInquiry":
        result = createInquiry(e);
        break;
      default:
        result = { success: false, message: "Unknown action: " + action };
    }

    return jsonResponse(result);
  } catch (err) {
    return jsonResponse({ success: false, message: err.toString() });
  }
}

/* ========== PRODUCTS ========== */

function getProducts() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_PRODUCTS);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const products = [];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row[0]) continue; // skip empty

    const product = {};
    headers.forEach((h, idx) => {
      product[h] = row[idx];
    });

    // Only return available or show soldout too (frontend decides)
    products.push({
      id:          product.id,
      name:        product.name,
      slug:        product.slug,
      price:       Number(product.price),
      stock:       Number(product.stock),
      status:      product.status || "available",
      image_url:   product.image_url,
      description: product.description,
      color:       product.color || "",
      sort:        Number(product.sort) || i
    });
  }

  // Sort by sort column
  products.sort((a, b) => a.sort - b.sort);

  return { success: true, data: products };
}

/* ========== ORDERS ========== */

function createOrder(e) {
  const body = parseBody(e);
  if (!body) return { success: false, message: "Invalid request body" };

  const required = ["nama", "whatsapp", "product_name", "qty"];
  for (const field of required) {
    if (!body[field] && body[field] !== 0) {
      return { success: false, message: "Field wajib: " + field };
    }
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const orderSheet = ss.getSheetByName(SHEET_ORDERS);
  const productSheet = ss.getSheetByName(SHEET_PRODUCTS);

  // Generate order_id: BZ-YYYYMMDD-XXXX
  const now = new Date();
  const dateStr = Utilities.formatDate(now, "Asia/Jakarta", "yyyyMMdd");
  const lastRow = orderSheet.getLastRow();
  const seq = String(lastRow).padStart(4, "0"); // simple sequential
  const orderId = "BZ-" + dateStr + "-" + seq;

  const timestamp = Utilities.formatDate(now, "Asia/Jakarta", "yyyy-MM-dd HH:mm:ss");
  const qty = Number(body.qty) || 1;
  const price = Number(body.price) || 0;
  const total = price * qty;

  // Optional: decrease stock
  if (body.product_id) {
    const productData = productSheet.getDataRange().getValues();
    for (let i = 1; i < productData.length; i++) {
      if (String(productData[i][0]) === String(body.product_id)) {
        const currentStock = Number(productData[i][4]); // column E = stock
        if (currentStock < qty) {
          return { success: false, message: "Stok tidak cukup. Sisa: " + currentStock };
        }
        productSheet.getRange(i + 1, 5).setValue(currentStock - qty); // update stock
        // Auto set soldout if stock becomes 0
        if (currentStock - qty <= 0) {
          productSheet.getRange(i + 1, 6).setValue("soldout");
        }
        break;
      }
    }
  }

  // Append order
  orderSheet.appendRow([
    orderId,
    timestamp,
    body.nama,
    body.whatsapp,
    body.product_name,
    qty,
    total,
    body.catatan || "",
    "pending"
  ]);

  return {
    success: true,
    message: "Order berhasil dibuat",
    order_id: orderId,
    timestamp: timestamp,
    total: total
  };
}

/* ========== INQUIRIES ========== */

function createInquiry(e) {
  const body = parseBody(e);
  if (!body) return { success: false, message: "Invalid request body" };

  if (!body.nama || !body.kontak || !body.pesan) {
    return { success: false, message: "Field wajib: nama, kontak, pesan" };
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_INQUIRIES);

  const now = new Date();
  const timestamp = Utilities.formatDate(now, "Asia/Jakarta", "yyyy-MM-dd HH:mm:ss");
  const lastRow = sheet.getLastRow();
  const id = "INQ-" + Utilities.formatDate(now, "Asia/Jakarta", "yyyyMMdd") + "-" + String(lastRow).padStart(3, "0");

  sheet.appendRow([
    id,
    timestamp,
    body.nama,
    body.kontak,
    body.pesan,
    "new"
  ]);

  return {
    success: true,
    message: "Pesan berhasil dikirim",
    inquiry_id: id
  };
}

/* ========== HELPERS ========== */

function parseBody(e) {
  try {
    if (e.postData && e.postData.contents) {
      return JSON.parse(e.postData.contents);
    }
    // fallback for form-urlencoded
    if (e.parameter) return e.parameter;
  } catch (err) {
    return null;
  }
  return null;
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
