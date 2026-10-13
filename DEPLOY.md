# 🚀 Panduan Deploy ByziStumbler (Lengkap)

Ikuti urutan di bawah. Total waktu ± 10–15 menit.

---

## BAGIAN A — Google Sheets + Apps Script (Database)

### A1. Buat Spreadsheet
1. Buka https://sheets.google.com → **Blank spreadsheet**
2. Rename jadi: `ByziStumbler Database`
3. Rename sheet pertama jadi: **Products**
4. Tambah 2 sheet baru: **Orders** dan **Inquiries**

### A2. Isi sheet Products
- Baris 1 (header):
  ```
  id | name | slug | price | stock | status | image_url | description | color | sort
  ```
- Atau import file `docs/Products-sample.csv`  
  (File → Import → Upload → Products-sample.csv → Replace current sheet)

### A3. Isi header sheet Orders (baris 1 saja)
```
order_id | timestamp | nama | whatsapp | product_name | qty | total | catatan | status
```

### A4. Isi header sheet Inquiries (baris 1 saja)
```
id | timestamp | nama | kontak | pesan | status
```

### A5. Buat Apps Script
1. Di spreadsheet → **Extensions → Apps Script**
2. Hapus kode default
3. Buka file `apps-script/Code.gs` → **Select All → Copy**
4. Paste ke editor Apps Script → **Save** (Ctrl+S)
5. Nama project: `ByziStumbler API`

### A6. Deploy Web App
1. Klik **Deploy → New deployment**
2. Icon roda gigi → pilih **Web app**
3. Isi:
   - Description: `v1`
   - Execute as: **Me**
   - Who has access: **Anyone**
4. Klik **Deploy**
5. Muncul authorization → pilih akun → **Advanced** → **Go to ByziStumbler API (unsafe)** → **Allow**
6. **COPY** URL yang muncul (bentuk: `https://script.google.com/macros/s/...../exec`)

---

## BAGIAN B — Frontend (GitHub Pages)

### B1. Siapkan file
Ambil folder ini (yang berisi `index.html`, `script.js`, `style.css`, `extra.css`, `assets/`).

**Jangan** upload folder `apps-script/` dan `docs/` ke GitHub (opsional, tidak perlu).

### B2. Masukkan API URL
1. Buka file `script.js`
2. Cari baris:
   ```js
   const API_URL = "GANTI_DENGAN_WEB_APP_URL_KAMU";
   ```
3. Ganti dengan URL yang kamu copy di langkah A6:
   ```js
   const API_URL = "https://script.google.com/macros/s/XXXX/exec";
   ```
4. Simpan.

### B3. Upload ke GitHub
**Opsi 1 — Repo sudah ada (szie.zyverse.my.id)**
- Ganti semua file di repo dengan file baru ini
- Commit & push

**Opsi 2 — Repo baru**
1. Buat repo baru di GitHub
2. Upload semua file (index.html, style.css, extra.css, script.js, assets/)
3. Settings → Pages → Source: Deploy from branch → main → / (root)
4. (Opsional) Custom domain: isi `szie.zyverse.my.id` + file CNAME

### B4. Test
1. Buka website
2. Produk harus muncul dari Google Sheets
3. Klik **Order Now** → isi form → cek sheet **Orders**
4. Isi form Contact → cek sheet **Inquiries**

---

## Troubleshooting cepat

| Masalah | Solusi |
|---------|--------|
| Produk tidak muncul | Cek API_URL sudah benar & deploy "Anyone" |
| Order gagal / CORS | Pastikan Content-Type text/plain (sudah di-set di script.js) |
| Stok tidak berkurang | Pastikan kolom `id` di Products cocok dengan yang dikirim |
| Ubah kode Apps Script | Harus Deploy lagi → Manage deployments → Edit → New version |

---

## Setelah sukses

- Ubah harga/stok → cukup edit Google Sheets
- Lihat order masuk → buka sheet **Orders**
- Nomor order otomatis: `BZ-20261013-0007`

Selamat jualan! 🧊
