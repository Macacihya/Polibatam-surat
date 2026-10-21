# Panduan Integrasi Frontend: Verifikasi Tiga Tahap & Notifikasi

Dokumen ini ditujukan untuk developer **Frontend** yang akan mengimplementasikan antarmuka fitur **Verifikasi Surat Keputusan Tiga Tahap** dan **Notifikasi Internal**.

---

## 1. Langkah Wajib Setelah Pull Branch Ini

Setelah Anda melakukan `git pull origin backend`, jalankan sinkronisasi skema basis data di folder backend:

```bash
cd backend
npx prisma db push
```
> **Kenapa wajib?** Perintah ini otomatis membuat tabel baru `tbl_submission_verification` dan `tbl_notification` di PostgreSQL lokal Anda tanpa menghapus data yang sudah ada.

---

## 2. Akun Dummy untuk Pengujian

Semua akun menggunakan **password sembarang** (contoh: `password`):

| Username / NIP | Peran | Kegunaan Uji Coba |
| :--- | :--- | :--- |
| **`admin`** | Super Admin | Menugaskan 3 verifikator, memonitor seluruh pengajuan, dan publish SK resmi. |
| **`administrasi`** | Verifikator Tahap 1 | Bertindak sebagai Verifikator Tahap 1 (Urusan Administrasi). |
| **`wadir`** *(atau `wakildirektur`)* | Verifikator Tahap 2 | Bertindak sebagai Verifikator Tahap 2 (Wakil Direktur). |
| **`direktur`** | Verifikator Final (Tahap 3) | Bertindak sebagai Verifikator Tahap 3 (Direktur Polibatam). |
| **`dosen`** | Pengaju SK | Mengajukan SK (Dosen/Tenaga Pendidik). |
| **`staff`** | Pengaju / Pegawai | Akun pegawai umum. |

---

## 3. Daftar Endpoint API & Contoh Payload

Base URL: `http://localhost:4005/api/v1`  
Header wajib untuk semua endpoint terlindungi:
```http
Authorization: Bearer <token_hasil_login>
```

---

### A. Penugasan Verifikator (Khusus Admin / Urusan Administrasi)
Digunakan ketika Admin membuka pengajuan yang berstatus `POSTED` lalu menunjuk 1 hingga 3 pejabat yang bertugas memeriksa secara berurutan: **Administrasi → Wakil Direktur → Direktur**.

* **Endpoint**: `POST /submission/assign-verifiers/:id` *(atau `PUT`)*
* **Headers**: `Authorization: Bearer <token_admin>`
* **Request Body (JSON)**:
  ```json
  {
    "verifiers": [
      {
        "stage": 1,
        "stage_name": "Verifikasi Administrasi",
        "verifier_id": "administrasi"
      },
      {
        "stage": 2,
        "stage_name": "Verifikasi Wakil Direktur",
        "verifier_id": "wadir"
      },
      {
        "stage": 3,
        "stage_name": "Pengesahan Direktur",
        "verifier_id": "direktur"
      }
    ]
  }
  ```
* **Efek di Backend**:
  - Menyimpan penugasan verifikator berurutan.
  - Mengirim notifikasi lonceng ke akun Verifikator Tahap 1 (`administrasi`).

---

### B. Keputusan Verifikasi (Setujui / Tolak)
Digunakan oleh pejabat verifikator yang sedang aktif memeriksa surat pada tahapnya.

* **Endpoint**: `POST /submission/verify/:id` *(atau `PUT`)*
* **Headers**: `Authorization: Bearer <token_verifikator>`

#### Opsi 1: Menyetujui Pengajuan (`APPROVE`)
```json
{
  "action": "APPROVE",
  "remarks": "Naskah kelengkapan administrasi dan butir konsiderans disetujui."
}
```
* **Efek di Backend**:
  - Jika ini Tahap 1 (Administrasi): Otomatis menaikkan `current_stage` ke Tahap 2 (Wakil Direktur) dan mengirim notifikasi lonceng ke Verifikator Tahap 2.
  - Jika ini Tahap 2 (Wakil Direktur): Otomatis menaikkan `current_stage` ke Tahap 3 (Direktur) dan mengirim notifikasi lonceng ke Verifikator Tahap 3.
  - Jika ini Tahap 3 (Final): Status pengajuan berubah jadi `APPROVED`, otomatis men-generate draf borang Word `.docx`, dan mengirim notifikasi ke pemohon bahwa pengajuan telah disetujui penuh.

#### Opsi 2: Menolak Pengajuan (`REJECT`)
> [!IMPORTANT]
> Properti `remarks` **wajib diisi** jika `action === "REJECT"`.
```json
{
  "action": "REJECT",
  "remarks": "Format konsiderans perlu disesuaikan dengan pedoman tata naskah dinas."
}
```
* **Efek di Backend**:
  - Status pengajuan langsung berubah menjadi `REJECTED`.
  - Alasan penolakan tercatat di `tbl_submission_log`.
  - Notifikasi terkirim ke pemohon agar segera memperbaiki dokumennya.

---

### C. Mengambil Detail Pengajuan & Status Verifikasi
* **Endpoint**: `GET /submission/:id`
* **Response Payload (`data`)**:
  ```json
  {
    "id": "cmvansgvn005ei97iqfc01pap",
    "title": "Pengangkatan Panitia Kegiatan Seminar...",
    "status": "POSTED",
    "current_stage": 2,
    "total_stages": 3,
    "verifications": [
      {
        "id": "clx...",
        "stage": 1,
        "stage_name": "Verifikasi Administrasi",
        "status": "APPROVED",
        "remarks": "Format berkas dan lampiran sesuai.",
        "acted_at": "2026-10-19T13:02:29.000Z",
        "verifier": {
          "id": "administrasi",
          "nama": "Regina Administrasi, S.Sos (Dummy)"
        }
      },
      {
        "id": "cly...",
        "stage": 2,
        "stage_name": "Verifikasi Wakil Direktur",
        "status": "PENDING",
        "remarks": null,
        "acted_at": null,
        "verifier": {
          "id": "wadir",
          "nama": "Dr. Ahmad Riyadi, S.T., M.T. (Wakil Direktur I)"
        }
      },
      {
        "id": "clz...",
        "stage": 3,
        "stage_name": "Pengesahan Direktur",
        "status": "PENDING",
        "remarks": null,
        "acted_at": null,
        "verifier": {
          "id": "direktur",
          "nama": "Ir. Bambang Hendrawan, S.T., M.S.M., Ph.D. (Direktur)"
        }
      }
    ]
  }
  ```

---

### D. Fitur Lonceng Notifikasi (In-App Notification)

#### 1. Mengambil Daftar Notifikasi
* **Endpoint**: `GET /notification`
* **Response**:
  ```json
  {
    "status": 200,
    "data": {
      "unread_count": 2,
      "notifications": [
        {
          "id": "notif_1",
          "title": "Tugas Verifikasi Wakil Direktur (Tahap 2)",
          "message": "Pengajuan SK \"...\" menunggu peninjauan Anda.",
          "link": "/submission/cmvansgvn005ei97iqfc01pap",
          "is_read": false,
          "created_at": "2026-10-19T13:02:29.000Z"
        }
      ]
    }
  }
  ```

#### 2. Menandai Notifikasi Dibaca
* Tandai 1 notifikasi: `PUT /notification/:id/read`
* Tandai semua notifikasi dibaca: `PUT /notification/read-all`

---

## 4. Rekomendasi Komponen UI Frontend yang Perlu Dibuat

1. **Modal / Form Penugasan Verifikator (`Admin Only`)**:
   - Ditaruh pada menu aksi tabel pengajuan (`/submission`) atau di halaman detail.
   - Berisi 3 dropdown pilihan verifikator berurutan:
     * **Tahap 1**: Verifikator Administrasi (Urusan Administrasi).
     * **Tahap 2**: Verifikator Wakil Direktur (Wadir I, II, atau III).
     * **Tahap 3**: Pengesahan Direktur (Direktur).
2. **Stepper / Progres Verifikasi di Halaman Detail (`/submission/:id`)**:
   - Menampilkan visual step bar:
     * Tahap 1: Centang Hijau (Disetujui oleh Administrasi).
     * Tahap 2: Kuning / Berkedip (Sedang menunggu Wakil Direktur).
     * Tahap 3: Abu-abu (Menunggu Direktur).
3. **Card Aksi Keputusan (Untuk Verifikator Aktif)**:
   - Jika `current_user.id === verification.verifier_id` dan tahap tersebut sedang aktif:
     Tampilkan 2 tombol: **"Setujui"** dan **"Tolak"**.
   - Tombol Tolak membuka dialog input alasan penolakan wajib.
4. **Lonceng Notifikasi di Navbar**:
   - Menampilkan badge merah dengan angka `unread_count`.
   - Dropdown menu notifikasi dengan item pesan yang jika diklik langsung navigasi ke URL pengajuan terkait (`link`).

