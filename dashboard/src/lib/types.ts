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