// Data layer for Dashboard Evaluasi Layanan PDBK
// Loads from Google Sheets via an Apps Script Web App URL.
// Per-tab fetch: Guru/Form Responses 1, Kepsek/Form Responses 2,
// Ortu/Form Responses 3, Siswa/Form Responses 4. Override tab names
// via GURU_TAB / KEPSEK_TAB / ORTU_TAB / SISWA_TAB in dashboard/.env.local.

import "server-only";
import type { DashboardData } from "./types";
export type { DashboardData, GuruData, KepsekData, OrtuData, SiswaData } from "./types";

// ==========================================
// DATA DEMO FALLBACK
// ==========================================
const DEMO: DashboardData = {
  guru: {
    totalResponden: 42,
    sebaranKelas: [{ kelas: "Kelas 1", jumlah: 6 }],
    capaianKeterampilan: [{ skill: "Komunikasi", jumlah: 31 }],
    kebutuhanPendampingan: ["Belum ada data"],
  },
  kepsek: {
    totalResponden: 12,
    sebaranJenjang: [{ name: "SD", value: 5 }],
    dampakProgram: [{ aspek: "Iklim Inklusif", sebelum: 45, sesudah: 82 }],
    saran: ["Belum ada data"],
  },
  ortu: {
    totalResponden: 38,
    capaianManfaat: [{ aspek: "Keterbukaan Guru", nilai: 88 }],
    perubahanPositif: [{ judul: "Testimoni 1", cerita: "Belum ada data" }],
  },
  siswa: {
    totalResponden: 45,
    pengalamanBelajar: [{ aspek: "Kesenangan", nilai: 90 }],
    halDisukai: ["belajar", "bermain", "teman"],
  },
};

// ==========================================
// HELPER FUNCTIONS
// ==========================================
function col(rows: string[][], headerName: string): string[] {
  if (!rows || rows.length === 0) return [];
  const headerRow = rows[0];
  // Normalisasi whitespace: trim + collapse multiple spaces jadi 1.
  // Header Google Form kadang punya spasi ganda yang tidak hilang hanya
  // dengan .trim() — sebelumnya loader gagal match header "perguruan tinggi  ?"
  // (2 spasi) dan jatuh ke DEMO fallback.
  const norm = (s: string) => s.replace(/\s+/g, " ").trim();
  const index = headerRow.findIndex((h) => norm(h) === norm(headerName));
  if (index === -1) return [];
  return rows.slice(1).map((row) => row[index]);
}

function splitList(v: string | undefined): string[] {
  return (v ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

// Filter placeholder umum dari field free-text Guru "Pendampingan yang masih
// dibutuhkan". .filter(Boolean) hanya membuang string kosong, tapi sheet bisa
// berisi placeholder seperti "-", "--", ".", "n/a", atau whitespace-only yang
// lolos filter dan tampil sebagai item invalid di list. Hanya dipakai untuk
// kebutuhanPendampingan (section Guru) -- section lain dibiarkan apa adanya.
function isValidKebutuhan(s: string): boolean {
  const t = s.trim();
  if (!t) return false;
  if (/^[-.\u2026]+$/.test(t)) return false; // "-", "--", ".", "..." (ellipsis char)
  if (/^(n\/?a|tidak ada|kosong|null|none|-)$/i.test(t)) return false;
  return true;
}

function countFreq(arr: string[], keyName: string) {
  const counts = arr.reduce<Record<string, number>>((acc, val) => {
    if (!val) return acc;
    acc[val] = (acc[val] || 0) + 1;
    return acc;
  }, {});
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => ({ [keyName]: k, jumlah: v }));
}

// Sort rows by kelas label natural (Kelas 1, Kelas 2, ..., Kelas 10).
// Baris yang tidak berprefix "Kelas " ditaruh di akhir sort alfabetis.
// Hanya dipakai untuk sebaranKelas (section Guru) -- section lain dibiarkan
// apa adanya (mengikuti urutan countFreq by-count-descending).
function sortByKelas<T extends { kelas: string }>(rows: T[]): T[] {
  const re = /^kelas\s+(\d+)/i;
  return [...rows].sort((a, b) => {
    const ma = a.kelas.match(re);
    const mb = b.kelas.match(re);
    if (ma && mb) return Number(ma[1]) - Number(mb[1]);
    if (ma) return -1; // baris berprefix "Kelas " duluan
    if (mb) return 1;
    return a.kelas.localeCompare(b.kelas);
  });
}

// Potong label panjang jadi ~3 kata + "..." agar pas di radar (mobile &
// desktop) dan tetap terbaca di Stat hint & bar chart skill.
function formatChartLabel(text: string) {
  if (!text) return "";
  const t = text.trim();
  const words = t.split(/\s+/);
  if (words.length <= 3) return t;
  return words.slice(0, 3).join(" ") + "...";
}

// 5 opsi tetap dari pertanyaan Google Form "Hal apakah yang terjadi di sekolah…".
// Digunakan sebagai master list agar chart menampilkan tepat 5 baris (sesuai
// jumlah opsi form), terlepas dari variasi penulisan jawaban responden.
const KEPSEK_DAMPAK_OPTIONS = [
  "Pendampingan membantu sekolah mengidentifikasi kebutuhan peserta didik berkebutuhan khusus",
  "Guru di sekolah saya lebih siap melayani peserta didik berkebutuhan khusus setelah pendampingan",
  "Program pendampingan membantu penyusunan program layanan bagi peserta didik berkebutuhan khusus",
  "Kolaborasi antara sekolah, orang tua, dan pihak pendamping semakin baik",
  "Pendampingan membantu penyelesaian masalah yang dihadapi sekolah terkait pendidikan inklusif",
] as const;

// Normalisasi string untuk matching toleran: lowercase + hapus semua whitespace
// + punctuation + diacritics. Supaya "Pendampingan  membantu…" (spasi ganda) dan
// "Pendampingan membantu…" dipetakan ke opsi yang sama.
function normalizeForMatch(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

// Petakan string jawaban mentah ke SEMUA opsi master yang cocok.
// Return array opsi yang match (kosong jika tidak ada yang mirip).
// Substring match dua arah: cocok jika norm jawaban adalah substring dari
// norm opsi, atau sebaliknya. Untuk pertanyaan checkbox CSV multi-select,
// jawaban responden biasanya concatenation semua opsi dicentang, sehingga
// norm jawaban adalah superstring dari norm setiap opsi dicentang.
function mapToCanonicalOptions(raw: string): string[] {
  const norm = normalizeForMatch(raw);
  if (!norm) return [];
  const matches: string[] = [];
  for (const opt of KEPSEK_DAMPAK_OPTIONS) {
    const optNorm = normalizeForMatch(opt);
    if (optNorm.includes(norm) || norm.includes(optNorm)) matches.push(opt);
  }
  return matches;
}

async function fetchSheetRows(tabName: string): Promise<string[][]> {
  const url = `${process.env.APPS_SCRIPT_URL}?sheet=${encodeURIComponent(tabName)}`;
  let response: Response;
  try {
    response = await fetch(url, { cache: "no-store" });
  } catch (e: unknown) {
    throw new Error(`network: ${(e as Error)?.message || e}`);
  }
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json();
  if (data && data.error) throw new Error(String(data.error));

  if (Array.isArray(data) && data.length > 0 && typeof data[0] === "object" && !Array.isArray(data[0])) {
    const headers = Object.keys(data[0]);
    const rows: string[][] = [headers];
    for (const obj of data) {
      rows.push(headers.map((h) => String(obj[h] || "")));
    }
    return rows;
  }
  return [];
}

// ==========================================
// MAIN LOADER
// ==========================================
export async function loadDashboardData(): Promise<DashboardData> {
  const scriptUrl = process.env.APPS_SCRIPT_URL;
  if (!scriptUrl) return DEMO;

  const tabGuru = process.env.GURU_TAB || "Form Responses 1";
  const tabKepsek = process.env.KEPSEK_TAB || "Form Responses 2";
  const tabOrtu = process.env.ORTU_TAB || "Form Responses 3";
  const tabSiswa = process.env.SISWA_TAB || "Form Responses 4";

  const fetchOne = async (label: string, tab: string) => {
    try {
      const rows = await fetchSheetRows(tab);
      console.log(`[ok ] ${label} ("${tab}"): ${Math.max(0, rows.length - 1)} baris`);
      return rows;
    } catch (e: unknown) {
      console.warn(`[err] ${label} ("${tab}"): ${(e as Error)?.message || e}`);
      return [];
    }
  };

  const [guruRows, kepsekRows, ortuRows, siswaRows] = await Promise.all([
    fetchOne("Guru  ", tabGuru),
    fetchOne("Kepsek", tabKepsek),
    fetchOne("Ortu  ", tabOrtu),
    fetchOne("Siswa ", tabSiswa),
  ]);

  // 1. DATA GURU
  let guruData = DEMO.guru;
  if (guruRows.length >= 2) {
    const keterampilanRaw = col(
      guruRows,
      "Ketrampilan mana sajakah yang sudah dapat Ibu Bapak Guru lakukan setelah adanya program dari perguruan tinggi dalam melayani PDBK?"
    ).flatMap(splitList);

    guruData = {
      totalResponden: guruRows.length - 1,
      // countFreq menghasilkan urutan by-count-desc; sortByKelas mengurutkan ulang
      // berdasarkan nomor kelas natural (Kelas 1, 2, 3, ..., 6) agar X-axis
      // chart "Sebaran Guru per Kelas" tampil rapi dari kiri ke kanan.
      sebaranKelas: sortByKelas(
        countFreq(col(guruRows, "Mengajar"), "kelas") as unknown as { kelas: string; jumlah: number }[],
      ),
      // FIX MISMATCH: field name must be "skill" (HorizontalBarChart nameKey + mostSkill helper).
      // skillFull menyimpan teks asli (sebelum di-truncate oleh formatChartLabel)
      // agar HorizontalBarChart bisa menampilkan tooltip full text saat hover.
      capaianKeterampilan: countFreq(keterampilanRaw, "skill").map((item) => ({
        skill: formatChartLabel(item.skill as string),
        skillFull: String(item.skill).trim(),
        jumlah: item.jumlah,
      })),
      // Filter placeholder umum ("-", "--", ".", "n/a", whitespace-only, dll)
      // BUKAN hanya string kosong, supaya kotak stat "Total Kebutuhan" sinkron
      // dengan list "Pendampingan yang Masih Dibutuhkan". Filter ini HANYA
      // dipakai untuk kebutuhanPendampingan (section Guru) -- section lain
      // dibiarkan apa adanya (lihat catatan di helper isValidKebutuhan).
      kebutuhanPendampingan: col(guruRows, "Pendampingan apa yang masih dibutuhkan?").filter(isValidKebutuhan),
    };
  }

  // 2. DATA KEPALA SEKOLAH
  let kepsekData = DEMO.kepsek;
  if (kepsekRows.length >= 2) {
    // Sheet tidak punya data "Sebelum". sebelum = 0 -> radar tampilkan 1 polygon (sesudah/capaian).
    // Total responden kepsek (exclude header) untuk konversi count -> persen.
    const totalKepsek = kepsekRows.length - 1;
    // Ambil string jawaban per row responden (CSV multi-select, JANGAN split
    // dulu — lihat catatan BUGFIX di bawah).
    const halKepsekCol = col(
      kepsekRows,
      "Hal apakah yang terjadi di sekolah Ibu Bapak Guru lakukan setelah adanya program dari perguruan tinggi dalam melayani PDBK?"
    );

    // Petakan setiap jawaban mentah ke salah satu dari 5 opsi master form,
    // lalu hitung frekuensi per opsi. Opsi yang tidak dipilih responden tetap
    // muncul dengan count=0 agar chart selalu menampilkan tepat 5 baris.
    //
    // BUGFIX: Opsi "Kolaborasi antara sekolah, orang tua, dan pihak pendamping"
    // punya koma INTERNAL di teks opsi itu sendiri. splitList memecah pada setiap
    // koma, sehingga satu opsi terpecah jadi beberapa token ("Kolaborasi antara
    // sekolah", "orang tua", "dan pihak pendamping semakin baik") dan ketiganya
    // match ke opsi yang sama via substring — menyebabkan over-counting (mis.
    // "Kolaborasi" jadi 3 padahal respondennya hanya 2). Solusi: JANGAN split
    // untuk pertanyaan checkbox ini; match string utuh per row responden dulu.
    // splitList hanya dipakai sebagai fallback kalau match utuh gagal.
    const countMap = new Map<string, number>();
    for (const opt of KEPSEK_DAMPAK_OPTIONS) countMap.set(opt, 0);
    for (const row of halKepsekCol) {
      if (!row || !row.trim()) continue;
      for (const canon of mapToCanonicalOptions(row)) {
        countMap.set(canon, (countMap.get(canon) ?? 0) + 1);
      }
    }

    const dampakProgram = KEPSEK_DAMPAK_OPTIONS.map((opt) => {
      const count = countMap.get(opt) ?? 0;
      return {
        aspek: formatChartLabel(opt),
        aspekFull: opt,
        sebelum: 0,
        sebelumCount: 0,
        sesudah: totalKepsek > 0 ? Math.round((count / totalKepsek) * 100) : 0,
        sesudahCount: count,
      };
    });

    kepsekData = {
      totalResponden: kepsekRows.length - 1,
      // FIX MISMATCH: DonutChart expects {name, value}.
      sebaranJenjang: countFreq(col(kepsekRows, "Jenjang"), "name").map((item) => ({
        name: String(item.name),
        value: item.jumlah,
      })),
      dampakProgram: dampakProgram.length > 0 ? dampakProgram : DEMO.kepsek.dampakProgram,
      saran: col(kepsekRows, "Saran untuk perbaikan program pendampingan").filter(Boolean),
    };
  }

  // 3. DATA ORANG TUA
  let ortuData = DEMO.ortu;
  if (ortuRows.length >= 2) {
    // Konversi frekuensi -> persentase terhadap total responden ortu (renderer Stat pakai %).
    const totalOrtu = ortuRows.length - 1;
    const perolehOrtuRaw = col(
      ortuRows,
      "Hal apakah yang Ibu Bapak peroleh setelah mendapat layanan asesmen dari perguruan tinggi ?"
    ).flatMap(splitList);

    const capaianManfaat = countFreq(perolehOrtuRaw, "aspek").map((item) => ({
      aspek: formatChartLabel(item.aspek as string),
      aspekFull: String(item.aspek).trim(),
      nilai: Math.round((item.jumlah / Math.max(1, totalOrtu)) * 100),
    }));

    ortuData = {
      totalResponden: totalOrtu,
      capaianManfaat: capaianManfaat.length > 0 ? capaianManfaat : DEMO.ortu.capaianManfaat,
      // FIX MISMATCH: renderer expects {judul, cerita}[] not string[].
      perubahanPositif: col(ortuRows, "Perubahan positif yang terlihat pada anak setelah program pendampingan")
        .filter(Boolean)
        .map((cerita, index) => ({
          judul: `Testimoni ${index + 1}`,
          cerita,
        })),
    };
  }

  // 4. DATA SISWA
  let siswaData = DEMO.siswa;
  if (siswaRows.length >= 2) {
    // Konversi frekuensi -> persentase terhadap total responden siswa.
    const totalSiswa = siswaRows.length - 1;
    const pengalamanSiswaRaw = col(
      siswaRows,
      "Pengalaman belajar setelah dapat layanan asesmen"
    ).flatMap(splitList);

    const pengalamanBelajar = countFreq(pengalamanSiswaRaw, "aspek").map((item) => ({
      aspek: formatChartLabel(item.aspek as string),
      aspekFull: String(item.aspek).trim(),
      nilai: Math.round((item.jumlah / Math.max(1, totalSiswa)) * 100),
    }));

    siswaData = {
      totalResponden: totalSiswa,
      pengalamanBelajar: pengalamanBelajar.length > 0 ? pengalamanBelajar : DEMO.siswa.pengalamanBelajar,
      halDisukai: col(siswaRows, "Hal yang paling saya sukai di sekolah")
        .flatMap(splitList)
        .filter(Boolean),
    };
  }

  return { guru: guruData, kepsek: kepsekData, ortu: ortuData, siswa: siswaData };
}
