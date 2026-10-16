# 🚀 Deploy ByziStumbler — Panduan Lengkap

Database: **Google Sheets + Apps Script**  
Password admin disimpan di **Script Properties** (bukan di GitHub).

---

## Fitur database (apa saja yang bisa dilakukan)

| Fitur | Siapa | Keterangan |
|-------|-------|------------|
| Lihat katalog produk | Pengunjung | Harga, stok, status real-time dari Sheets |
| Order produk | Pengunjung | Form modal → nomor order otomatis `BZ-YYYYMMDD-XXXX` → stok berkurang |
| Inquiry / tanya stok | Pengunjung | Form Contact → masuk sheet Inquiries |
| Login admin | Admin | Password: `Bismillaah` (tersimpan di Script Properties) |
| Dashboard statistik | Admin | Jumlah produk, order, revenue, low stock, dll |
| CRUD Products | Admin | Tambah / edit / hapus produk (nama, harga, stok, status, gambar…) |
| CRUD Orders | Admin | Lihat, ubah status (pending→paid→shipped→done), hapus |
| CRUD Inquiries | Admin | Lihat, ubah status (new→read→replied), hapus |
| Link WA cepat | Admin | Klik nomor WA di tabel order → buka WhatsApp |

---

## BAGIAN A — Google Sheets + Apps Script

### A1. Buat Spreadsheet
1. https://sheets.google.com → Blank
2. Nama: `ByziStumbler Database`
3. Rename sheet → **Products**
4. Tambah sheet: **Orders**, **Inquiries**

### A2. Isi Products
Header baris 1:
```
id | name | slug | price | stock | status | image_url | description | color | sort
```
Atau import `_setup/Products-sample.csv`.

Header **Orders**:
```
order_id | timestamp | nama | whatsapp | product_name | qty | total | catatan | status
```

Header **Inquiries**:
```
id | timestamp | nama | kontak | pesan | status
```

### A3. Apps Script
1. Extensions → Apps Script
2. Paste seluruh isi `_setup/Code.gs`
3. Save

### A4. Set password (Script Properties) — PENTING
**Cara 1 (disarankan):**
1. Di editor → pilih fungsi `setupScriptProperties`
2. Klik **Run** → Authorize
3. Password `Bismillaah` tersimpan di Script Properties

**Cara 2 manual:**
1. Ikon gear (Project Settings) kiri
2. Script properties → Add
3. Key: `ADMIN_PASSWORD`  Value: `Bismillaah`

> Password **tidak** ada di file frontend. Aman di-deploy ke GitHub Pages.

### A5. Deploy Web App
1. Deploy → New deployment → Web app
2. Execute as: **Me**
3. Who has access: **Anyone**
4. Deploy → Authorize → **Copy URL**

---

## BAGIAN B — Frontend (GitHub Pages)

### B1. Set API URL
Buka **dua file**:
- `script.js`
- `admin.js`

Ganti:
```js
const API_URL = "GANTI_DENGAN_WEB_APP_URL_KAMU";
```
menjadi URL dari langkah A5.

### B2. Upload ke GitHub
Upload ke root repo GitHub Pages:
```
index.html
admin.html
panduan.html
style.css
extra.css
admin.css
script.js
admin.js
assets/
CNAME
```
**Jangan** upload folder `_setup/` (hanya untuk referensi setup).

### B3. Test checklist
- [ ] Website load → produk muncul dari Sheets
- [ ] Order Now → data masuk sheet Orders, stok berkurang
- [ ] Form Contact → data masuk Inquiries
- [ ] Buka `/admin.html` → login `Bismillaah`
- [ ] Dashboard menampilkan angka
- [ ] CRUD Products / Orders / Inquiries berjalan
- [ ] Logout & login ulang OK

---

## Ubah password admin nanti
1. Apps Script → Project Settings → Script properties
2. Edit value `ADMIN_PASSWORD`
3. Tidak perlu deploy ulang (Properties langsung aktif)

## Ubah kode Apps Script
Setiap ubah `Code.gs` → Deploy → Manage deployments → Edit → **New version** → Deploy

---

## Troubleshooting

| Masalah | Solusi |
|---------|--------|
| Produk kosong | Cek sheet Products ada data + header benar |
| Order gagal CORS | Pastikan fetch pakai `Content-Type: text/plain` (sudah di kode) |
| Login admin gagal | Jalankan `setupScriptProperties` atau cek Script Properties |
| Admin 401 | Password dikirim tiap request; pastikan session belum expired (refresh login) |
| Stok tidak berkurang | Pastikan `product_id` dikirim & kolom `id` di Products cocok |

Selamat deploy! 🧊
