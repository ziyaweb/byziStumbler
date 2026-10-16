/**
 * ByziStumbler Admin Panel
 * Password diverifikasi di Apps Script (Script Properties).
 * Password TIDAK di-hardcode di file ini secara permanen —
 * user input, lalu dikirim ke API setiap request admin.
 */

// ============================================================
//  GANTI URL INI setelah deploy Apps Script Web App
// ============================================================
const API_URL = "https://script.google.com/macros/s/AKfycbxBt0lYAKKoYw551LhEDQGIdPvwhXA4XdATiL85tldxohJyC26eT6qu8v0TNiLPWcaCUA/exec";
// ============================================================

const SESSION_KEY = "byzi_admin_pwd";

let adminPassword = sessionStorage.getItem(SESSION_KEY) || "";

/* ---------- API helper ---------- */
async function api(action, extra = {}) {
  const payload = { action, password: adminPassword, ...extra };

  if (!API_URL || API_URL.includes("GANTI_DENGAN")) {
    return demoApi(action, extra);
  }

  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(payload)
  });
  return res.json();
}

/* ---------- Demo mode (tanpa API) ---------- */
function demoApi(action, extra) {
  const demoProducts = [
    { id: 1, name: "Midnight", slug: "midnight", price: 189000, stock: 10, status: "available", image_url: "assets/tumbler-01.jpg", description: "Quiet. Deep. Timeless.", sort: 1, row: 2 },
    { id: 2, name: "Ocean", slug: "ocean", price: 199000, stock: 8, status: "available", image_url: "assets/tumbler-02.jpg", description: "Fresh with a calm edge.", sort: 2, row: 3 }
  ];
  if (action === "adminLogin") {
    if (extra.password === "Bismillaah" || adminPassword === "Bismillaah") {
      return Promise.resolve({ success: true, message: "Login berhasil (demo)" });
    }
    return Promise.resolve({ success: false, message: "Password salah (demo: Bismillaah)" });
  }
  if (action === "adminGetStats") {
    return Promise.resolve({
      success: true,
      data: { products: 2, orders: 0, inquiries: 0, pendingOrders: 0, totalRevenue: 0, lowStock: 0, soldOut: 0, newInquiries: 0 }
    });
  }
  if (action === "adminGetProducts" || action === "getProducts") {
    return Promise.resolve({ success: true, data: demoProducts });
  }
  if (action === "adminGetOrders" || action === "adminGetInquiries") {
    return Promise.resolve({ success: true, data: [] });
  }
  return Promise.resolve({ success: true, message: "OK (demo mode)" });
}

function showToast(msg, type = "success") {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.className = "toast show " + type;
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove("show"), 3500);
}

function formatRp(n) {
  return "Rp " + Number(n || 0).toLocaleString("id-ID");
}

/* ---------- LOGIN ---------- */
document.getElementById("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const pwd = document.getElementById("login-password").value;
  const msg = document.getElementById("login-msg");
  const btn = document.getElementById("login-btn");
  btn.disabled = true;
  btn.textContent = "Memeriksa…";

  adminPassword = pwd;
  const json = await api("adminLogin", { password: pwd });

  if (json.success) {
    sessionStorage.setItem(SESSION_KEY, pwd);
    document.getElementById("login-screen").hidden = true;
    document.getElementById("admin-app").hidden = false;
    loadDashboard();
  } else {
    msg.hidden = false;
    msg.className = "form-msg error";
    msg.textContent = json.message || "Password salah";
    adminPassword = "";
  }
  btn.disabled = false;
  btn.textContent = "Masuk";
});

document.getElementById("logout-btn").addEventListener("click", () => {
  sessionStorage.removeItem(SESSION_KEY);
  adminPassword = "";
  location.reload();
});

// Auto-login if session exists
if (adminPassword) {
  api("adminLogin").then((json) => {
    if (json.success) {
      document.getElementById("login-screen").hidden = true;
      document.getElementById("admin-app").hidden = false;
      loadDashboard();
    } else {
      sessionStorage.removeItem(SESSION_KEY);
      adminPassword = "";
    }
  });
}

/* ---------- TABS ---------- */
document.querySelectorAll(".admin-tabs .tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".admin-tabs .tab").forEach((t) => t.classList.remove("active"));
    document.querySelectorAll(".tab-panel").forEach((p) => p.classList.remove("active"));
    tab.classList.add("active");
    const id = tab.dataset.tab;
    document.getElementById("tab-" + id).classList.add("active");
    if (id === "dashboard") loadDashboard();
    if (id === "products") loadProducts();
    if (id === "orders") loadOrders();
    if (id === "inquiries") loadInquiries();
  });
});

/* ---------- DASHBOARD ---------- */
async function loadDashboard() {
  const json = await api("adminGetStats");
  if (!json.success) {
    showToast(json.message || "Gagal load stats", "error");
    return;
  }
  const d = json.data;
  document.getElementById("s-products").textContent = d.products;
  document.getElementById("s-orders").textContent = d.orders;
  document.getElementById("s-pending").textContent = d.pendingOrders;
  document.getElementById("s-revenue").textContent = formatRp(d.totalRevenue);
  document.getElementById("s-inquiries").textContent = d.inquiries;
  document.getElementById("s-new-inq").textContent = d.newInquiries;
  document.getElementById("s-lowstock").textContent = d.lowStock;
  document.getElementById("s-soldout").textContent = d.soldOut;
}

/* ---------- PRODUCTS ---------- */
async function loadProducts() {
  const json = await api("adminGetProducts");
  const tbody = document.querySelector("#products-table tbody");
  if (!json.success) {
    tbody.innerHTML = `<tr><td colspan="7">${json.message}</td></tr>`;
    return;
  }
  if (!json.data.length) {
    tbody.innerHTML = `<tr><td colspan="7">Belum ada produk</td></tr>`;
    return;
  }
  tbody.innerHTML = json.data.map((p) => `
    <tr>
      <td>${p.id}</td>
      <td><strong>${esc(p.name)}</strong><br><small>${esc(p.description || "")}</small></td>
      <td>${formatRp(p.price)}</td>
      <td>${p.stock}</td>
      <td><span class="badge-status ${p.status}">${p.status}</span></td>
      <td>${p.sort}</td>
      <td class="actions">
        <button class="btn-sm" onclick='editProduct(${JSON.stringify(p).replace(/'/g, "&#39;")})'>Edit</button>
        <button class="btn-sm danger" onclick="deleteProduct(${p.id}, ${p.row})">Hapus</button>
      </td>
    </tr>
  `).join("");
}

document.getElementById("btn-add-product").addEventListener("click", () => {
  openAdminForm("Tambah Produk", [
    { name: "name", label: "Nama", required: true },
    { name: "slug", label: "Slug (opsional)" },
    { name: "price", label: "Harga", type: "number", required: true },
    { name: "stock", label: "Stok", type: "number", required: true },
    { name: "status", label: "Status", type: "select", options: ["available", "soldout"] },
    { name: "image_url", label: "Image URL", placeholder: "assets/tumbler-01.jpg" },
    { name: "description", label: "Deskripsi" },
    { name: "color", label: "Color (hex)" },
    { name: "sort", label: "Sort order", type: "number" }
  ], async (data) => {
    const json = await api("adminCreateProduct", data);
    if (json.success) {
      showToast("Produk ditambahkan");
      closeAdminModal();
      loadProducts();
    } else showToast(json.message, "error");
  });
});

function editProduct(p) {
  openAdminForm("Edit Produk: " + p.name, [
    { name: "name", label: "Nama", value: p.name, required: true },
    { name: "slug", label: "Slug", value: p.slug },
    { name: "price", label: "Harga", type: "number", value: p.price, required: true },
    { name: "stock", label: "Stok", type: "number", value: p.stock, required: true },
    { name: "status", label: "Status", type: "select", options: ["available", "soldout"], value: p.status },
    { name: "image_url", label: "Image URL", value: p.image_url },
    { name: "description", label: "Deskripsi", value: p.description },
    { name: "color", label: "Color", value: p.color },
    { name: "sort", label: "Sort", type: "number", value: p.sort }
  ], async (data) => {
    data.id = p.id;
    data.row = p.row;
    const json = await api("adminUpdateProduct", data);
    if (json.success) {
      showToast("Produk diperbarui");
      closeAdminModal();
      loadProducts();
    } else showToast(json.message, "error");
  });
}

async function deleteProduct(id, row) {
  if (!confirm("Hapus produk ID " + id + "?")) return;
  const json = await api("adminDeleteProduct", { id, row });
  if (json.success) {
    showToast("Produk dihapus");
    loadProducts();
  } else showToast(json.message, "error");
}

/* ---------- ORDERS ---------- */
document.getElementById("btn-refresh-orders").addEventListener("click", loadOrders);

async function loadOrders() {
  const json = await api("adminGetOrders");
  const tbody = document.querySelector("#orders-table tbody");
  if (!json.success) {
    tbody.innerHTML = `<tr><td colspan="9">${json.message}</td></tr>`;
    return;
  }
  if (!json.data.length) {
    tbody.innerHTML = `<tr><td colspan="9">Belum ada order</td></tr>`;
    return;
  }
  tbody.innerHTML = json.data.map((o) => `
    <tr>
      <td><code>${esc(o.order_id)}</code></td>
      <td><small>${esc(o.timestamp)}</small></td>
      <td>${esc(o.nama)}</td>
      <td><a href="https://wa.me/${String(o.whatsapp).replace(/\D/g,'')}" target="_blank">${esc(o.whatsapp)}</a></td>
      <td>${esc(o.product_name)}</td>
      <td>${o.qty}</td>
      <td>${formatRp(o.total)}</td>
      <td><span class="badge-status ${o.status}">${o.status}</span></td>
      <td class="actions">
        <button class="btn-sm" onclick='editOrder(${JSON.stringify(o).replace(/'/g, "&#39;")})'>Edit</button>
        <button class="btn-sm danger" onclick="deleteOrder('${esc(o.order_id)}', ${o.row})">Hapus</button>
      </td>
    </tr>
  `).join("");
}

function editOrder(o) {
  openAdminForm("Edit Order: " + o.order_id, [
    { name: "nama", label: "Nama", value: o.nama },
    { name: "whatsapp", label: "WhatsApp", value: o.whatsapp },
    { name: "product_name", label: "Produk", value: o.product_name },
    { name: "qty", label: "Qty", type: "number", value: o.qty },
    { name: "total", label: "Total", type: "number", value: o.total },
    { name: "catatan", label: "Catatan", value: o.catatan || "" },
    { name: "status", label: "Status", type: "select", options: ["pending", "paid", "shipped", "cancelled", "done"], value: o.status }
  ], async (data) => {
    data.order_id = o.order_id;
    data.row = o.row;
    const json = await api("adminUpdateOrder", data);
    if (json.success) {
      showToast("Order diperbarui");
      closeAdminModal();
      loadOrders();
    } else showToast(json.message, "error");
  });
}

async function deleteOrder(orderId, row) {
  if (!confirm("Hapus order " + orderId + "?")) return;
  const json = await api("adminDeleteOrder", { order_id: orderId, row });
  if (json.success) {
    showToast("Order dihapus");
    loadOrders();
  } else showToast(json.message, "error");
}

/* ---------- INQUIRIES ---------- */
document.getElementById("btn-refresh-inq").addEventListener("click", loadInquiries);

async function loadInquiries() {
  const json = await api("adminGetInquiries");
  const tbody = document.querySelector("#inquiries-table tbody");
  if (!json.success) {
    tbody.innerHTML = `<tr><td colspan="7">${json.message}</td></tr>`;
    return;
  }
  if (!json.data.length) {
    tbody.innerHTML = `<tr><td colspan="7">Belum ada inquiry</td></tr>`;
    return;
  }
  tbody.innerHTML = json.data.map((i) => `
    <tr>
      <td><code>${esc(i.id)}</code></td>
      <td><small>${esc(i.timestamp)}</small></td>
      <td>${esc(i.nama)}</td>
      <td>${esc(i.kontak)}</td>
      <td class="msg-cell">${esc(i.pesan)}</td>
      <td><span class="badge-status ${i.status}">${i.status}</span></td>
      <td class="actions">
        <button class="btn-sm" onclick='editInquiry(${JSON.stringify(i).replace(/'/g, "&#39;")})'>Edit</button>
        <button class="btn-sm danger" onclick="deleteInquiry('${esc(i.id)}', ${i.row})">Hapus</button>
      </td>
    </tr>
  `).join("");
}

function editInquiry(i) {
  openAdminForm("Edit Inquiry: " + i.id, [
    { name: "nama", label: "Nama", value: i.nama },
    { name: "kontak", label: "Kontak", value: i.kontak },
    { name: "pesan", label: "Pesan", type: "textarea", value: i.pesan },
    { name: "status", label: "Status", type: "select", options: ["new", "read", "replied", "closed"], value: i.status }
  ], async (data) => {
    data.id = i.id;
    data.row = i.row;
    const json = await api("adminUpdateInquiry", data);
    if (json.success) {
      showToast("Inquiry diperbarui");
      closeAdminModal();
      loadInquiries();
    } else showToast(json.message, "error");
  });
}

async function deleteInquiry(id, row) {
  if (!confirm("Hapus inquiry " + id + "?")) return;
  const json = await api("adminDeleteInquiry", { id, row });
  if (json.success) {
    showToast("Inquiry dihapus");
    loadInquiries();
  } else showToast(json.message, "error");
}

/* ---------- MODAL FORM HELPER ---------- */
let formSubmitHandler = null;

function openAdminForm(title, fields, onSubmit) {
  document.getElementById("admin-modal-title").textContent = title;
  const form = document.getElementById("admin-form");
  form.innerHTML = fields.map((f) => {
    if (f.type === "select") {
      const opts = (f.options || []).map((o) =>
        `<option value="${o}" ${f.value === o ? "selected" : ""}>${o}</option>`
      ).join("");
      return `<div class="form-group"><label>${f.label}</label><select name="${f.name}">${opts}</select></div>`;
    }
    if (f.type === "textarea") {
      return `<div class="form-group"><label>${f.label}</label><textarea name="${f.name}" rows="3">${esc(f.value || "")}</textarea></div>`;
    }
    return `<div class="form-group"><label>${f.label}</label>
      <input type="${f.type || "text"}" name="${f.name}" value="${esc(f.value || "")}"
        ${f.required ? "required" : ""} placeholder="${f.placeholder || ""}"></div>`;
  }).join("") + `<button type="submit" class="primary-btn form-submit">Simpan</button>`;

  document.getElementById("admin-form-msg").hidden = true;
  formSubmitHandler = onSubmit;

  const modal = document.getElementById("admin-modal");
  modal.hidden = false;
  requestAnimationFrame(() => modal.classList.add("show"));
}

document.getElementById("admin-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  const data = {};
  fd.forEach((v, k) => { data[k] = v; });
  if (formSubmitHandler) await formSubmitHandler(data);
});

function closeAdminModal() {
  const modal = document.getElementById("admin-modal");
  modal.classList.remove("show");
  setTimeout(() => { modal.hidden = true; }, 300);
}

document.getElementById("admin-modal-close").addEventListener("click", closeAdminModal);
document.getElementById("admin-modal").addEventListener("click", (e) => {
  if (e.target.id === "admin-modal") closeAdminModal();
});

function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
