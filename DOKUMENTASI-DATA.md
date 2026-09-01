 Dokumentasi Arsitektur Data Dashboard PDBK

## Ringkasan

Dashboard Evaluasi Layanan PDBK memiliki **3 periode data** dengan **dua sumber data berbeda**:

| Periode | Sumber Data | Bagian Tersedia |
|---|---|---|
| **2026 Semester 1** | Dinamis — Google Sheets via Apps Script Web App | Guru, Kepsek, Ortu, Siswa |
| **2025 Semester 2** | **Statis** — hardcoded di file TypeScript | Guru saja |
| **2025 Semester 1** | **Statis** — hardcoded di file TypeScript | Guru saja |

---

## Perbedaan Utama: Data Dinamis vs Statis

### 2026 S1 (Dinamis)

- Data diambil dari **Google Sheets** pada setiap request halaman.
- Proses: Google Form → Google Sheets → Apps Script Web App (JSON API) → `loadDashboardData()` di `dashboard/src/lib/data.ts`.
- Mencakup **4 bagian**: Guru, Kepala Sekolah, Orang Tua, Siswa.
- Endpoint API dan nama tab sheet bisa dikonfigurasi via variabel environment di `dashboard/.env.local`.

### 2025 S1 & S2 (Statis)

- Data **hardcoded** langsung di file TypeScript.
- **Tidak ada fetch ke API / Google Sheets** — data sudah ada di kode.
- Hanya mencakup **bagian Guru** (tidak ada Kepsek, Ortu, Siswa).
- Tujuan: data historis yang sudah final dan tidak akan berubah, sehingga langsung di-push ke GitHub sebagai bagian dari kode sumber.

---

## Struktur Tipe Data (`dashboard/src/lib/types.ts`)

```typescript
type Period = "2026-s1" | "2025-s2" | "2025-s1";

// Mapping periode → bagian yang tampil di sidebar
const PERIOD_SECTIONS: Record<Period, SectionKey[]> = {
  "2026-s1": ["guru", "kepsek", "ortu", "siswa"],
  "2025-s2": ["guru"],
  "2025-s1": ["guru"],
};
```

### Field `DashboardData`

| Tipe | Deskripsi | Ada di 2025? |
|---|---|---|
| `GuruData` | Total responden, sebaran kelas, capaian keterampilan, kebutuhan pendampingan, pemahaman inklusif | ✅ Ya |
| `KepsekData` | Total responden, sebaran jenjang, dampak program, saran | ❌ Tidak |
| `OrtuData` | Total responden, capaian manfaat, perubahan positif (testimoni) | ❌ Tidak |
| `SiswaData` | Total responden, pengalaman belajar, hal disukai | ❌ Tidak |

**Catatan khusus `GuruData` untuk 2025:**
- Field `pemahamanInklusif` dan `skillYangDidapat` hanya ada di periode 2025 (field optional, tidak ada di 2026).
- Keduanya adalah data chart segilima (PolarAreaChart) bentuk `{ aspek, aspekFull?, nilai }[]` dengan skala nilai 0-100.
- Field `capaianKeterampilan` dan `kebutuhanPendampingan` tersedia tapi bisa kosong jika belum diisi.

### Chart Segilima "Skill yang Di Dapat" (2025 S1)

Data aktual yang sudah dimasukkan ke `dashboard/src/lib/data-2025-s1.ts` pada field `skillYangDidapat`. Nilai dihitung `Math.round((dipilih / 17) * 100)`, sama seperti chart segilima "Pemahaman Guru".

| Label pendek (`aspek`) | Teks lengkap (`aspekFull`, tooltip) | Dipilih | Nilai (%) |
|---|---|---|---|
| Mengenali Jenis PDBK... | Mengenali jenis PDBK | 15 | 88 |
| Cara Penanganan PDBK... | Mengetahui cara penanganan PDBK | 11 | 65 |
| Strategi Pembelajaran... | Mengetahui cara menyusun strategi pembelajaran bagi PDBK | 9 | 53 |
| Pembelajaran Sesuai... | Mampu memberikan pembelajaran sesuai kondisi PDBK | 9 | 53 |
| Penilaian Hasil Belajar... | Mampu memberikan penilaian hasil belajar PDBK | 9 | 53 |

**Konvensi label:** agar label pada chart segilima tidak tumpang tindih, `aspek` dipendekkan menjadi sekitar 3 kata + akhiran `...`, sedangkan teks lengkap disimpan di `aspekFull` yang muncul sebagai tooltip saat label di-hover (lihat `PolarAngleTick` di `Sidebar.tsx`).

---

## Lokasi File

```
dashboard/src/lib/
├── types.ts              # Definisi tipe data & konstanta periode
├── data.ts               # Loader data dinamis (Google Sheets) — untuk 2026 S1
├── data-2025-s1.ts       # Data statis 2025 Semester 1 (Guru only)
└── data-2025-s2.ts       # Data statis 2025 Semester 2 (Guru only)

dashboard/src/components/
├── DashboardShell.tsx    # Komponen utama: resolve data berdasarkan periode aktif
└── Sidebar.tsx           # Sidebar, tabs, dan semua section renderer (GuruSection, dll.)
```

### Alur Resolusi Data (`DashboardShell.tsx`)

```typescript
// 2026 S1 → data dari server (Google Sheets)
const resolvedData = activePeriod === "2026-s1"
  ? data                           // prop dari server
  : (PERIOD_DATA[activePeriod] ?? data);  // data statis dari import
```

---

## Cara Mengupdate Data

### Update Data 2026 S1
1. Edit/respon Google Form yang terhubung ke Google Sheets.
2. Data akan otomatis terambil saat halaman di-refresh (karena `revalidate = 0`).
3. Jika ada perubahan header kolom sheet, pastikan variabel environment di `.env.local` masih match.

### Update Data 2025 S1 atau S2
1. Buka file `dashboard/src/lib/data-2025-s1.ts` atau `data-2025-s2.ts`.
2. Edit langsung field-field yang sesuai pada objek `DATA_2025_S1` / `DATA_2025_S2`.
3. Pastikan tipe data sesuai dengan definisi di `types.ts`.
4. Commit dan push ke GitHub — karena data statis, perubahan baru efektif setelah deploy.

### Menambahkan Periode Baru (misal 2024 S1)
1. Buat file baru: `dashboard/src/lib/data-2024-s1.ts`.
2. Tambah `"2024-s1"` ke tipe `Period` di `types.ts`.
3. Tambah entry di `PERIODS` dan `PERIOD_SECTIONS`.
4. Import dan registrasi di `DashboardShell.tsx` pada `PERIOD_DATA`.
5. Jika hanya Guru, set `PERIOD_SECTIONS["2024-s1"] = ["guru"]`.

---

## Rendering Khusus 2025 vs 2026 (di `Sidebar.tsx`)

Komponen `GuruSection` memiliki rendering berbeda berdasarkan periode:

| Komponen | 2025 | 2026 |
|---|---|---|
| Sebaran Guru per Kelas | **PieChart** (donut) | **BarChart** |
| Keterampilan / Pemahaman | **PolarAreaChart** (pemahaman inklusif) | **HorizontalBarChart** (capaian keterampilan) |
| Skill yang Di Dapat | **PolarAreaChart** (skillYangDidapat) | — (tidak ada) |
| Kebutuhan Pendampingan | `NumberedList` (biasanya kosong) | `NumberedList` (diisi dari Google Sheets) |

Hal ini dikontrol oleh flag `is2025` di dalam `GuruSection`:
```typescript
const is2025 = period === "2025-s1" || period === "2025-s2";
```
