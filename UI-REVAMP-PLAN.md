# UI/UX Revamp Plan — PandaiBesi Dashboard

> **Status**: Fase 1 selesai (dokumen rencana). **Berhenti di sini, menunggu persetujuan sebelum Fase 2.**
> **Tanggal**: 9 September 2026
> **Scope**: UI/UX only. Logic, data fetching, skema data, dan koneksi database **tidak** disentuh.

---

## 1. Inventaris Komponen

| # | File | Baris | Aksi Fase | Logic Locked? | Catatan |
|---|---|---|---|---|---|
| 1 | `src/app/layout.tsx` | 59 | Fase 2 | ❌ (UI shell) | RootLayout, font, theme init script |
| 2 | `src/app/globals.css` | 408 | **Fase 2 (besar)** | ❌ (token) | Token warna, radius, shadow, animasi |
| 3 | `src/app/page.tsx` | 14 | **JANGAN** | ✅ **LOCKED** | Server Component loader + Suspense |
| 4 | `src/components/ThemeProvider.tsx` | 82 | Fase 2 (sentuh ringan) | ❌ | Sudah OK, mungkin polish kecil |
| 5 | `src/components/DashboardShell.tsx` | 68 | Fase 3.1 | ❌ (UI container) | Layout shell, period/section state |
| 6 | `src/components/Sidebar.tsx` | 396 | Fase 3.2 / 3.3 / 3.4 | ❌ | Desktop sidebar, mobile tabs, section renderers |
| 7 | `src/components/sections.tsx` | 284 | Fase 3.5 | ❌ | GuruSection, KepsekSection, OrtuSection, SiswaSection |
| 8 | `src/components/charts.tsx` | 871 | Fase 3.6 | ❌ | Card, Stat, BarChartCard, dll (visual wrapper) |
| 9 | `src/components/WordCloud.tsx` | 245 | **JANGAN** | ❌ | Library wrapper, fokus polish di sections |

### File dengan **LOGIC LOCKED** (tidak disentuh di semua fase):

- `src/lib/data.ts` — loader Google Sheets
- `src/lib/data-2025-s1.ts` — data statis Guru 2025 S1
- `src/lib/data-2025-s2.ts` — data statis Guru 2025 S2
- `src/lib/types.ts` — definisi tipe & konstanta periode
- `src/app/page.tsx` — entry Server Component + Suspense

---

## 2. Prinsip Panduan (dari folder referensi ECC)

| Sumber ECC | Aturan yang Dipakai |
|---|---|
| `rules/react/coding-style.md` | `type Props = {}`; default Server Component; `"use client"` hanya jika butuh state/effect/event handler |
| `rules/react/patterns.md` | Container/Presentational split; Suspense + Error Boundary pair (sudah ada di `page.tsx`) |
| `rules/react/hooks.md` | Default **JANGAN** memoize (`useMemo`/`useCallback`); cleanup semua subscription; lazy init hanya kalau init mahal |
| `rules/react/security.md` | `target="_blank"` → `rel="noopener noreferrer"`; tidak tambah `dangerouslySetInnerHTML` baru |
| `rules/typescript/coding-style.md` | `type` untuk prop komponen; `interface` untuk object extensible; **no `any`**; `Readonly<T>` untuk props |
| `skills/frontend-a11y/SKILL.md` | `aria-label` di icon button; `prefers-reduced-motion` dihormati; skip-to-content link; semantic landmarks |
| `skills/react-patterns/SKILL.md` | Derived state **during render** (bukan `useEffect`); `useTransition` untuk non-urgent update (ganti periode) |
| `skills/frontend-patterns/SKILL.md` | Composition over inheritance; Card primitive (Header/Body/Footer) terpisah |
| `skills/react-performance/SKILL.md` | Hindari `useMemo`/`useCallback` prematur; jaga bundle size; Suspense boundary sedekat mungkin dengan data |

---

## 3. Fase Pelaksanaan

### Fase 2 — Global Layout (polish fondasi)

| File | Perubahan |
|---|---|
| `src/app/layout.tsx` | Tambah **skip-to-main-content link** (a11y). Tidak ubah font, theme init script, atau `<html>` attributes. |
| `src/app/globals.css` | Redesain token: palette (slate/indigo/amber), shadow scale, radius, easing. Tambah utility class untuk `skeleton`, `empty-state`, `focus-ring` (Tailwind 4 `@theme`). |
| `src/components/ThemeProvider.tsx` | Review: pastikan `aria-label` di-toggle, `useSyncExternalStore` aman. Kemungkinan tidak berubah. |

**Validasi Fase 2**:
- `cd dashboard && npm run lint` → 0 errors (warning pre-existing 26 tetap)
- `cd dashboard && npm run build` → lulus
- **File `page.tsx` & `lib/*` byte-identical** (diverifikasi via `git diff`)

### Fase 3 — Per-komponen (berurutan, validasi per sub-fase)

| Sub-fase | File | Perubahan Visual Utama |
|---|---|---|
| **3.1** | `DashboardShell.tsx` | Container `max-w-7xl` + padding scale responsif; sticky period-pill opsional; `<main id="main-content">` jadi target skip-link. State & handler **tidak** diubah. |
| **3.2** | `Sidebar.tsx` (desktop) | Brand block (logo + nama); section list (Guru/Kepsek/Ortu/Siswa) dengan emoji + label; period selector di bawah; theme toggle di footer. Focus ring visible; hover/active state konsisten. |
| **3.3** | `Sidebar.tsx` (MobileTabs) | Top bar mobile: brand mini, section chips dengan horizontal scroll, theme toggle inline. `aria-label` diperjelas. |
| **3.4** | `Sidebar.tsx` (renderers) | Section header (eyebrow + title + subtitle) tetap di `sections.tsx`. Empty/loading state untuk `NumberedList`. |
| **3.5** | `sections.tsx` (4 sections) | Stat grid 2/4 kolom responsif; card spacing konsisten; empty state untuk data kosong; dark/light parity. **Input prop type tidak berubah.** |
| **3.6** | `charts.tsx` (Card, Stat, BarChartCard, dll) | Card primitive: header/body/footer slots. Stat: icon + label + value + hint + tone. Tooltip Recharts style. **Query Recharts tidak diubah**, hanya wrapper visual. |
| **3.7** | (skip) | ThemeProvider tidak perlu disentuh. |

**Validasi per sub-fase** (3.1 → 3.6):
- `npm run lint` → 0 errors
- `npm run build` → lulus
- Visual diff review (baca output, cek class Tailwind)
- `git diff` untuk memastikan **tidak ada perubahan** di file `lib/*` dan `page.tsx`

---

## 4. Yang TIDAK Dilakukan (eksplisit)

| ❌ Larangan | Alasan |
|---|---|
| Tambah dependency baru (framer-motion, @tanstack/table, dll) | "No new heavy dependencies" + ECC YAGNI |
| Edit `data.ts`, `data-2025-s1.ts`, `data-2025-s2.ts`, `types.ts` | **Logic is Sacred** |
| Edit logic `page.tsx` (loader + Suspense) | Komponen entry server — biarkan |
| Ganti framework / refactor arsitektur | Di luar scope |
| Tambah fitur (filter, sort, export) | "Tanpa mengubah fitur inti" |
| Auto-commit / push ke git | Anda yang kendalikan |
| Ubah struktur data (PERIOD, SectionKey, dsb) | Logic is Sacred |

---

## 5. Standar Kualitas per Sub-fase

Sebelum declare "selesai" untuk satu sub-fase:

1. `npm run lint` lulus (0 errors, warnings pre-existing boleh)
2. `npm run build` lulus tanpa warning baru
3. Tidak ada file di `lib/*` atau `page.tsx` yang terubah
4. Tidak ada `useMemo`/`useCallback` baru (kecuali ada profil yang membuktikan perlu)
5. Tidak ada `any` baru
6. Icon button punya `aria-label`
7. Jika ada transisi/animasi, hormati `prefers-reduced-motion` (cek di `globals.css`)

---

## 6. Estimasi Diff

| Fase | File | Estimasi Baris Berubah |
|---|---|---|
| 2 | `layout.tsx` | +5–10 |
| 2 | `globals.css` | ±120–200 (rewrite token block) |
| 3.1 | `DashboardShell.tsx` | ±20–40 |
| 3.2 + 3.3 | `Sidebar.tsx` (nav parts only) | ±80–150 |
| 3.5 | `sections.tsx` | ±60–120 |
| 3.6 | `charts.tsx` (visual wrapper only) | ±100–200 |
| **Total** | | **±400–700 baris** |

---

## 7. Titik Berhenti (Gate)

- **Setelah Fase 1 (dokumen ini)**: berhenti, tunggu persetujuan Anda.
- **Setelah Fase 2 (global layout)**: berhenti, tunjukkan ringkasan perubahan, tunggu persetujuan sebelum Fase 3.
- **Per sub-fase 3.1–3.6**: laporan singkat perubahan + hasil `lint`/`build`, lalu lanjut otomatis kecuali Anda menahan.

