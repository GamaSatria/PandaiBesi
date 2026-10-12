# Dokumentasi Arsitektur Data Dashboard PDBK

## Ringkasan

Dashboard Evaluasi Layanan PDBK memiliki **3 periode data** dengan **dua sumber data berbeda**:

| Periode | Sumber Data | Bagian Tersedia |
|---|---|---|
| **2026 Semester 1** | Dinamis — Google Sheets via Apps Script Web App | Guru, Kepsek, Ortu, Siswa |
| **2025 Semester 2** | **Statis** — hardcoded di `data-2025.ts` | Guru saja |
| **2025 Semester 1** | **Statis** — hardcoded di `data-2025.ts` | Guru saja |

---

## Perbedaan Utama: Data Dinamis vs Statis

### 2026 S1 (Dinamis)

- Data diambil dari **Google Sheets** pada setiap request halaman.
- Proses: Google Form → Google Sheets → Apps Script Web App (JSON API) → `loadDashboardData()` di `dashboard/src/lib/data.ts`.
- Mencakup **4 bagian**: Guru, Kepala Sekolah, Orang Tua, Siswa.
- Endpoint API dan nama tab sheet dikonfigurasi via variabel environment di `dashboard/.env.local`.
- Keempat tab diambil paralel dengan **timeout 15 detik** per tab. Selama data diambil, halaman menampilkan "Memuat data…" (streaming via `<Suspense>` di `page.tsx`).
- **Jika `APPS_SCRIPT_URL` kosong, tab gagal diambil, atau tab belum punya respons**, bagian tersebut tampil **kosong** (0 responden, "Belum ada data"). Dashboard tidak pernah menampilkan angka contoh. Penyebabnya tercatat di log server (`[err] …` / `[warn] …`).

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

`types.ts` juga berisi `EMPTY_GURU`, `EMPTY_KEPSEK`, `EMPTY_ORTU`, `EMPTY_SISWA`: bagian tanpa data yang dipakai periode 2025 (Kepsek/Ortu/Siswa) dan oleh loader saat sheet gagal diambil.

### Field `DashboardData`

| Tipe | Deskripsi | Ada di 2025? |
|---|---|---|
| `GuruData` | Total responden, sebaran kelas, capaian keterampilan, kebutuhan pendampingan, pemahaman inklusif | ✅ Ya |
| `KepsekData` | Total responden, sebaran jenjang, dampak program (`sesudah` = % kepsek yang memilih, `sesudahCount` = jumlahnya), saran | ❌ Tidak |
| `OrtuData` | Total responden, capaian manfaat, perubahan positif (testimoni) | ❌ Tidak |
| `SiswaData` | Total responden, pengalaman belajar, hal disukai (jawaban teks utuh) | ❌ Tidak |

**Catatan khusus `GuruData` untuk 2025:**
- Field `pemahamanInklusif`, `skillYangDidapat`, dan `chartTower` hanya ada di periode 2025 (field optional, tidak ada di 2026).
- `pemahamanInklusif` dan `skillYangDidapat` adalah data chart segilima (PolarAreaChart) bentuk `AspekItem[]` = `{ aspek, aspekFull?, nilai }[]` dengan skala nilai 0-100.
- `chartTower` adalah data bar chart vertikal (BarChartCard) bentuk `{ name, nameFull?, value }[]`.
- Field `capaianKeterampilan` dan `kebutuhanPendampingan` selalu kosong di 2025 (tidak ditampilkan).

---

## Format Data 2025 (`dashboard/src/lib/data-2025.ts`)

Teks opsi setiap pertanyaan (label pendek + teks lengkap) didefinisikan **sekali** di daftar opsi:

| Daftar opsi | Pertanyaan | Dipakai untuk |
|---|---|---|
| `REGULASI` | Pemahaman guru tentang regulasi pendidikan inklusif | `pemahamanInklusif` |
| `SKILL_GURU` | Skill yang didapat guru setelah pendampingan | `skillYangDidapat` |
| `KEMAMPUAN_PDBK` | Kemampuan yang dapat dilakukan PDBK | `chartTower` |

Setiap semester hanya berisi **jumlah responden yang memilih** tiap opsi (angka dari ringkasan Google Form). Persentase dihitung otomatis: `Math.round((dipilih / totalResponden) * 100)`.

```typescript
export const DATA_2025_S1 = build2025({
  totalResponden: 17,
  sebaranKelas: [{ kelas: "Kelas 1", jumlah: 4 }, /* … */],
  regulasi: { uu20: 6, uu8: 8, permen48: 6, perda4: 6, pergub40: 8 },
  skill: { mengenali: 15, penanganan: 11, strategi: 9, pembelajaran: 9, penilaian: 9 },
  kemampuan: { wajahSenang: 16, percayaDiri: 13, /* … */ },
});
```

Urutan item di chart mengikuti urutan daftar opsi. Opsi yang tidak diisi angkanya tidak ditampilkan (contoh: 2025 S2 tidak mengisi `percayaDiri`, `keToilet`, `ikutiAturan`).

### Contoh: Chart Segilima "Skill yang Di Dapat" (2025 S1)

| Key | Label pendek (`aspek`) | Teks lengkap (`aspekFull`, tooltip) | Dipilih | Nilai (%) |
|---|---|---|---|---|
| `mengenali` | Mengenali Jenis PDBK... | Mengenali jenis PDBK | 15 | 88 |
| `penanganan` | Cara Penanganan PDBK... | Mengetahui cara penanganan PDBK | 11 | 65 |
| `strategi` | Strategi Pembelajaran... | Mengetahui cara menyusun strategi pembelajaran bagi PDBK | 9 | 53 |
| `pembelajaran` | Pembelajaran Sesuai... | Mampu memberikan pembelajaran sesuai kondisi PDBK | 9 | 53 |
| `penilaian` | Penilaian Hasil Belajar... | Mampu memberikan penilaian hasil belajar PDBK | 9 | 53 |

**Konvensi label:** agar label chart tidak tumpang tindih, `aspek` dipendekkan menjadi sekitar 3 kata + akhiran `...`, sedangkan teks lengkap disimpan di `aspekFull`. Teks lengkap ini muncul sebagai tooltip saat label di-hover, dan sebagai panel detail saat label/bar diketuk (lihat `PolarAngleTick` & `DetailPanel` di `charts.tsx`).

---

## Loader 2026 S1 (`dashboard/src/lib/data.ts`)

- Teks header kolom Google Form yang dibaca loader dikumpulkan di konstanta `COL`. Pencocokan header toleran terhadap spasi ganda/spasi di akhir. **Jika pertanyaan di form diubah, cukup sesuaikan `COL`.** Header yang tidak ditemukan dicatat di log sebagai `[warn] kolom tidak ditemukan: …`.
- Kolom identitas (Nama, Asal sekolah, Timestamp) **tidak dibaca**.
- Jawaban checkbox Guru/Ortu/Siswa dipecah per koma. Jawaban checkbox Kepala Sekolah **tidak** dipecah, karena opsi "Kolaborasi antara sekolah, orang tua, dan …" mengandung koma. Jawaban utuh dicocokkan ke 5 opsi tetap di `KEPSEK_DAMPAK_OPTIONS`.
- Jawaban teks bebas (kebutuhan, saran, testimoni, hal disukai) dibuang jika kosong/placeholder (`-`, `...`, `n/a`, `tidak ada`, dll).
- Nama orang di jawaban teks bebas disensor menjadi `*****` di server (`lib/redact.ts`) sebelum dikirim ke browser. Nama yang diketahui didaftarkan di `NAMES` (atau env `REDACT_NAMES="nama1,nama2"`); kata setelah "ananda", "bernama", atau "namanya" disensor otomatis. Jika ada nama baru muncul di testimoni, tambahkan ke daftar tersebut.

---

## Lokasi File

```
dashboard/src/lib/
├── types.ts              # Definisi tipe data, konstanta periode, seksi kosong
├── data.ts               # Loader data dinamis (Google Sheets) — untuk 2026 S1
└── data-2025.ts          # Data statis 2025 S1 & S2 (Guru only)

dashboard/src/components/
├── DashboardShell.tsx    # Komponen utama: resolve data berdasarkan periode aktif
├── Sidebar.tsx           # Sidebar desktop, menu mobile, toggle tema
├── sections.tsx          # GuruSection, KepsekSection, OrtuSection, SiswaSection
├── nav-meta.ts           # Daftar instrumen: label, ikon, subjudul, nada warna
├── charts.tsx            # Card, Stat, dan grafik ringan HTML/SVG (batang, kolom, donut, radar)
├── WordCloud.tsx         # Word cloud (HTML) + countUniqueWords
└── useTheme.ts           # Hook tema terang/gelap
```

### Alur Resolusi Data (`DashboardShell.tsx`)

```typescript
// Periode berdata statis; yang tidak terdaftar (2026 S1) memakai data server.
const STATIC_DATA: Partial<Record<Period, DashboardData>> = {
  "2025-s2": DATA_2025_S2,
  "2025-s1": DATA_2025_S1,
};
const resolvedData = STATIC_DATA[activePeriod] ?? data;
```

---

## Cara Mengupdate Data

### Update Data 2026 S1
1. Edit/respon Google Form yang terhubung ke Google Sheets.
2. Data otomatis diperbarui di belakang layar paling lambat ±1 menit setelah ada respons baru (ISR, `revalidate = 60` di `app/page.tsx`). Bila Google Sheets gagal diambil, halaman tetap menampilkan data terakhir yang berhasil dan mencoba lagi pada kunjungan berikutnya.
3. Jika teks pertanyaan di form berubah, sesuaikan konstanta `COL` di `data.ts`. Jika nama tab berubah, sesuaikan `*_TAB` di `.env.local`.

### Update Data 2025 S1 atau S2
1. Buka `dashboard/src/lib/data-2025.ts`.
2. Ubah angka `totalResponden`, `sebaranKelas`, atau jumlah pemilih di `regulasi` / `skill` / `kemampuan` pada `DATA_2025_S1` / `DATA_2025_S2`.
3. Untuk mengubah teks opsi, edit daftar opsi (`REGULASI`, `SKILL_GURU`, `KEMAMPUAN_PDBK`); perubahan berlaku untuk kedua semester.
4. Commit dan push ke GitHub — karena data statis, perubahan baru efektif setelah deploy.

### Menambahkan Periode Baru (misal 2024 S1)
1. Tambah `"2024-s1"` ke tipe `Period` di `types.ts`, lalu tambah entry di `PERIODS` dan `PERIOD_SECTIONS` (jika hanya Guru: `["guru"]`).
2. Jika instrumennya sama dengan 2025, tambahkan `export const DATA_2024_S1 = build2025({ … })` (di `data-2025.ts` atau file baru dengan pola yang sama).
3. Daftarkan di `STATIC_DATA` pada `DashboardShell.tsx`.
4. Jika layout Guru-nya mengikuti versi 2025, tambahkan periode tersebut ke kondisi `is2025` di `GuruSection` (`sections.tsx`).

---

## Rendering Khusus 2025 vs 2026 (di `sections.tsx`)

Komponen `GuruSection` memiliki rendering berbeda berdasarkan periode:

| Komponen | 2025 | 2026 |
|---|---|---|
| Sebaran Guru per Kelas | **PieChart** | **BarChart** |
| Keterampilan / Pemahaman | **PolarAreaChart** (pemahaman inklusif) | **HorizontalBarChart** (capaian keterampilan) |
| Skill yang Di Dapat | **PolarAreaChart** (skillYangDidapat) | — (tidak ada) |
| Kemampuan Siswa/i | **BarChartCard** (chartTower) | — (tidak ada) |
| Kebutuhan Pendampingan | — (tidak ada) | `NumberedList` (diisi dari Google Sheets) |

Hal ini dikontrol oleh flag `is2025` di dalam `GuruSection`:
```typescript
const is2025 = period === "2025-s1" || period === "2025-s2";
```
Label "Bagian 1 dari N" dihitung otomatis dari jumlah bagian di `PERIOD_SECTIONS`.
