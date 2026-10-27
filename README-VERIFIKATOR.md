# Frontend Verifikator 3 Tahap — Surat Polibatam

Salin isi folder `frontend/src/` ke `frontend/src/` project (11 file baru/ubah, tidak ada dependensi baru).

## Mencoba tanpa backend (mock)
Buat `frontend/.env.local`:
```
VITE_VERIFICATION_MOCK=true
```
Login seperti biasa (mis. akun dummy `admin`), lalu buka:
- `/setup/verification` → sisi admin (kelola verifikator per tahap)
- `/verification` → sisi verifikator (Daftar Persetujuan)
- `/submission/<id>` → sisi pemohon (stepper "Progres Verifikasi"); di mock pakai id 101–105
Saat backend siap: hapus env itu dan `utils/verificationMock.js`.

## Kontrak API yang diasumsikan (untuk tim backend)
Semua di bawah prefix API yang sama dengan endpoint lain, format respons `{ data, message, pagination?, meta? }`.

| Method | URL | Keterangan |
|---|---|---|
| GET | `/verification/stages` | `[{ stage:1, name, verifiers:[{nip,nama,unit,...}] }, ... x3]` |
| POST | `/verification/stages/:stage/verifiers` | body `{ nip }` (admin) |
| DELETE | `/verification/stages/:stage/verifiers/:nip` | (admin) |
| GET | `/verification/approvals?stage=&page=&page_size=&search=` | surat yang sedang di tahap tsb; `meta.per_stage = {1:n,2:n,3:n}`; tiap item punya `id,title,type,creator,created_at,stage_entered_at` |
| PUT | `/verification/approvals/:id/approve` | body `{ remarks }` |
| PUT | `/verification/approvals/:id/reject` | body `{ remarks }` (wajib diisi di UI) |
| GET | `/submission/:id/verification` | `{ current_stage, steps:[{ stage,name,state:DONE\|CURRENT\|PENDING\|REJECTED, verifiers[], acted_by, acted_at, remarks }] }` |
| — | `/login` & `/whoami` | tambahkan `verifier_stages: number[]` pada objek user (mis. `[1]`, `[2,3]`, atau `[]`) |

Catatan: `GET /user` (sudah ada) dipakai untuk daftar calon verifikator.

## Yang perlu diputuskan tim
1. Satu tahap punya banyak verifikator: cukup **satu** yang menyetujui, atau **semua**? (UI tidak membedakan; aturannya di backend.)
2. Tombol "Setujui Pengajuan" admin di `/submission` saat ini langsung `APPROVED`, melewati 3 tahap. Setelah alur verifikasi aktif, sebaiknya dihapus/diganti.
3. Verifikator membuka `/submission/:id` dari Daftar Persetujuan, jadi backend harus mengizinkan verifikator membaca surat yang sedang di tahapnya.
