export type Period = "2026-s1" | "2025-s2" | "2025-s1";

export type PeriodMeta = {
  key: Period;
  label: string;
};

export const PERIODS: PeriodMeta[] = [
  { key: "2026-s1", label: "2026 Semester 1" },
  { key: "2025-s2", label: "2025 Semester 2" },
  { key: "2025-s1", label: "2025 Semester 1" },
];

export type SectionKey = "guru" | "kepsek" | "ortu" | "siswa";

/** Map period → sections visible in the sidebar menu. */
export const PERIOD_SECTIONS: Record<Period, SectionKey[]> = {
  "2026-s1": ["guru", "kepsek", "ortu", "siswa"],
  "2025-s2": ["guru"],
  "2025-s1": ["guru"],
};

export type DashboardData = {
  guru: GuruData;
  kepsek: KepsekData;
  ortu: OrtuData;
  siswa: SiswaData;
};

/** Item chart berskala persen 0-100. `aspek` = label pendek, `aspekFull` = teks lengkap (tooltip/detail). */
export type AspekItem = { aspek: string; aspekFull?: string; nilai: number };

export type GuruData = {
  totalResponden: number;
  sebaranKelas: { kelas: string; jumlah: number }[];
  capaianKeterampilan: { skill: string; skillFull?: string; jumlah: number }[];
  kebutuhanPendampingan: string[];
  /** Khusus instrumen 2025: pemahaman guru tentang regulasi pendidikan inklusif. */
  pemahamanInklusif?: AspekItem[];
  /** Khusus instrumen 2025: skill yang didapat guru setelah pendampingan. */
  skillYangDidapat?: AspekItem[];
  /** Khusus instrumen 2025: kemampuan yang dapat dilakukan PDBK (bar chart vertikal, persen 0-100). */
  chartTower?: { name: string; nameFull?: string; value: number }[];
};

export type KepsekData = {
  totalResponden: number;
  sebaranJenjang: { name: string; value: number }[];
  /** `sesudah` = persen kepala sekolah yang memilih aspek, `sesudahCount` = jumlahnya. */
  dampakProgram: { aspek: string; aspekFull?: string; sesudah: number; sesudahCount: number }[];
  saran: string[];
};

export type OrtuData = {
  totalResponden: number;
  capaianManfaat: AspekItem[];
  perubahanPositif: { judul: string; cerita: string }[];
};

export type SiswaData = {
  totalResponden: number;
  pengalamanBelajar: AspekItem[];
  halDisukai: string[];
};

// Seksi tanpa data: dipakai periode yang tidak punya instrumen tsb, dan oleh
// loader saat sheet gagal diambil / belum ada respons.
export const EMPTY_GURU: GuruData = {
  totalResponden: 0,
  sebaranKelas: [],
  capaianKeterampilan: [],
  kebutuhanPendampingan: [],
};
export const EMPTY_KEPSEK: KepsekData = { totalResponden: 0, sebaranJenjang: [], dampakProgram: [], saran: [] };
export const EMPTY_ORTU: OrtuData = { totalResponden: 0, capaianManfaat: [], perubahanPositif: [] };
export const EMPTY_SISWA: SiswaData = { totalResponden: 0, pengalamanBelajar: [], halDisukai: [] };
