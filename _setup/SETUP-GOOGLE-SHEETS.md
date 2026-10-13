# Setup Google Sheets + Apps Script untuk ByziStumbler

## 1. Buat Spreadsheet baru

1. Buka https://sheets.google.com
2. Buat spreadsheet baru, beri nama: **ByziStumbler Database**
3. Buat 3 sheet dengan nama persis:

### Sheet 1: `Products`
Baris header (baris 1):

| A       | B     | C     | D     | E     | F         | G          | H           | I      | J       |
|---------|-------|-------|-------|-------|-----------|------------|-------------|---------|---------|
| id      | name  | slug  | price | stock | status    | image_url  | description | color   | sort    |

Contoh data (baris 2–6):

| id | name     | slug     | price | stock | status    | image_url              | description                  | color    | sort |
|----|----------|----------|-------|-------|-----------|------------------------|------------------------------|----------|------|
| 1  | Midnight | midnight | 189000| 10    | available | assets/tumbler-01.jpg  | Quiet. Deep. Timeless.       | #0a1628  | 1    |
| 2  | Ocean    | ocean    | 199000| 8     | available | assets/tumbler-02.jpg  | Fresh with a calm edge.      | #1a4a7a  | 2    |
| 3  | Cobalt   | cobalt   | 209000| 5     | available | assets/tumbler-03.jpg  | Bold, clean, confident.      | #164c91  | 3    |
| 4  | Sapphire | sapphire | 199000| 12    | available | assets/tumbler-04.jpg  | A polished everyday blue.    | #2a6bb5  | 4    |
| 5  | Deep Sea | deep-sea | 219000| 3     | available | assets/tumbler-05.jpg  | For slower, softer days.     | #0d2b4a  | 5    |

### Sheet 2: `Orders`
Header saja dulu (baris 1):

| A         | B         | C     | D        | E            | F   | G     | H       | I      |
|-----------|-----------|-------|----------|--------------|-----|-------|---------|--------|
| order_id  | timestamp | nama  | whatsapp | product_name | qty | total | catatan | status |

### Sheet 3: `Inquiries`
Header saja (baris 1):

| A  | B         | C     | D      | E     | F      |
|----|-----------|-------|--------|-------|--------|
| id | timestamp | nama  | kontak | pesan | status |

---

## 2. Buat Apps Script

1. Di spreadsheet yang sama → **Extensions → Apps Script**
2. Hapus semua kode default
3. Copy-paste seluruh isi file `apps-script/Code.gs` (lihat folder project)
4. Simpan (Ctrl+S), beri nama project: **ByziStumbler API**

## 3. Deploy sebagai Web App

1. Klik **Deploy → New deployment**
2. Pilih type: **Web app**
3. Settings:
   - Description: `v1`
   - Execute as: **Me**
   - Who has access: **Anyone**
4. Klik **Deploy**
5. Authorize (pilih akun Google → Advanced → Go to ... → Allow)
6. **Copy Web App URL** (bentuknya: `https://script.google.com/macros/s/XXXX/exec`)

## 4. Masukkan URL ke Frontend

Buka file `script.js` → cari baris:

```js
const API_URL = "GANTI_DENGAN_WEB_APP_URL_KAMU";
```

Ganti dengan URL yang kamu copy tadi.

## 5. Test

- Buka website → buka Console (F12)
- Harus muncul data produk dari sheet
- Coba submit form Order → data masuk ke sheet Orders
- Coba submit form Inquiry → data masuk ke sheet Inquiries

---

## Catatan penting

- Setiap kali kamu ubah kode Apps Script, harus **Deploy → Manage deployments → Edit → New version**.
- Stock akan berkurang otomatis saat order berhasil (status available & stock > 0).
- Nomor order format: `BZ-YYYYMMDD-XXXX` (contoh: BZ-20261013-0007)
