/**
 * ByziStumbler — Frontend
 * Fitur: Katalog Dinamis, Form Order, Form Inquiry, Auto Order ID
 */

// ============================================================
//  GANTI URL INI setelah deploy Apps Script Web App
// ============================================================
const API_URL = "https://script.google.com/macros/s/AKfycbxBt0lYAKKoYw551LhEDQGIdPvwhXA4XdATiL85tldxohJyC26eT6qu8v0TNiLPWcaCUA/exec";
// Contoh: "https://script.google.com/macros/s/AKfycb.../exec"
// ============================================================

let products = [];
let currentSlide = 0;
let slideTimer = null;

/* ---------- HELPERS ---------- */
function formatRp(num) {
  return "Rp " + Number(num).toLocaleString("id-ID");
}

function showToast(message, type = "success") {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.className = "toast show " + type;
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => {
    toast.classList.remove("show");
  }, 3800);
}

function setFormMsg(el, text, type) {
  el.hidden = false;
  el.textContent = text;
  el.className = "form-msg " + type;
}

/* ---------- FETCH PRODUCTS ---------- */
async function loadProducts() {
  try {
    // Jika API_URL belum diisi, pakai data fallback (untuk preview lokal)
    if (!API_URL || API_URL.includes("GANTI_DENGAN")) {
      console.warn("API_URL belum diisi — menggunakan data fallback");
      products = getFallbackProducts();
      renderAll();
      return;
    }

    const res = await fetch(API_URL + "?action=getProducts");
    const json = await res.json();

    if (json.success && Array.isArray(json.data)) {
      products = json.data;
      renderAll();
    } else {
      throw new Error(json.message || "Gagal memuat produk");
    }
  } catch (err) {
    console.error(err);
    showToast("Gagal memuat produk. Menggunakan data lokal.", "error");
    products = getFallbackProducts();
    renderAll();
  }
}

function getFallbackProducts() {
  return [
    { id: 1, name: "Midnight", slug: "midnight", price: 189000, stock: 10, status: "available", image_url: "assets/tumbler-01.jpg", description: "Quiet. Deep. Timeless.", sort: 1 },
    { id: 2, name: "Ocean", slug: "ocean", price: 199000, stock: 8, status: "available", image_url: "assets/tumbler-02.jpg", description: "Fresh with a calm edge.", sort: 2 },
    { id: 3, name: "Cobalt", slug: "cobalt", price: 209000, stock: 5, status: "available", image_url: "assets/tumbler-03.jpg", description: "Bold, clean, confident.", sort: 3 },
    { id: 4, name: "Sapphire", slug: "sapphire", price: 199000, stock: 12, status: "available", image_url: "assets/tumbler-04.jpg", description: "A polished everyday blue.", sort: 4 },
    { id: 5, name: "Deep Sea", slug: "deep-sea", price: 219000, stock: 3, status: "available", image_url: "assets/tumbler-05.jpg", description: "For slower, softer days.", sort: 5 }
  ];
}

/* ---------- RENDER ---------- */
function renderAll() {
  document.getElementById("stat-products").textContent = products.length;
  renderSlider();
  renderCollection();
}

function renderSlider() {
  const container = document.getElementById("product-slider");
  const dotsContainer = document.getElementById("dots");

  if (!products.length) {
    container.innerHTML = '<div class="slider-loading">Belum ada produk</div>';
    return;
  }

  container.innerHTML = products.map((p, i) => {
    const isSold = p.status === "soldout" || p.stock <= 0;
    return `
      <div class="slide ${i === 0 ? "active" : ""}" data-index="${i}">
        <div class="product-card">
          <div class="badge">${String(i + 1).padStart(2, "0")} / ${String(products.length).padStart(2, "0")}</div>
          ${isSold ? '<div class="badge-soldout">Sold Out</div>' : ""}
          <img src="${p.image_url}" alt="ByziStumbler ${p.name}" loading="lazy">
          <div class="product-info">
            <span>${String(i + 1).padStart(2, "0")} — ${p.name.toUpperCase()}</span>
            <strong>${formatRp(p.price)}</strong>
            <span class="stock-label">${isSold ? "Habis" : "Stok: " + p.stock}</span>
            <button class="order-btn-slide" 
                    data-id="${p.id}" 
                    ${isSold ? "disabled" : ""}
                    onclick="openOrderModal(${p.id})">
              ${isSold ? "Sold Out" : "Order Now →"}
            </button>
          </div>
        </div>
      </div>`;
  }).join("");

  // Dots
  dotsContainer.innerHTML = products.map((_, i) =>
    `<span class="dot ${i === 0 ? "active" : ""}" data-index="${i}"></span>`
  ).join("");

  // Re-bind events
  document.querySelectorAll(".dot").forEach(dot => {
    dot.addEventListener("click", () => showSlide(Number(dot.dataset.index)));
  });

  currentSlide = 0;
  restartTimer();
}

function renderCollection() {
  const grid = document.getElementById("collection-grid");
  if (!products.length) {
    grid.innerHTML = '<div class="grid-loading">Belum ada produk</div>';
    return;
  }

  grid.innerHTML = products.map((p, i) => {
    const isSold = p.status === "soldout" || p.stock <= 0;
    return `
      <article data-id="${p.id}">
        ${isSold ? '<div class="badge-soldout">Sold Out</div>' : ""}
        <img src="${p.image_url}" alt="${p.name}" loading="lazy">
        <div>
          <span>${String(i + 1).padStart(2, "0")}</span>
          <h3>${p.name}</h3>
          <p>${p.description}</p>
          <p class="stock-info">${formatRp(p.price)} · ${isSold ? "Habis" : "Stok " + p.stock}</p>
          <div class="card-actions">
            <button class="order-btn" 
                    ${isSold ? "disabled" : ""}
                    onclick="openOrderModal(${p.id})">
              ${isSold ? "Sold Out" : "Order Now"}
            </button>
          </div>
        </div>
      </article>`;
  }).join("");
}

/* ---------- SLIDER CONTROLS ---------- */
function showSlide(index) {
  const slides = document.querySelectorAll(".slide");
  const dots = document.querySelectorAll(".dot");
  if (!slides.length) return;

  currentSlide = (index + slides.length) % slides.length;
  slides.forEach((s, i) => s.classList.toggle("active", i === currentSlide));
  dots.forEach((d, i) => d.classList.toggle("active", i === currentSlide));
  restartTimer();
}

function restartTimer() {
  clearInterval(slideTimer);
  slideTimer = setInterval(() => showSlide(currentSlide + 1), 5000);
}

document.getElementById("next").addEventListener("click", () => showSlide(currentSlide + 1));
document.getElementById("prev").addEventListener("click", () => showSlide(currentSlide - 1));

const sliderEl = document.querySelector(".slider");
if (sliderEl) {
  sliderEl.addEventListener("mouseenter", () => clearInterval(slideTimer));
  sliderEl.addEventListener("mouseleave", restartTimer);
}

/* ---------- ORDER MODAL ---------- */
function openOrderModal(productId) {
  const product = products.find(p => Number(p.id) === Number(productId));
  if (!product) return;
  if (product.status === "soldout" || product.stock <= 0) {
    showToast("Produk ini sedang sold out", "error");
    return;
  }

  document.getElementById("modal-product-name").textContent = product.name;
  document.getElementById("modal-price").textContent = formatRp(product.price);
  document.getElementById("order-product-id").value = product.id;
  document.getElementById("order-product-name").value = product.name;
  document.getElementById("order-price").value = product.price;
  document.getElementById("order-qty").value = 1;
  document.getElementById("order-qty").max = product.stock;
  document.getElementById("order-nama").value = "";
  document.getElementById("order-wa").value = "";
  document.getElementById("order-catatan").value = "";
  document.getElementById("order-msg").hidden = true;
  updateOrderTotal();

  const modal = document.getElementById("order-modal");
  modal.hidden = false;
  requestAnimationFrame(() => modal.classList.add("show"));
}

function closeOrderModal() {
  const modal = document.getElementById("order-modal");
  modal.classList.remove("show");
  setTimeout(() => { modal.hidden = true; }, 300);
}

document.getElementById("modal-close").addEventListener("click", closeOrderModal);
document.getElementById("order-modal").addEventListener("click", (e) => {
  if (e.target.id === "order-modal") closeOrderModal();
});

document.getElementById("order-qty").addEventListener("input", updateOrderTotal);

function updateOrderTotal() {
  const price = Number(document.getElementById("order-price").value) || 0;
  const qty = Number(document.getElementById("order-qty").value) || 1;
  document.getElementById("order-total-display").textContent = formatRp(price * qty);
}

/* ---------- SUBMIT ORDER ---------- */
document.getElementById("order-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const btn = document.getElementById("order-submit");
  const msg = document.getElementById("order-msg");

  const payload = {
    action: "createOrder",
    nama: document.getElementById("order-nama").value.trim(),
    whatsapp: document.getElementById("order-wa").value.trim(),
    product_id: document.getElementById("order-product-id").value,
    product_name: document.getElementById("order-product-name").value,
    price: Number(document.getElementById("order-price").value),
    qty: Number(document.getElementById("order-qty").value),
    catatan: document.getElementById("order-catatan").value.trim()
  };

  if (!payload.nama || !payload.whatsapp) {
    setFormMsg(msg, "Nama dan WhatsApp wajib diisi", "error");
    return;
  }

  btn.disabled = true;
  btn.innerHTML = "Mengirim…";

  try {
    if (!API_URL || API_URL.includes("GANTI_DENGAN")) {
      // Demo mode
      await new Promise(r => setTimeout(r, 800));
      const fakeId = "BZ-" + new Date().toISOString().slice(0,10).replace(/-/g,"") + "-0001";
      setFormMsg(msg, `Order berhasil! No. ${fakeId} (mode demo)`, "success");
      showToast("Order tersimpan (demo mode). Isi API_URL untuk data nyata.", "success");
      setTimeout(closeOrderModal, 2200);
      return;
    }

    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" }, // Apps Script prefers this for CORS
      body: JSON.stringify(payload)
    });
    const json = await res.json();

    if (json.success) {
      setFormMsg(msg, `Order berhasil! No. Order: ${json.order_id}`, "success");
      showToast(`Order ${json.order_id} berhasil dibuat`, "success");
      // Refresh products to update stock
      setTimeout(() => {
        closeOrderModal();
        loadProducts();
      }, 2000);
    } else {
      setFormMsg(msg, json.message || "Gagal membuat order", "error");
    }
  } catch (err) {
    console.error(err);
    setFormMsg(msg, "Terjadi kesalahan jaringan. Coba lagi.", "error");
  } finally {
    btn.disabled = false;
    btn.innerHTML = 'Kirim Order <span>→</span>';
  }
});

/* ---------- SUBMIT INQUIRY ---------- */
document.getElementById("inquiry-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const btn = document.getElementById("inq-submit");
  const msg = document.getElementById("inq-msg");

  const payload = {
    action: "createInquiry",
    nama: document.getElementById("inq-nama").value.trim(),
    kontak: document.getElementById("inq-kontak").value.trim(),
    pesan: document.getElementById("inq-pesan").value.trim()
  };

  if (!payload.nama || !payload.kontak || !payload.pesan) {
    setFormMsg(msg, "Semua field wajib diisi", "error");
    return;
  }

  btn.disabled = true;
  btn.innerHTML = "Mengirim…";

  try {
    if (!API_URL || API_URL.includes("GANTI_DENGAN")) {
      await new Promise(r => setTimeout(r, 700));
      setFormMsg(msg, "Pesan terkirim (mode demo). Terima kasih!", "success");
      showToast("Inquiry tersimpan (demo)", "success");
      e.target.reset();
      return;
    }

    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload)
    });
    const json = await res.json();

    if (json.success) {
      setFormMsg(msg, "Pesan berhasil dikirim! Kami akan segera menghubungi.", "success");
      showToast("Inquiry terkirim", "success");
      e.target.reset();
    } else {
      setFormMsg(msg, json.message || "Gagal mengirim pesan", "error");
    }
  } catch (err) {
    console.error(err);
    setFormMsg(msg, "Terjadi kesalahan jaringan. Coba lagi.", "error");
  } finally {
    btn.disabled = false;
    btn.innerHTML = 'Kirim Pesan <span>→</span>';
  }
});

/* ---------- INIT ---------- */
document.addEventListener("DOMContentLoaded", () => {
  loadProducts();
});
