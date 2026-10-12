// Data layer untuk periode live (2026 S1):
// Google Form → Google Sheets → Apps Script Web App (JSON) → loader ini.
// Satu tab per instrumen (default "Form Responses 1" s/d 4); override nama tab
// via GURU_TAB / KEPSEK_TAB / ORTU_TAB / SISWA_TAB di dashboard/.env.local.
//
// Jika APPS_SCRIPT_URL kosong atau tab belum punya respons, seksi tsb
// dikembalikan KOSONG — dashboard tidak pernah menampilkan angka contoh
// seolah-olah hasil survei.
//
// Caching: halaman di-render statis (ISR, `revalidate` di app/page.tsx) dan
// diperbarui di belakang layar, jadi pengunjung tidak menunggu Apps Script.
// Bila sebuah tab GAGAL diambil saat pembaruan di produksi, loader melempar
// error → Next.js tetap menyajikan halaman terakhir yang berhasil (bukan
// seksi kosong) dan mencoba lagi pada request berikutnya.

import "server-only";
import { PHASE_PRODUCTION_BUILD } from "next/constants";
import type { DashboardData, GuruData, KepsekData, OrtuData, SiswaData } from "./types";
import { EMPTY_GURU, EMPTY_KEPSEK, EMPTY_ORTU, EMPTY_SISWA } from "./types";
import { redactNames } from "./redact";

// Pembaruan berjalan di belakang layar, jadi timeout boleh longgar: Apps Script
// kadang butuh >15 detik.
const FETCH_TIMEOUT_MS = 25_000;

// Teks header kolom Google Form yang dibaca loader. Dicocokkan setelah
// normalisasi spasi, jadi spasi ganda / spasi di akhir header tetap match.
// Kalau pertanyaan di form diubah, cukup sesuaikan di sini.
const COL = {
  guruKelas: "Mengajar",
  guruKeterampilan:
    "Ketrampilan mana sajakah yang sudah dapat Ibu Bapak Guru lakukan setelah adanya program dari perguruan tinggi dalam melayani PDBK?",
  guruKebutuhan: "Pendampingan apa yang masih dibutuhkan?",
  kepsekJenjang: "Jenjang",
  kepsekDampak:
    "Hal apakah yang terjadi di sekolah Ibu Bapak Guru lakukan setelah adanya program dari perguruan tinggi dalam melayani PDBK?",
  kepsekSaran: "Saran untuk perbaikan program pendampingan",
  ortuManfaat: "Hal apakah yang Ibu Bapak peroleh setelah mendapat layanan asesmen dari perguruan tinggi ?",
  ortuPerubahan: "Perubahan positif yang terlihat pada anak setelah program pendampingan",
  siswaPengalaman: "Pengalaman belajar setelah dapat layanan asesmen",
  siswaDisukai: "Hal yang paling saya sukai di sekolah",
} as const;

// 5 opsi tetap pertanyaan checkbox Kepala Sekolah. Chart selalu menampilkan
// kelima opsi ini (opsi yang tidak dipilih tetap muncul dengan nilai 0).
const KEPSEK_DAMPAK_OPTIONS = [
  "Pendampingan membantu sekolah mengidentifikasi kebutuhan peserta didik berkebutuhan khusus",
  "Guru di sekolah saya lebih siap melayani peserta didik berkebutuhan khusus setelah pendampingan",
  "Program pendampingan membantu penyusunan program layanan bagi peserta didik berkebutuhan khusus",
  "Kolaborasi antara sekolah, orang tua, dan pihak pendamping semakin baik",
  "Pendampingan membantu penyelesaian masalah yang dihadapi sekolah terkait pendidikan inklusif",
] as const;

/** Satu tab sheet: satu objek per respons, key = teks header kolom. */
type Sheet = Record<string, unknown>[];

// ==========================================
// HELPERS
// ==========================================
const normHeader = (s: string) => s.replace(/\s+/g, " ").trim();

/** Ambil nilai satu kolom (di-trim) berdasarkan teks header. */
function column(sheet: Sheet, header: string): string[] {
  if (sheet.length === 0) return [];
  const key = Object.keys(sheet[0]).find((k) => normHeader(k) === normHeader(header));
  if (key === undefined) {
    console.warn(`[warn] kolom tidak ditemukan: "${header}"`);
    return [];
  }
  return sheet.map((row) => String(row[key] ?? "").trim());
}

/** Pecah jawaban checkbox Google Form ("A, B, C") menjadi daftar opsi. */
function splitList(v: string): string[] {
  return v
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Buang isian kosong/placeholder ("-", "...", "n/a", "tidak ada", dll) dari jawaban teks bebas. */
function isMeaningful(s: string): boolean {
  const t = s.trim();
  if (!t) return false;
  if (/^[-.…]+$/.test(t)) return false;
  return !/^(n\/?a|tidak ada|kosong|null|none)$/i.test(t);
}

/** Frekuensi tiap nilai non-kosong, urut dari yang terbanyak. */
function countFreq(values: string[]): { label: string; jumlah: number }[] {
  const counts = new Map<string, number>();
  for (const v of values) if (v) counts.set(v, (counts.get(v) ?? 0) + 1);
  return [...counts].map(([label, jumlah]) => ({ label, jumlah })).sort((a, b) => b.jumlah - a.jumlah);
}

const percent = (n: number, total: number) => (total > 0 ? Math.round((n / total) * 100) : 0);

/** Urutkan label kelas secara natural (Kelas 1, 2, …, 10); label lain di akhir, alfabetis. */
function sortByKelas<T extends { kelas: string }>(rows: T[]): T[] {
  const re = /^kelas\s+(\d+)/i;
  return [...rows].sort((a, b) => {
    const ma = a.kelas.match(re);
    const mb = b.kelas.match(re);
    if (ma && mb) return Number(ma[1]) - Number(mb[1]);
    if (ma) return -1;
    if (mb) return 1;
    return a.kelas.localeCompare(b.kelas);
  });
}

/** Pendekkan label jadi maks. 3 kata + "..." agar muat di sumbu chart. */
function shortLabel(text: string): string {
  const t = text.trim();
  const words = t.split(/\s+/);
  return words.length <= 3 ? t : words.slice(0, 3).join(" ") + "...";
}

/** Persentase responden yang memilih tiap opsi checkbox, urut dari yang terbanyak. */
function optionShares(answers: string[], total: number) {
  return countFreq(answers.flatMap(splitList)).map(({ label, jumlah }) => ({
    aspek: shortLabel(label),
    aspekFull: label,
    nilai: percent(jumlah, total),
  }));
}

// lowercase + tanpa diakritik, spasi, dan tanda baca → pencocokan toleran.
const normalizeForMatch = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]/g, "");

// ==========================================
// PARSER PER INSTRUMEN
// ==========================================
function parseGuru(sheet: Sheet): GuruData {
  if (sheet.length === 0) return EMPTY_GURU;
  return {
    totalResponden: sheet.length,
    sebaranKelas: sortByKelas(
      countFreq(column(sheet, COL.guruKelas)).map(({ label, jumlah }) => ({ kelas: label, jumlah })),
    ),
    capaianKeterampilan: countFreq(column(sheet, COL.guruKeterampilan).flatMap(splitList)).map(
      ({ label, jumlah }) => ({ skill: shortLabel(label), skillFull: label, jumlah }),
    ),
    kebutuhanPendampingan: column(sheet, COL.guruKebutuhan).filter(isMeaningful).map(redactNames),
  };
}

function parseKepsek(sheet: Sheet): KepsekData {
  if (sheet.length === 0) return EMPTY_KEPSEK;
  const total = sheet.length;
  // Jawaban TIDAK di-split per koma: opsi "Kolaborasi antara sekolah, orang tua,
  // dan …" punya koma di dalam teksnya, sehingga split akan memecahnya jadi
  // beberapa token dan menghitungnya ganda. Sebagai gantinya, jawaban utuh
  // (gabungan semua opsi yang dicentang) dicek apakah memuat teks tiap opsi.
  const answers = column(sheet, COL.kepsekDampak).map(normalizeForMatch).filter(Boolean);
  return {
    totalResponden: total,
    sebaranJenjang: countFreq(column(sheet, COL.kepsekJenjang)).map(({ label, jumlah }) => ({
      name: label,
      value: jumlah,
    })),
    dampakProgram: KEPSEK_DAMPAK_OPTIONS.map((opt) => {
      const o = normalizeForMatch(opt);
      const count = answers.filter((a) => a.includes(o) || o.includes(a)).length;
      return { aspek: shortLabel(opt), aspekFull: opt, sesudah: percent(count, total), sesudahCount: count };
    }),
    saran: column(sheet, COL.kepsekSaran).filter(isMeaningful).map(redactNames),
  };
}

function parseOrtu(sheet: Sheet): OrtuData {
  if (sheet.length === 0) return EMPTY_ORTU;
  return {
    totalResponden: sheet.length,
    capaianManfaat: optionShares(column(sheet, COL.ortuManfaat), sheet.length),
    perubahanPositif: column(sheet, COL.ortuPerubahan)
      .filter(isMeaningful)
      .map((cerita, i) => ({ judul: `Testimoni ${i + 1}`, cerita: redactNames(cerita) })),
  };
}

function parseSiswa(sheet: Sheet): SiswaData {
  if (sheet.length === 0) return EMPTY_SISWA;
  return {
    totalResponden: sheet.length,
    pengalamanBelajar: optionShares(column(sheet, COL.siswaPengalaman), sheet.length),
    halDisukai: column(sheet, COL.siswaDisukai).filter(isMeaningful).map(redactNames),
  };
}

// ==========================================
// FETCH
// ==========================================
async function fetchSheet(baseUrl: string, tab: string): Promise<Sheet> {
  const url = new URL(baseUrl);
  url.searchParams.set("sheet", tab);
  // Tanpa opsi `cache`: fetch tidak di-cache sendiri, tapi juga tidak memaksa
  // halaman jadi dinamis — kesegaran data diatur oleh `revalidate` halaman.
  const res = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const body: unknown = await res.json();
  if (body && typeof body === "object" && "error" in body) throw new Error(String(body.error));
  if (!Array.isArray(body)) throw new Error("respons bukan array");
  return body.filter((r): r is Record<string, unknown> => !!r && typeof r === "object" && !Array.isArray(r));
}

export async function loadDashboardData(): Promise<DashboardData> {
  const baseUrl = process.env.APPS_SCRIPT_URL;
  if (!baseUrl) {
    console.warn("[warn] APPS_SCRIPT_URL belum di-set; data 2026 S1 ditampilkan kosong.");
    return { guru: EMPTY_GURU, kepsek: EMPTY_KEPSEK, ortu: EMPTY_ORTU, siswa: EMPTY_SISWA };
  }

  const failed: string[] = [];
  const load = async (label: string, tab: string): Promise<Sheet> => {
    try {
      const sheet = await fetchSheet(baseUrl, tab);
      console.log(`[ok ] ${label} ("${tab}"): ${sheet.length} baris`);
      return sheet;
    } catch (e: unknown) {
      console.warn(`[err] ${label} ("${tab}"): ${e instanceof Error ? e.message : String(e)}`);
      failed.push(label.trim());
      return [];
    }
  };

  const [guru, kepsek, ortu, siswa] = await Promise.all([
    load("Guru  ", process.env.GURU_TAB || "Form Responses 1"),
    load("Kepsek", process.env.KEPSEK_TAB || "Form Responses 2"),
    load("Ortu  ", process.env.ORTU_TAB || "Form Responses 3"),
    load("Siswa ", process.env.SISWA_TAB || "Form Responses 4"),
  ]);

  // Pembaruan ISR di produksi: lempar error agar Next.js tetap menyajikan data
  // terakhir yang berhasil. Saat `next build` (belum ada data lama) dan saat
  // development, seksi yang gagal tetap ditampilkan kosong seperti sebelumnya.
  const isRevalidation =
    process.env.NODE_ENV === "production" && process.env.NEXT_PHASE !== PHASE_PRODUCTION_BUILD;
  if (failed.length > 0 && isRevalidation) {
    throw new Error(`Gagal mengambil data ${failed.join(", ")}; data terakhir tetap ditampilkan.`);
  }

  return {
    guru: parseGuru(guru),
    kepsek: parseKepsek(kepsek),
    ortu: parseOrtu(ortu),
    siswa: parseSiswa(siswa),
  };
}
