// Data statis: 2025 Semester 1
import type { DashboardData } from "./types";

export const DATA_2025_S1: DashboardData = {
  guru: {
    totalResponden: 17,
    sebaranKelas: [
      { kelas: "Kelas 1", jumlah: 4 },
      { kelas: "Kelas 2", jumlah: 3 },
      { kelas: "Kelas 3", jumlah: 2 },
      { kelas: "Kelas 4", jumlah: 2 },
      { kelas: "Kelas 5", jumlah: 2 },
      { kelas: "Kelas 6", jumlah: 4 },
    ],
    capaianKeterampilan: [],
    kebutuhanPendampingan: [],
    pemahamanInklusif: [
      {
        aspek: "UU 20/2003",
        aspekFull: "UU Nomor 20 Tahun 2003 tentang Sistem Pendidikan Nasional",
        nilai: Math.round((6 / 17) * 100),
      },
      {
        aspek: "UU 8/2016",
        aspekFull: "UU Nomor 8 Tahun 2016 tentang Penyandang Disabilitas",
        nilai: Math.round((8 / 17) * 100),
      },
      {
        aspek: "Permen 48/2023",
        aspekFull:
          "Permendikbudristek Nomor 48 Tahun 2023 tentang Akomodasi yang Layak Peserta Didik Penyandang Disabilitas pada Satuan Pendidikan Anak Usia Dini, Pendidikan Dasar, dan Pendidikan Menengah",
        nilai: Math.round((6 / 17) * 100),
      },
      {
        aspek: "Perda 4/2022",
        aspekFull:
          "Perda Provinsi DKI Jakarta Nomor 4 Tahun 2022 tentang Pelaksanaan Penghormatan, Pelindungan, dan Pemenuhan Hak Penyandang Disabilitas",
        nilai: Math.round((6 / 17) * 100),
      },
      {
        aspek: "Pergub 40/2021",
        aspekFull:
          "Pergub Provinsi DKI Jakarta Nomor 40 Tahun 2021 tentang Penyelenggaraan Pendidikan Inklusif",
        nilai: Math.round((8 / 17) * 100),
      },
    ],
    skillYangDidapat: [
      { aspek: "Mengenali Jenis PDBK...", aspekFull: "Mengenali jenis PDBK", nilai: Math.round((15 / 17) * 100) },
      { aspek: "Cara Penanganan PDBK...", aspekFull: "Mengetahui cara penanganan PDBK", nilai: Math.round((11 / 17) * 100) },
      { aspek: "Strategi Pembelajaran...", aspekFull: "Mengetahui cara menyusun strategi pembelajaran bagi PDBK", nilai: Math.round((9 / 17) * 100) },
      { aspek: "Pembelajaran Sesuai...", aspekFull: "Mampu memberikan pembelajaran sesuai kondisi PDBK", nilai: Math.round((9 / 17) * 100) },
      { aspek: "Penilaian Hasil Belajar...", aspekFull: "Mampu memberikan penilaian hasil belajar PDBK", nilai: Math.round((9 / 17) * 100) },
    ],
  },
  kepsek: {
    totalResponden: 0,
    sebaranJenjang: [],
    dampakProgram: [],
    saran: [],
  },
  ortu: {
    totalResponden: 0,
    capaianManfaat: [],
    perubahanPositif: [],
  },
  siswa: {
    totalResponden: 0,
    pengalamanBelajar: [],
    halDisukai: [],
  },
};
