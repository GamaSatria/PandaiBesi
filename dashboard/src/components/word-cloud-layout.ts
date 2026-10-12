// Tata letak word cloud: kata terbesar di tengah, kata lain ditempatkan
// mengikuti spiral keluar tanpa saling bertumpuk (Wordle-style). Murni
// perhitungan (tanpa DOM/canvas), jadi hasilnya sama di server & browser.

export type CloudWord = { text: string; freq: number; rank: number };
export type PlacedWord = CloudWord & {
  size: number;
  /** Titik awal teks (text-anchor start) dan baseline. */
  x: number;
  y: number;
  /** Lebar teks yang dipaksakan via `textLength`, agar sama persis dengan perhitungan. */
  textWidth: number;
};
/** `width`/`height` = ukuran asli awan kata setelah ruang kosong dipotong. */
export type CloudLayout = { words: PlacedWord[]; viewBox: string; width: number; height: number };

// Lebar huruf Manrope tebal (700) dalam em, diukur di browser.
const CHAR_EM: Record<string, number> = {
  a: 0.58, b: 0.62, c: 0.56, d: 0.62, e: 0.6, f: 0.38, g: 0.62, h: 0.63, i: 0.28, j: 0.29,
  k: 0.54, l: 0.28, m: 0.9, n: 0.63, o: 0.62, p: 0.62, q: 0.62, r: 0.4, s: 0.54, t: 0.43,
  u: 0.63, v: 0.55, w: 0.8, x: 0.56, y: 0.56, z: 0.54, "-": 0.42,
  "0": 0.66, "1": 0.44, "2": 0.6, "3": 0.58, "4": 0.6, "5": 0.59, "6": 0.62, "7": 0.54, "8": 0.61, "9": 0.62,
};
const textWidthEm = (text: string) => [...text].reduce((w, ch) => w + (CHAR_EM[ch] ?? 0.6), 0);

// Kotak tinta relatif ukuran font: puncak huruf tinggi (b, d, l) & ekor (g, p, y).
const ASCENT = 0.76;
const DESCENT = 0.24;
const GOLDEN_ANGLE = 2.39996;

type Box = { x: number; y: number; w: number; h: number };

export function layoutCloud(
  words: CloudWord[],
  { width, height, minSize, maxSize }: { width: number; height: number; minSize: number; maxSize: number },
): CloudLayout {
  const freqs = words.map((w) => w.freq);
  const fMax = Math.max(...freqs);
  const fMin = Math.min(...freqs);
  // Ukuran sebanding linear dengan frekuensi: kata yang sering muncul jauh lebih besar.
  const sizeOf = (f: number) =>
    fMax === fMin ? (minSize + maxSize) / 2.5 : minSize + ((maxSize - minSize) * (f - fMin)) / (fMax - fMin);

  const cx = width / 2;
  const cy = height / 2;
  const stretch = Math.sqrt(width / height); // spiral lonjong mengikuti bentuk area
  const maxRadius = Math.hypot(width, height) / 2;
  const boxes: Box[] = [];
  const placed: PlacedWord[] = [];

  const collides = (b: Box) =>
    b.x < 0 || b.y < 0 || b.x + b.w > width || b.y + b.h > height ||
    boxes.some((p) => b.x < p.x + p.w && b.x + b.w > p.x && b.y < p.y + p.h && b.y + b.h > p.y);

  for (const word of words) {
    // Kalau tidak ada tempat, coba lagi sedikit lebih kecil (maks. 3x).
    for (let size = sizeOf(word.freq), attempt = 0; attempt < 4; attempt++, size *= 0.82) {
      const pad = 1.5 + size * 0.05;
      const tw = textWidthEm(word.text) * size;
      const w = tw + pad * 2;
      const h = size * (ASCENT + DESCENT) + pad * 2;
      const start = word.rank * GOLDEN_ANGLE;
      let spot: Box | null = null;
      // Spiral Archimedes; langkah sudut menyesuaikan jari-jari (jarak busur ±6px).
      for (let r = 0, a = 0; r <= maxRadius; a += Math.min(0.6, 6 / (r + 6)), r = 1.4 * a) {
        const box = {
          x: cx + r * stretch * Math.cos(a + start) - w / 2,
          y: cy + (r / stretch) * Math.sin(a + start) - h / 2,
          w,
          h,
        };
        if (!collides(box)) {
          spot = box;
          break;
        }
      }
      if (spot) {
        boxes.push(spot);
        placed.push({
          ...word,
          size: round(size),
          x: round(spot.x + pad),
          y: round(spot.y + pad + size * ASCENT),
          textWidth: round(tw),
        });
        break;
      }
    }
  }

  // Potong ruang kosong: viewBox mengikuti kumpulan kata yang benar-benar tampil.
  const margin = 6;
  const minX = Math.min(...boxes.map((b) => b.x)) - margin;
  const minY = Math.min(...boxes.map((b) => b.y)) - margin;
  const maxX = Math.max(...boxes.map((b) => b.x + b.w)) + margin;
  const maxY = Math.max(...boxes.map((b) => b.y + b.h)) + margin;
  return {
    words: placed,
    viewBox: [minX, minY, maxX - minX, maxY - minY].map(round).join(" "),
    width: round(maxX - minX),
    height: round(maxY - minY),
  };
}

const round = (v: number) => Math.round(v * 10) / 10;
