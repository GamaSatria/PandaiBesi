// Data layer for Dashboard Evaluasi Layanan PDBK
// Loads from Google Sheets when env vars are configured, otherwise falls back to demo data.
//
// Set:
//   GOOGLE_SHEET_ID   (spreadsheet id, found in the sheet URL)
//   GOOGLE_SHEET_TAB  (optional, defaults to first tab)
//   GOOGLE_SERVICE_ACCOUNT_JSON  (service-account JSON, base64 OR raw)
// See README for the one-time Google Cloud setup.

import "server-only";
import type { DashboardData } from "./types";
export type { DashboardData, GuruData, KepsekData, OrtuData, SiswaData } from "./types";

// ---------- Demo data (visible when no Google Sheets is configured) ----------
const DEMO: DashboardData = {
  guru: {
    totalResponden: 42,
    sebaranKelas: [
      { kelas: "Kelas 1", jumlah: 6 },
      { kelas: "Kelas 2", jumlah: 7 },
      { kelas: "Kelas 3", jumlah: 8 },
      { kelas: "Kelas 4", jumlah: 9 },
      { kelas: "Kelas 5", jumlah: 7 },
      { kelas: "Kelas 6", jumlah: 5 },
    ],
    capaianKeterampilan: [
      { skill: "Komunikasi verbal/non-verbal", jumlah: 31 },
      { skill: "Interaksi sosial dengan teman", jumlah: 27 },
      { skill: "Kemandirian hidup sehari-hari", jumlah: 24 },
      { skill: "Motorik halus (menulis, menggambar)", jumlah: 19 },
      { skill: "Literasi & numerasi dasar", jumlah: 18 },
      { skill: "Regulasi emosi", jumlah: 16 },
    ],
    kebutuhanPendampingan: [
      "Pelatihan strategi komunikasi Augmentative and Alternative Communication (AAC)",
      "Pendampingan psikolog untuk regulasi emosi peserta didik",
      "Workshop differensiasi pembelajaran untuk kelas inklusif",
      "Bantuan alat bantu motorik dan adaptif di kelas",
      "Pendampingan rutin dari guru sombra (shadow teacher)",
    ],
  },
  kepsek: {
    totalResponden: 18,
    sebaranJenjang: [
      { name: "PAUD", value: 3 },
      { name: "SD", value: 7 },
      { name: "SMP", value: 4 },
      { name: "SMA", value: 2 },
      { name: "SMK", value: 1 },
      { name: "Kesetaraan", value: 1 },
    ],
    dampakProgram: [
      { aspek: "Iklim Inklusif", sebelum: 35, sesudah: 78 },
      { aspek: "Kesiapan Guru", sebelum: 42, sesudah: 81 },
      { aspek: "Keterlibatan Orang Tua", sebelum: 50, sesudah: 75 },
      { aspek: "Aksesibilitas Sarana", sebelum: 30, sesudah: 65 },
      { aspek: "Hasil Belajar PDBK", sebelum: 38, sesudah: 72 },
    ],
    saran: [
      "Perluas pelatihan sensoris integrasi untuk guru kelas.",
      "Sediakan anggaran rutin untuk alat bantu adaptif.",
      "Bentuk komunitas praktik (CoP) antar sekolah inklusif.",
      "Libatkan psikolog sekolah secara berkala.",
      "Dorong kebijakan zonasi inklusif di dinas pendidikan.",
    ],
  },
  ortu: {
    totalResponden: 56,
    capaianManfaat: [
      { aspek: "Keterbukaan guru menerima kondisi anak", nilai: 88 },
      { aspek: "Kenyamanan anak di lingkungan sekolah", nilai: 82 },
      { aspek: "Kemajuan kemampuan komunikasi anak", nilai: 74 },
      { aspek: "Dukungan sekolah terhadap kebutuhan khusus", nilai: 79 },
      { aspek: "Keterlibatan orang tua dalam rencana belajar", nilai: 71 },
    ],
    perubahanPositif: [
      {
        judul: "Lebih berani bersosialisasi",
        cerita:
          "Anak saya sekarang berani menyapa tetangga dan ikut kegiatan di kelas tanpa dipaksa.",
      },
      {
        judul: "Mulai bisa menulis namanya",
        cerita:
          "Setelah 3 bulan pendampingan, motorik halusnya membaik dan ia senang menulis sendiri.",
      },
      {
        judul: "Tidak mudah tantrum",
        cerita:
          "Guru mengajarkan teknik regulasi emosi yang kami lanjutkan di rumah.",
      },
      {
        judul: "Mandiri saat makan & berpakaian",
        cerita:
          "Pelatihan ADL dari guru sangat membantu kemandirian harian anak.",
      },
    ],
  },
  siswa: {
    totalResponden: 64,
    pengalamanBelajar: [
      { aspek: "Kesenangan belajar di sekolah", nilai: 86 },
      { aspek: "Keberanian bertanya", nilai: 72 },
      { aspek: "Merasa aman & diterima teman", nilai: 90 },
      { aspek: "Senang bekerja kelompok", nilai: 78 },
      { aspek: "Percaya diri tampil di depan kelas", nilai: 68 },
    ],
    halDisukai: [
      "belajar bersama teman",
      "menggambar",
      "bermain di luar kelas",
      "pelajaran musik",
      "kegiatan olahraga",
      "kebun sekolah",
      "perpustakaan",
      "waktu istirahat bersama",
    ],
  },
};

// ---------- Google Sheets adapter ----------
// Expected sheet layout (one row per response):
//   Row 1 headers — used to detect column index by header name.
// The transformers below split comma-separated checkbox cells (per PRD note).
function splitList(v: string | undefined): string[] {
  return (v ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function countBy(values: string[]): Record<string, number> {
  return values.reduce<Record<string, number>>((acc, v) => {
    acc[v] = (acc[v] ?? 0) + 1;
    return acc;
  }, {});
}

async function fetchSheetRows(): Promise<string[][]> {
  const { google } = await import("googleapis");
  const sheetId = process.env.GOOGLE_SHEET_ID;
  const tab = process.env.GOOGLE_SHEET_TAB ?? "0";
  const rawCreds =
    process.env.GOOGLE_SERVICE_ACCOUNT_JSON ??
    process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON ??
    "";
  if (!sheetId || !rawCreds) throw new Error("Sheets not configured");

  const creds = JSON.parse(
    Buffer.from(rawCreds, "base64").toString("utf8"),
  );
  const auth = new google.auth.GoogleAuth({
    credentials: creds,
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
  const sheets = google.sheets({ version: "v4", auth });
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: tab,
  });
  return (res.data.values as string[][]) ?? [];
}

function col(rows: string[][], header: string): string[] {
  if (rows.length === 0) return [];
  const idx = rows[0].indexOf(header);
  if (idx < 0) return [];
  return rows.slice(1).map((r) => r[idx] ?? "");
}

export async function loadDashboardData(): Promise<DashboardData> {
  try {
    const rows = await fetchSheetRows();
    if (rows.length < 2) return DEMO;

    // ---- Guru ----
    const guruKelas = col(rows, "Kelas yang diajar");
    const guruSkill = splitList(col(rows, "Keterampilan baru yang dikuasai").join("|"))
      .filter((v) => v.includes(",") ? false : true); // noop safeguard
    // safer: split the joined column directly
    const skillsFlat = col(rows, "Keterampilan baru yang dikuasai")
      .flatMap(splitList);
    const kebutuhan = col(rows, "Pendampingan yang masih dibutuhkan");

    // ---- Kepsek ----
    const jenjang = col(rows, "Jenjang sekolah");
    // dampak is multi-aspek Likert (5 kolom: Sebelum/Sesudah per aspek)
    const aspekNames = [
      "Iklim Inklusif",
      "Kesiapan Guru",
      "Keterlibatan Orang Tua",
      "Aksesibilitas Sarana",
      "Hasil Belajar PDBK",
    ];
    const dampak = aspekNames.map((a) => ({
      aspek: a,
      sebelum: Number(col(rows, `Sebelum - ${a}`)[0] ?? 0) || 0,
      sesudah: Number(col(rows, `Sesudah - ${a}`)[0] ?? 0) || 0,
    }));
    const saran = col(rows, "Saran perbaikan").filter(Boolean);

    // ---- Ortu ----
    const ortuAspek = [
      "Keterbukaan guru menerima kondisi anak",
      "Kenyamanan anak di lingkungan sekolah",
      "Kemajuan kemampuan komunikasi anak",
      "Dukungan sekolah terhadap kebutuhan khusus",
      "Keterlibatan orang tua dalam rencana belajar",
    ];
    const ortuManfaat = ortuAspek.map((a) => ({
      aspek: a,
      nilai: Number(col(rows, `Nilai - ${a}`)[0] ?? 0) || 0,
    }));
    const perubahan = col(rows, "Perubahan positif pada anak")
      .filter(Boolean)
      .map((cerita, i) => ({ judul: `Testimoni ${i + 1}`, cerita }));

    // ---- Siswa ----
    const siswaAspek = [
      "Kesenangan belajar di sekolah",
      "Keberanian bertanya",
      "Merasa aman & diterima teman",
      "Senang bekerja kelompok",
      "Percaya diri tampil di depan kelas",
    ];
    const siswaPengalaman = siswaAspek.map((a) => ({
      aspek: a,
      nilai: Number(col(rows, `Nilai - ${a}`)[0] ?? 0) || 0,
    }));
    const halDisukai = col(rows, "Hal yang paling disukai")
      .flatMap(splitList);

    return {
      guru: {
        totalResponden: rows.length - 1,
        sebaranKelas: Object.entries(countBy(guruKelas)).map(([kelas, jumlah]) => ({
          kelas,
          jumlah,
        })),
        capaianKeterampilan: Object.entries(countBy(skillsFlat))
          .map(([skill, jumlah]) => ({ skill, jumlah }))
          .sort((a, b) => b.jumlah - a.jumlah),
        kebutuhanPendampingan: kebutuhan.filter(Boolean),
      },
      kepsek: {
        totalResponden: rows.length - 1,
        sebaranJenjang: Object.entries(countBy(jenjang)).map(([name, value]) => ({
          name,
          value,
        })),
        dampakProgram: dampak,
        saran,
      },
      ortu: {
        totalResponden: rows.length - 1,
        capaianManfaat: ortuManfaat,
        perubahanPositif: perubahan,
      },
      siswa: {
        totalResponden: rows.length - 1,
        pengalamanBelajar: siswaPengalaman,
        halDisukai,
      },
    };
  } catch {
    // Fallback when env not configured or fetch fails
    return DEMO;
  }
}