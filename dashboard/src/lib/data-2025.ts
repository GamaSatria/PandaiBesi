// Data statis periode 2025 (instrumen Guru versi 2025). Hanya bagian Guru
// yang tersedia; Kepsek/Ortu/Siswa kosong.
//
// Cara update: isi JUMLAH responden yang memilih tiap opsi (angka dari ringkasan
// Google Form). Persentase dihitung otomatis terhadap totalResponden. Opsi yang
// tidak diisi tidak ditampilkan di chart.
import type { AspekItem, DashboardData, GuruData } from "./types";
import { EMPTY_KEPSEK, EMPTY_ORTU, EMPTY_SISWA } from "./types";

type Opsi = { aspek: string; aspekFull: string };

// Label pendek (`aspek`) dipendekkan ~3 kata agar tidak tumpang tindih di
// chart; teks lengkap (`aspekFull`) tampil sebagai tooltip/detail.

const REGULASI = {
  uu20: { aspek: "UU 20/2003", aspekFull: "UU Nomor 20 Tahun 2003 tentang Sistem Pendidikan Nasional" },
  uu8: { aspek: "UU 8/2016", aspekFull: "UU Nomor 8 Tahun 2016 tentang Penyandang Disabilitas" },
  permen48: {
    aspek: "Permen 48/2023",
    aspekFull:
      "Permendikbudristek Nomor 48 Tahun 2023 tentang Akomodasi yang Layak Peserta Didik Penyandang Disabilitas pada Satuan Pendidikan Anak Usia Dini, Pendidikan Dasar, dan Pendidikan Menengah",
  },
  perda4: {
    aspek: "Perda 4/2022",
    aspekFull:
      "Perda Provinsi DKI Jakarta Nomor 4 Tahun 2022 tentang Pelaksanaan Penghormatan, Pelindungan, dan Pemenuhan Hak Penyandang Disabilitas",
  },
  pergub40: {
    aspek: "Pergub 40/2021",
    aspekFull: "Pergub Provinsi DKI Jakarta Nomor 40 Tahun 2021 tentang Penyelenggaraan Pendidikan Inklusif",
  },
} satisfies Record<string, Opsi>;

const SKILL_GURU = {
  mengenali: { aspek: "Mengenali Jenis PDBK...", aspekFull: "Mengenali jenis PDBK" },
  penanganan: { aspek: "Cara Penanganan PDBK...", aspekFull: "Mengetahui cara penanganan PDBK" },
  strategi: { aspek: "Strategi Pembelajaran...", aspekFull: "Mengetahui cara menyusun strategi pembelajaran bagi PDBK" },
  pembelajaran: { aspek: "Pembelajaran Sesuai...", aspekFull: "Mampu memberikan pembelajaran sesuai kondisi PDBK" },
  penilaian: { aspek: "Penilaian Hasil Belajar...", aspekFull: "Mampu memberikan penilaian hasil belajar PDBK" },
} satisfies Record<string, Opsi>;

const KEMAMPUAN_PDBK = {
  wajahSenang: { aspek: "Wajah Senang...", aspekFull: "Menunjukkan wajah senang/semangat berada di sekolah" },
  percayaDiri: { aspek: "Percaya Diri...", aspekFull: "Tampak percaya diri dalam lingkungan di kelasnya" },
  dudukTenang: { aspek: "Duduk Tenang...", aspekFull: "Duduk tenang selama proses pembelajaran di kelas" },
  temanKelas: { aspek: "Teman Kelas...", aspekFull: "Berbicara dengan teman di kelas" },
  denganGuru: { aspek: "Dengan Guru...", aspekFull: "Berbicara dengan guru" },
  keToilet: { aspek: "Ke Toilet...", aspekFull: "Ke kamar mandi (BAK/BAB) tanpa bantuan orang lain" },
  bermainTeman: { aspek: "Bermain Teman...", aspekFull: "Bermain dengan teman sebayanya yang lain" },
  fokusDengar: { aspek: "Fokus Dengar...", aspekFull: "Lebih fokus mendengarkan materi yang diberikan guru" },
  selesaikanTugas: { aspek: "Selesaikan Tugas...", aspekFull: "Menyelesaikan tugas yang diberikan guru" },
  ikutiAturan: { aspek: "Ikuti Aturan...", aspekFull: "Bisa mengikuti aturan yang diterapkan sekolah" },
} satisfies Record<string, Opsi>;

type Jumlah<T> = Partial<Record<keyof T, number>>;

type Semester2025 = {
  totalResponden: number;
  sebaranKelas: GuruData["sebaranKelas"];
  regulasi: Jumlah<typeof REGULASI>;
  skill: Jumlah<typeof SKILL_GURU>;
  kemampuan: Jumlah<typeof KEMAMPUAN_PDBK>;
};

/** Jumlah pemilih per opsi → item chart (persen), urut sesuai daftar opsi. */
function toAspek<T extends Record<string, Opsi>>(opsi: T, jumlah: Jumlah<T>, total: number): AspekItem[] {
  return (Object.keys(opsi) as (keyof T)[]).flatMap((key) => {
    const n = jumlah[key];
    return n === undefined ? [] : [{ ...opsi[key], nilai: Math.round((n / total) * 100) }];
  });
}

function build2025({ totalResponden, sebaranKelas, regulasi, skill, kemampuan }: Semester2025): DashboardData {
  return {
    guru: {
      totalResponden,
      sebaranKelas,
      capaianKeterampilan: [],
      kebutuhanPendampingan: [],
      pemahamanInklusif: toAspek(REGULASI, regulasi, totalResponden),
      skillYangDidapat: toAspek(SKILL_GURU, skill, totalResponden),
      chartTower: toAspek(KEMAMPUAN_PDBK, kemampuan, totalResponden).map((d) => ({
        name: d.aspek,
        nameFull: d.aspekFull,
        value: d.nilai,
      })),
    },
    kepsek: EMPTY_KEPSEK,
    ortu: EMPTY_ORTU,
    siswa: EMPTY_SISWA,
  };
}

export const DATA_2025_S1 = build2025({
  totalResponden: 17,
  sebaranKelas: [
    { kelas: "Kelas 1", jumlah: 4 },
    { kelas: "Kelas 2", jumlah: 3 },
    { kelas: "Kelas 3", jumlah: 2 },
    { kelas: "Kelas 4", jumlah: 2 },
    { kelas: "Kelas 5", jumlah: 2 },
    { kelas: "Kelas 6", jumlah: 4 },
  ],
  regulasi: { uu20: 6, uu8: 8, permen48: 6, perda4: 6, pergub40: 8 },
  skill: { mengenali: 15, penanganan: 11, strategi: 9, pembelajaran: 9, penilaian: 9 },
  kemampuan: {
    wajahSenang: 16,
    percayaDiri: 13,
    dudukTenang: 12,
    temanKelas: 15,
    denganGuru: 13,
    keToilet: 9,
    bermainTeman: 11,
    fokusDengar: 8,
    selesaikanTugas: 12,
    ikutiAturan: 12,
  },
});

export const DATA_2025_S2 = build2025({
  totalResponden: 76,
  sebaranKelas: [
    { kelas: "GURU (Tidak Ditentukan)", jumlah: 62 },
    { kelas: "Kelas 1", jumlah: 2 },
    { kelas: "Kelas 2", jumlah: 4 },
    { kelas: "Kelas 3", jumlah: 1 },
    { kelas: "PJOK", jumlah: 1 },
    { kelas: "Agama", jumlah: 1 },
    { kelas: "Kepala Sekolah", jumlah: 5 },
  ],
  regulasi: { uu20: 51, uu8: 46, permen48: 56, perda4: 34, pergub40: 48 },
  skill: { mengenali: 62, penanganan: 54, strategi: 51, pembelajaran: 51, penilaian: 41 },
  kemampuan: {
    wajahSenang: 57,
    dudukTenang: 44,
    temanKelas: 47,
    denganGuru: 52,
    bermainTeman: 62,
    fokusDengar: 37,
    selesaikanTugas: 37,
  },
});
