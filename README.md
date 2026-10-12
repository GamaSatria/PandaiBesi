# PandaiBesi

Repositori untuk **Dashboard Evaluasi Layanan PDBK** — aplikasi web Next.js
yang memvisualisasikan hasil survei instrumen evaluasi layanan PDBK untuk
empat kategori responden: **Guru, Kepala Sekolah, Orang Tua, dan Peserta
Didik**.

Data periode berjalan (2026 S1) diambil dari Google Sheets lalu disajikan
sebagai halaman statis yang diperbarui otomatis di belakang layar
(ISR, `revalidate = 60`): halaman terbuka instan, respons Google Form baru
muncul paling lambat ±1 menit, dan bila Google Sheets sedang gagal data
terakhir yang berhasil tetap ditampilkan. Data periode 2025 bersifat statis.
Detail arsitektur data ada di [`DOKUMENTASI-DATA.md`](DOKUMENTASI-DATA.md).

## Struktur Proyek

```
.
├── dashboard/                    # Aplikasi Next.js (App Router)
│   ├── public/                   # Logo (webp + fallback jpg)
│   └── src/
│       ├── app/                  # layout.tsx, page.tsx, globals.css
│       ├── components/           # DashboardShell, Sidebar, sections, charts, WordCloud, useTheme
│       └── lib/                  # types.ts, data.ts (loader Google Sheets), data-2025.ts (data statis)
├── DOKUMENTASI-DATA.md           # Arsitektur & cara update data
└── package.json                  # Shortcut script → dashboard/ (tanpa dependensi)
```

## Teknologi

- **Next.js** 16 (App Router, Turbopack)
- **React** 19
- **TypeScript** 5
- **Tailwind CSS** 4
- **lucide-react** — ikon
- Grafik dibuat sendiri dengan HTML/SVG (`components/charts.tsx`), tanpa pustaka chart

## Prasyarat

- Node.js 20+ dan npm.

## Menjalankan Lokal

```bash
cd dashboard
npm install
cp .env.example .env.local     # lalu isi APPS_SCRIPT_URL
npm run dev                    # buka http://localhost:3000
```

Tanpa `APPS_SCRIPT_URL`, periode 2026 S1 tampil kosong; periode 2025 tetap
tampil karena datanya statis.

## Perintah

Jalankan di dalam `dashboard/`, atau dari root (diteruskan ke `dashboard/`).

| Perintah         | Fungsi                              |
|------------------|-------------------------------------|
| `npm run dev`    | Jalankan server development.        |
| `npm run build`  | Build untuk produksi.               |
| `npm run start`  | Jalankan hasil build produksi.      |
| `npm run lint`   | Jalankan ESLint.                    |

## Konfigurasi Environment

Daftar variabel lingkungan ada di `dashboard/.env.example`:

| Variabel | Fungsi |
|---|---|
| `APPS_SCRIPT_URL` | URL Apps Script Web App yang menyajikan Google Sheet sebagai JSON. |
| `GURU_TAB`, `KEPSEK_TAB`, `ORTU_TAB`, `SISWA_TAB` | Opsional — nama tab sheet jika berbeda dari default `Form Responses 1`–`4`. |

`dashboard/.env.local` **tidak boleh** di-commit — file ini sudah masuk
`.gitignore`.

## Privasi Data

Aplikasi ini menampilkan hasil survei evaluasi layanan PDBK. Dashboard hanya
menampilkan **data agregat** dan jawaban teks bebas; kolom identitas di sheet
(mis. nama, asal sekolah) tidak dibaca oleh loader. Jangan menambahkan
informasi yang dapat mengidentifikasi responden secara langsung (mis. nama,
NIK, NISN, atau kontak pribadi) ke tampilan dashboard.
