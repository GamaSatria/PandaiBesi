// Data statis: 2025 Semester 2
// Placeholder — akan diisi dengan data Google Form aktual oleh user.
import type { DashboardData } from "./types";

export const DATA_2025_S2: DashboardData = {
  guru: {
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
    capaianKeterampilan: [],
    kebutuhanPendampingan: [],
    pemahamanInklusif: [
      {
        aspek: "UU 20/2003",
        aspekFull: "UU Nomor 20 Tahun 2003 tentang Sistem Pendidikan Nasional",
        nilai: Math.round((51 / 76) * 100),
      },
      {
        aspek: "UU 8/2016",
        aspekFull: "UU Nomor 8 Tahun 2016 tentang Penyandang Disabilitas",
        nilai: Math.round((46 / 76) * 100),
      },
      {
        aspek: "Permen 48/2023",
        aspekFull:
          "Permendikbudristek Nomor 48 Tahun 2023 tentang Akomodasi yang Layak Peserta Didik Penyandang Disabilitas pada Satuan Pendidikan Anak Usia Dini, Pendidikan Dasar, dan Pendidikan Menengah",
        nilai: Math.round((56 / 76) * 100),
      },
      {
        aspek: "Perda 4/2022",
        aspekFull:
          "Perda Provinsi DKI Jakarta Nomor 4 Tahun 2022 tentang Pelaksanaan Penghormatan, Pelindungan, dan Pemenuhan Hak Penyandang Disabilitas",
        nilai: Math.round((34 / 76) * 100),
      },
      {
        aspek: "Pergub 40/2021",
        aspekFull:
          "Pergub Provinsi DKI Jakarta Nomor 40 Tahun 2021 tentang Penyelenggaraan Pendidikan Inklusif",
        nilai: Math.round((48 / 76) * 100),
      },
    ],
    skillYangDidapat: [
      { aspek: "Mengenali Jenis PDBK...", aspekFull: "Mengenali jenis PDBK", nilai: Math.round((62 / 76) * 100) },
      { aspek: "Cara Penanganan PDBK...", aspekFull: "Mengetahui cara penanganan PDBK", nilai: Math.round((54 / 76) * 100) },
      { aspek: "Strategi Pembelajaran...", aspekFull: "Mengetahui cara menyusun strategi pembelajaran bagi PDBK", nilai: Math.round((51 / 76) * 100) },
      { aspek: "Pembelajaran Sesuai...", aspekFull: "Mampu memberikan pembelajaran sesuai kondisi PDBK", nilai: Math.round((51 / 76) * 100) },
      { aspek: "Penilaian Hasil Belajar...", aspekFull: "Mampu memberikan penilaian hasil belajar PDBK", nilai: Math.round((41 / 76) * 100) },
    ],
    chartTower: [
      { name: "Wajah Senang...", nameFull: "Menunjukkan wajah senang/semangat berada di sekolah", value: Math.round((57 / 76) * 100) },
      { name: "Duduk Tenang...", nameFull: "Duduk tenang selama proses pembelajaran di kelas", value: Math.round((44 / 76) * 100) },
      { name: "Teman Kelas...", nameFull: "Berbicara dengan teman di kelas", value: Math.round((47 / 76) * 100) },
      { name: "Dengan Guru...", nameFull: "Berbicara dengan guru", value: Math.round((52 / 76) * 100) },
      { name: "Bermain Teman...", nameFull: "Bermain dengan teman sebayanya yang lain", value: Math.round((62 / 76) * 100) },
      { name: "Fokus Dengar...", nameFull: "Lebih fokus mendengarkan materi yang diberikan guru", value: Math.round((37 / 76) * 100) },
      { name: "Selesaikan Tugas...", nameFull: "Menyelesaikan tugas yang diberikan guru", value: Math.round((37 / 76) * 100) },
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
