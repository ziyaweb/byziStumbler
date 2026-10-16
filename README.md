# ByziStumbler Enhanced

Landing page tumbler + **database Google Sheets** + **Admin panel CRUD**.

## Fitur

### Publik (pengunjung)
- Katalog dinamis (harga & stok real-time)
- Form Order → nomor otomatis `BZ-YYYYMMDD-XXXX`, stok berkurang
- Form Inquiry / Contact
- Halaman Panduan (`panduan.html`)

### Admin (`admin.html`)
- Login password: **Bismillaah** (disimpan di Script Properties, bukan di GitHub)
- Dashboard statistik
- CRUD Products, Orders, Inquiries
- Ubah status order/inquiry, hapus data

## Keamanan
- Password admin di **Apps Script Script Properties**
- Tidak ada secret di file config yang di-upload ke GitHub Pages
- API URL (Web App) bersifat publik by design; proteksi lewat password per-request

## Setup
Baca **DEPLOY.md** langkah demi langkah.

## File utama
| File | Fungsi |
|------|--------|
| index.html | Landing page |
| admin.html | Panel admin |
| panduan.html | Panduan pengunjung |
| script.js / admin.js | Logika frontend (set API_URL) |
| _setup/Code.gs | Backend Apps Script |
