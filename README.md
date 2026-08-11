# PandaiBesi

Repositori untuk **Dashboard Evaluasi Layanan PDBK** — aplikasi web Next.js
yang memvisualisasikan hasil survei instrumen evaluasi layanan Pendidikan
Dasar bagi empat kategori responden: **Guru, Kepala Sekolah, Orang Tua, dan
Peserta Didik**.

Data dimuat ulang pada setiap request (`revalidate = 0`), sehingga hasil
selalu sinkron dengan sumber data saat halaman di-refresh.

## Struktur Proyek

```
.
├── dashboard/                  # Aplikasi Next.js (App Router)
│   ├── src/app/                # Routing & layout utama
│   │   ├── layout.tsx          # RootLayout (font, metadata, bahasa `id`)
│   │   └── page.tsx            # Halaman dashboard (memuat data & render shell)
│   ├── src/components/         # Komponen UI: DashboardShell, Sidebar
│   ├── src/lib/                # data.ts (loader), types.ts (tipe data)
│   └── package.json
└── package.json                # Dependensi bersama (googleapis, recharts)
```

## Teknologi

- **Next.js** 16 (App Router)
- **React** 19
- **TypeScript** 5
- **Tailwind CSS** 4
- **Recharts** 3 — visualisasi chart
- **googleapis** — klien Google API untuk sumber data

## Prasyarat

- Node.js 20+ dan npm.

## Menjalankan Lokal

```bash
# dari root
npm install                    # install dependensi bersama
cd dashboard
npm install                    # install dependensi dashboard
npm run dev                    # buka http://localhost:3000
```

## Perintah (di dalam `dashboard/`)

| Perintah         | Fungsi                              |
|------------------|-------------------------------------|
| `npm run dev`    | Jalankan server development.        |
| `npm run build`  | Build untuk produksi.               |
| `npm run start`  | Jalankan hasil build produksi.      |
| `npm run lint`   | Jalankan ESLint.                    |

## Konfigurasi Environment

Daftar variabel lingkungan yang dibutuhkan tersedia di
`dashboard/.env.example` (tanpa nilai). Untuk development lokal, salin ke
`dashboard/.env.local`:

```bash
cp dashboard/.env.example dashboard/.env.local
```

`dashboard/.env.local` **tidak boleh** di-commit — file ini sudah masuk
`.gitignore` sesuai standar keamanan repositori.

## Privasi Data

Aplikasi ini menampilkan hasil survei evaluasi layanan PDBK. Sumber data
hanya boleh berisi **data agregat** dan **tidak boleh** memuat informasi
yang dapat mengidentifikasi responden secara langsung (mis. nama, NIK,
NISN, atau kontak pribadi). Lihat `SECURITY.md` untuk aturan
keamanan repositori secara lengkap.

## Lisensi

Lihat file `LICENSE` jika tersedia di repositori.
