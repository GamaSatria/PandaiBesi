import type { SectionKey } from "@/lib/types";

/** Nada warna dari palet tema (lihat `.tone-*` di globals.css). */
export type Tone = "torii" | "indigo" | "wisteria" | "amber" | "matcha" | "sumi";

export type SectionMeta = {
  key: SectionKey;
  /** Nama responden; dipakai di menu dan judul halaman. */
  label: string;
  /** Pengantar di bawah judul: siapa yang mengisi & apa yang ditampilkan. Disusun dari pertanyaan survei (lib/data.ts). */
  description: string;
  /** Pengantar khusus periode arsip (2025) bila instrumennya berbeda. */
  archiveDescription?: string;
  /** Setiap instrumen punya satu nada yang dipakai konsisten: menu, judul, grafik. */
  tone: Tone;
};

export const SECTIONS: readonly SectionMeta[] = [
  {
    key: "guru",
    label: "Guru",
    description:
      "Hasil survei guru peserta program pendampingan PDBK: kelas yang diajar, keterampilan yang kini dikuasai, dan pendampingan yang masih dibutuhkan.",
    archiveDescription:
      "Hasil survei guru setelah program pendampingan PDBK: pemahaman regulasi pendidikan inklusif, keterampilan yang didapat, dan kemampuan peserta didik.",
    tone: "torii",
  },
  {
    key: "kepsek",
    label: "Kepala Sekolah",
    description:
      "Penilaian kepala sekolah atas dampak program pendampingan terhadap sekolahnya, dilengkapi sebaran jenjang sekolah dan saran untuk perbaikan program.",
    tone: "indigo",
  },
  {
    key: "ortu",
    label: "Orang Tua",
    description:
      "Pengalaman orang tua setelah anaknya mendapat layanan asesmen: manfaat yang paling dirasakan dan cerita perubahan positif yang terlihat pada anak.",
    tone: "amber",
  },
  {
    key: "siswa",
    label: "Peserta Didik",
    description:
      "Suara peserta didik setelah mendapat layanan asesmen: bagaimana pengalaman belajar mereka dan hal apa yang paling mereka sukai di sekolah.",
    tone: "matcha",
  },
];

export const SECTION_BY_KEY = Object.fromEntries(SECTIONS.map((s) => [s.key, s])) as Record<SectionKey, SectionMeta>;
