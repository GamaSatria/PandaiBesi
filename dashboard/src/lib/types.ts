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

export type GuruData = {
  totalResponden: number;
  sebaranKelas: { kelas: string; jumlah: number }[];
  capaianKeterampilan: { skill: string; skillFull?: string; jumlah: number }[];
  kebutuhanPendampingan: string[];
  /** Khusus periode 2025: pemahaman guru ttg regulasi pendidikan inklusif (skala 0-100). */
  pemahamanInklusif?: { aspek: string; aspekFull?: string; nilai: number }[];
  /** Khusus periode 2025: skill yang didapat peserta didik (skala 0-100). Data placeholder, diisi manual. */
  skillYangDidapat?: { aspek: string; aspekFull?: string; nilai: number }[];
};

export type KepsekData = {
  totalResponden: number;
  sebaranJenjang: { name: string; value: number }[];
  dampakProgram: { aspek: string; aspekFull?: string; sebelum: number; sesudah: number; sebelumCount?: number; sesudahCount?: number }[];
  saran: string[];
};

export type OrtuData = {
  totalResponden: number;
  capaianManfaat: { aspek: string; aspekFull?: string; nilai: number }[];
  perubahanPositif: { judul: string; cerita: string }[];
};

export type SiswaData = {
  totalResponden: number;
  pengalamanBelajar: { aspek: string; aspekFull?: string; nilai: number }[];
  halDisukai: string[];
};