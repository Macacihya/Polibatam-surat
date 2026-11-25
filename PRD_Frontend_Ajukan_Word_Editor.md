# PRD & PANDUAN IMPLEMENTASI FRONTEND
## Halaman Ajukan Pengusul dengan Editor Word Terintegrasi (Mode Tanpa Docker)

| Informasi Dokumen | Keterangan |
| :--- | :--- |
| **Versi** | 1.0 — Panduan Implementasi Frontend |
| **Tanggal** | 25 November 2026 |
| **Ditujukan Untuk** | Developer Frontend (`frontend/` — Vue 3 + Vuetify 3 + Vuex) |
| **Dokumen Terkait** | `PRD_Halaman_Ajukan_Pengusul_Word_Editor.md` |
| **Status Backend** | **Siap Digunakan (Tanpa Docker)** |

---

## 1. Ringkasan Tugas Frontend

Klien menginginkan agar pada halaman **Ajukan** (`/submission/form`), pengusul (Dosen/Staff) **tetap memiliki tampilan dan editor dokumen Word di web** sehingga mereka dapat memilih template atau mengunggah file `.docx` lalu langsung mengedit isi dan tata letak surat sesuai kebutuhan.

Karena saat ini belum menggunakan container Docker (ONLYOFFICE), backend sudah menyediakan mekanisme **konversi dua arah `.docx ↔ HTML`** serta penyimpanan file `.docx` di server. Di sisi frontend, kita memanfaatkan **Tiptap (`@tiptap/vue-3`)** yang sudah terpasang di `frontend/package.json` dan membungkusnya dengan tampilan **kertas A4 ala Microsoft Word** (*Web Word Workspace*).

> **Catatan Paket Tambahan (Opsional tapi Disarankan):**  
> Di `frontend/package.json`, paket `@tiptap/vue-3`, `@tiptap/starter-kit`, `@tiptap/extension-underline`, dan `@tiptap/extension-text-align` (`^2.1.12`) **sudah terpasang**.  
> Karena beberapa template `.docx` (seperti SK Direktur) berisi tabel (`<table>`), disarankan menambah ekstensi tabel Tiptap versi yang sama:
> ```bash
> cd frontend
> npm install @tiptap/extension-table@^2.1.12 @tiptap/extension-table-row@^2.1.12 @tiptap/extension-table-cell@^2.1.12 @tiptap/extension-table-header@^2.1.12
> ```

---

## 2. Daftar Endpoint Backend yang Sudah Siap Dipakai

Base URL memakai `axiosInstance` (`frontend/src/utils/axios.js`), seluruh endpoint di bawah sudah terlindungi token `Authorization: Bearer <token>`.

### A. Mengambil Daftar Master Template Aktif
- **Endpoint**: `GET /templates?is_active=true`
- **Response (`data`)**: Array template (`id`, `code`, `title`, `type`, `description`, `filepath`).

### B. Memuat Isi Template `.docx` Menjadi HTML Siap Edit
- **Endpoint**: `GET /templates/:id/content`
- **Query Opsional**: `?title=<judul_surat>&pickup_plan=<YYYY-MM-DD>` (backend otomatis mengisi placeholder `{title}` dan `{date}` jika ada di template).
- **Response (`data`)**:
  ```json
  {
    "template": { "id": "...", "title": "...", "type": "SK Non-Honor" },
    "filepath": "http://localhost:4005/repository/templates/submission-approved-template.docx",
    "html": "<p style=\"text-align: center\"><strong>KEPUTUSAN DIREKTUR...</strong></p>..."
  }
  ```

### C. Mengunduh File `.docx` Template Asli
- **Endpoint**: `GET /templates/:id/download`
- **Kegunaan**: Tombol unduh template mentah jika pengusul ingin melihat versi `.docx` aslinya.

### D. Unggah Draf `.docx` Lokal ATAU Simpan Hasil Editan Editor ke `.docx`
- **Endpoint**: `POST /submission/draft-document`
- **Mode 1 — Upload File `.docx` Lokal (`multipart/form-data`)**:
  - Body: `file` (berkas `.docx`).
  - Response (`data`):
    ```json
    {
      "filepath": "http://localhost:4005/repository/1795000000000.docx",
      "html": "<p>...</p>",
      "document_source": "UPLOAD"
    }
    ```
  - Langsung masukkan `data.html` ke Tiptap Editor dan simpan `data.filepath` ke state form!
- **Mode 2 — Simpan HTML dari Editor Web ke `.docx` (`application/json`)**:
  - Body:
    ```json
    {
      "html": "<p>Isi surat yang sudah diedit...</p>",
      "template_id": "id_template_jika_ada",
      "existing_filepath": "draft-1795000000000.docx"
    }
    ```
  - Response (`data`): `{ "filepath": "http://localhost:4005/repository/draft-....docx", "html": "..." }`

### E. Mengambil Konten Dokumen Saat Edit (`DRAFT` / `REJECTED`) atau Detail (`[id].vue`)
- **Endpoint**: `GET /submission/:id/document`
- **Response (`data`)**:
  ```json
  {
    "id": "...",
    "title": "...",
    "status": "DRAFT",
    "template_id": "...",
    "document_source": "TEMPLATE",
    "filepath": "http://localhost:4005/repository/draft-....docx",
    "html": "<p>...</p>"
  }
  ```

### F. Simpan / Update Pengajuan (`POST /submission` & `PUT /submission/:id`)
- Field tambahan yang diterima backend:
  - `template_id` (opsional, string)
  - `document_source`: `"TEMPLATE"` | `"UPLOAD"` | `"BLANK"`
  - `editor_content`: string HTML dari editor Tiptap
  - `filepath`: string path/URL `.docx` hasil dari `/submission/draft-document` (jika `editor_content` dikirim tanpa `filepath`, backend juga otomatis membuat `.docx`-nya saat `Create`/`Edit`).
- Field lama `list_consider`, `list_observe`, `list_decide` **tidak wajib diisi** jika `editor_content` atau `filepath` sudah ada.

---

## 3. Perubahan yang Harus Dikerjakan di Frontend

### 3.1. Komponen Baru: `frontend/src/components/organisms/submission/WordDocumentEditor.vue`
Buat komponen reusable untuk **Web Word Editor** (bisa dipakai di `form.vue` dalam mode edit, dan di `[id].vue` dalam mode `readonly`):
- **Props**:
  - `modelValue` (`String` — HTML konten dokumen)
  - `readonly` (`Boolean`, default `false`)
  - `filepath` (`String`, opsional — untuk tombol `Unduh .docx`)
- **Toolbar (disembunyikan saat `readonly = true`)**:
  - Undo / Redo
  - Heading (`Normal`, `H1`, `H2`, `H3`)
  - **B** (Bold), *I* (Italic), <u>U</u> (Underline)
  - Text Align (`Left`, `Center`, `Right`, `Justify`)
  - Bullet List (`<ul>`) & Ordered List (`<ol>`)
  - Sisipkan Tabel (jika memasang `@tiptap/extension-table`)
  - Tombol **Fullscreen** (memperluas area editor memenuhi layar)
  - Tombol **Unduh `.docx`** (membuka/mengunduh `filepath` jika sudah tersedia)
- **Tampilan Kanvas ala Kertas Word**:
  - Latar belakang area luar abu-abu lembut (`#f4f5f7`), bagian tengah berupa lembar putih berbayang dengan lebar maksimal setara kertas A4 (`max-width: 820px; min-height: 900px; padding: 48px 56px; margin: 0 auto; background: #fff; box-shadow: 0 2px 12px rgba(0,0,0,0.08)`).
  - Font default kanvas menggunakan `'Bookman Old Style', Georgia, serif` agar konsisten dengan hasil `.docx` SK Polibatam.

### 3.2. Pembaruan Store Vuex: `frontend/src/stores/modules/submission.js`
1. Tambahkan field baru pada objek `form` default & `SetFormUpdate`:
   - `template_id: null`
   - `document_source: "TEMPLATE"`
   - `editor_content: ""`
   - `filepath: ""` (diisi hasil `/draft-document` atau dari data `GET /submission/:id`)
2. Pastikan pada `Create` dan `Update`:
   - Sebelum mengirim `POST /submission` atau `PUT /submission/:id`, jika `editor_content` ada isinya, panggil dulu `POST /submission/draft-document` (JSON `{ html: editor_content, template_id, existing_filepath: filepath }`) untuk menghasilkan/memperbarui file `.docx`, lalu sertakan `filepath`, `editor_content`, `document_source`, dan `template_id` ke payload pengajuan.
   - **Perhatian**: Jika `filepath_attachment` kosong/`null`, jangan kirim `undefined` yang merusak `FormData`; cukup kirim bila user memilih file lampiran baru.
3. Tambahkan helper action di store (opsional, agar rapi):
   - `FetchTemplates` (`GET /templates?is_active=true`)
   - `LoadTemplateContent` (`GET /templates/:id/content`)
   - `UploadDraftDocx` (`POST /submission/draft-document` dengan `FormData`)
   - `FetchSubmissionDocument` (`GET /submission/:id/document`)

### 3.3. Pembaruan Halaman Ajukan: `frontend/src/pages/submission/form.vue`
1. **Header Aksi**: Pertahankan tombol `Kembali`, `Simpan Sebagai Draft` (`status = 'DRAFT'`), dan `Ajukan` (`status = 'POSTED'`).
2. **Bagian Informasi Pengajuan**:
   - `Judul Surat` (`title`), `Jenis Surat` (`type`), `Tanggal Terbit SK` (`pickup_plan`).
   - **Sumber Dokumen Word** (3 pilihan jelas lewat tab / radio / tombol):
     - **Gunakan Master Template**: Pilih dari `VSelect` template aktif (`tbm_template`) -> memanggil `GET /templates/:id/content` -> isi `editor_content` & `document_source = 'TEMPLATE'`.
     - **Unggah File Word (`.docx`)**: `VFileInput` khusus `.docx` -> langsung upload ke `POST /submission/draft-document` -> isi `editor_content`, `filepath`, dan `document_source = 'UPLOAD'`.
     - **Mulai Dokumen Kosong**: Reset `editor_content` menjadi lembar kerja kosong (`<p></p>`) & `document_source = 'BLANK'`.
3. **Area Utama Editor Word**:
   - Render `<WordDocumentEditor v-model="editor_content" :filepath="filepath" />`.
   - Hapus atau sembunyikan bagian form lama (`list_consider`, `list_observe`, `list_decide`) agar pengusul fokus mengedit langsung di Word web.
4. **Mode Edit (`?submission_id=...`) untuk `DRAFT` & `REJECTED`**:
   - Panggil `SetFormUpdate(submission_id)` dan `GET /submission/:id/document` agar `editor_content` langsung muncul di kanvas Word.
   - Jika status pengajuan adalah `REJECTED`, tampilkan banner catatan penolakan verifikator di atas editor agar pengusul mudah melakukan perbaikan.
   - Jika status bukan `DRAFT` dan bukan `REJECTED` (mis. `POSTED`), nonaktifkan edit (`readonly = true`) dan sembunyikan tombol `Simpan Draft` / `Ajukan`.
5. **Validasi Sebelum `Ajukan` (`POSTED`)**:
   - Pastikan `title`, `type`, `pickup_plan` terisi.
   - Pastikan `editor_content` tidak kosong (teks setelah strip tag HTML tidak kosong) atau `filepath` sudah ada.
   - Pastikan minimal 1 Pegawai / Unit / Grup dipilih pada expansion panel bawah (sesuai validasi `SchemaMiddleware` di backend).

### 3.4. Pembaruan Halaman Detail: `frontend/src/pages/submission/[id].vue`
- Tambahkan bagian **Pratinjau Dokumen Surat (Word)** di halaman detail yang memuat data dari `GET /submission/:id/document` dan menampilkannya menggunakan `<WordDocumentEditor :model-value="docHtml" :readonly="true" :filepath="submission.filepath" />`.
- Dengan ini, **Pengusul**, **Admin**, dan **Verifikator Tahap 1–3** bisa langsung membaca isi lengkap surat yang diedit pengusul langsung di browser tanpa harus mengunduh file `.docx` terlebih dahulu (tetap tersedia tombol `Unduh .docx` jika dibutuhkan).
- **Tombol Persetujuan Verifikator (Sudut Kanan Atas Header Kartu)**:
  - Jika `submission.status === 'POSTED'` dan user yang login adalah verifikator aktif pada `current_stage` (atau `is_admin`), tampilkan tombol **Tolak** dan **Setujui** di sudut kanan atas header `[id].vue`, terhubung ke komponen `VerificationDecisionDialog` yang sudah ada (lalu refresh data detail & stepper setelah keputusan disimpan).

### 3.5. Catatan Penyesuaian Form Penerbitan: `frontend/src/pages/submission/form-publish.vue`
- Jangan mengikat `VFileInput` langsung ke `store.state.submission.form.filepath` (yang berisi string URL dari backend) agar input `VFileInput` tidak error/ter-reset.
- Gunakan state lokal terpisah (`file` untuk `VFileInput` dan `existing_filepath` untuk menampilkan dokumen draf `.docx` yang sudah tersedia), serta isi state lokal sekali setelah `await SetFormUpdate` selesai agar input (`Tanggal Surat`, `No Surat`, `Nama Surat`) tidak tertimpa saat pengisian form.

---

## 4. Checklist Pengujian Frontend Sebelum Merge

- [ ] Pengusul memilih Master Template (`GET /templates?is_active=true` -> `GET /templates/:id/content`), lalu judul dan isi template tampil di kertas A4 Editor Word.
- [ ] Pengusul mengedit teks, membuat cetak tebal/miring, perataan tengah, dan tabel di editor, lalu menekan **Simpan Sebagai Draft** -> file `.docx` tersimpan dan tetap sama ketika halaman edit dibuka kembali.
- [ ] Pengusul mengunggah file `.docx` lokal -> konten `.docx` langsung muncul di editor web dan dapat disunting sebelum **Ajukan**.
- [ ] Pengusul mengirim pengajuan (`POSTED`) -> pada halaman detail `/submission/[id]`, verifikator dapat membaca pratinjau dokumen Word dalam mode *read-only*, melihat tombol **Setujui / Tolak** di sudut kanan atas, serta mengunduh file `.docx`-nya.
- [ ] Jika ditolak (`REJECTED`), pengusul membuka edit pengajuan -> catatan penolakan terlihat dan naskah Word terakhir termuat untuk diperbaiki lalu diajukan ulang.
- [ ] Pada `form-publish.vue`, dokumen draf existing terdeteksi dan field `Tanggal Surat`, `No Surat`, `Nama Surat` tidak terhapus atau gagal validasi saat disubmit.
