// Sensor nama orang di jawaban isian bebas (testimoni, saran, kebutuhan,
// hal yang disukai) SEBELUM data dikirim ke browser — nama asli tidak pernah
// ikut terkirim di HTML maupun data halaman.
//
// Nama di teks bebas tidak bisa dikenali otomatis dengan andal (sering
// ditulis huruf kecil, sementara kata biasa kadang berhuruf besar), jadi:
//   1. Nama yang diketahui didaftarkan di NAMES di bawah, atau lewat env
//      REDACT_NAMES="nama1,nama2" di dashboard/.env.local (tanpa ubah kode).
//   2. Kata setelah "ananda", "bernama", atau "namanya" otomatis disensor.

import "server-only";

const MASK = "*****";

/** Nama yang selalu disensor (huruf besar/kecil diabaikan). */
const NAMES = ["rafif"];

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function knownNames(): string[] {
  const fromEnv = (process.env.REDACT_NAMES ?? "").split(",");
  return [...new Set([...NAMES, ...fromEnv].map((n) => n.trim().toLowerCase()).filter(Boolean))];
}

// Batas kata berbasis Unicode: "rafif" disensor, tapi tidak di dalam kata lain.
const NOT_LETTER_BEFORE = "(?<![\\p{L}\\p{N}])";
const NOT_LETTER_AFTER = "(?![\\p{L}\\p{N}])";
const INTRO_PATTERN = new RegExp(`${NOT_LETTER_BEFORE}(ananda|bernama|namanya)(\\s+)\\p{L}+`, "giu");

export function redactNames(text: string): string {
  let out = text.replace(INTRO_PATTERN, `$1$2${MASK}`);
  const names = knownNames();
  if (names.length > 0) {
    const pattern = new RegExp(`${NOT_LETTER_BEFORE}(?:${names.map(escapeRegExp).join("|")})${NOT_LETTER_AFTER}`, "giu");
    out = out.replace(pattern, MASK);
  }
  return out;
}
