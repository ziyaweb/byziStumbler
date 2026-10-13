# ByziStumbler Enhanced

Landing page tumbler dengan **database gratis** via Google Sheets + Apps Script.

## Fitur yang sudah diimplementasikan

| # | Fitur | Status |
|---|-------|--------|
| 1 | **Form Order / Pre-order** | ✅ Modal order + validasi + kirim ke Sheets |
| 2 | **Katalog Dinamis** | ✅ Slider & Collection Grid diambil dari Google Sheets |
| 4 | **Form Inquiry / Custom Order** | ✅ Section Contact + form |
| 6 | **Auto nomor order + timestamp** | ✅ Format `BZ-YYYYMMDD-XXXX` + waktu Asia/Jakarta |

### Bonus yang ikut
- Stok real-time (berkurang otomatis saat order)
- Badge **Sold Out** otomatis
- Tombol Order disabled kalau stok habis
- Mode demo (jalan tanpa API_URL, pakai data fallback)
- Toast notification
- Desain tetap elegan (navy + ice blue)

---

## Cara Setup (5 langkah)

### 1. Siapkan Google Sheet
Ikuti panduan lengkap di:  
**`docs/SETUP-GOOGLE-SHEETS.md`**

### 2. Deploy Apps Script
1. Buka spreadsheet → **Extensions → Apps Script**
2. Paste isi file `apps-script/Code.gs`
3. **Deploy → New deployment → Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
4. Copy **Web App URL**

### 3. Masukkan URL ke frontend
Buka `script.js` baris ~10:

```js
const API_URL = "https://script.google.com/macros/s/XXXX/exec";
```

### 4. Upload ke GitHub Pages
Ganti semua file di repository GitHub Pages kamu dengan isi folder ini (kecuali folder `docs` & `apps-script` boleh tidak di-upload).

### 5. Test
- Buka website → produk harus muncul dari Sheets
- Klik **Order Now** → isi form → data masuk sheet **Orders**
- Isi form Contact → data masuk sheet **Inquiries**

---

## Struktur Folder

```
byziStumbler-enhanced/
├── index.html          ← halaman utama
├── style.css           ← style asli
├── extra.css           ← style form + modal
├── script.js           ← logika dinamis + API
├── assets/             ← gambar + favicon
├── apps-script/
│   └── Code.gs         ← backend Google Apps Script
└── docs/
    └── SETUP-GOOGLE-SHEETS.md
```

---

## Alur Data

```
User buka website
    ↓
JS fetch GET ?action=getProducts
    ↓
Apps Script baca sheet Products → return JSON
    ↓
Frontend render Slider + Collection Grid

User submit Order
    ↓
JS POST { action: "createOrder", ... }
    ↓
Apps Script:
  - generate order_id (BZ-20261013-0007)
  - kurangi stok
  - append ke sheet Orders
  - return { success, order_id }
```

---

## Catatan

- Setiap ubah kode Apps Script → harus **Deploy lagi (New version)**
- Free tier Google sangat cukup untuk ratusan order per hari
- Data aman di Google account kamu sendiri
