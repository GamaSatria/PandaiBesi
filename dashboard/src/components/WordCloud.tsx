// Word cloud: ukuran kata sebanding dengan frekuensi kemunculannya. Kata
// terbanyak di tengah, kata lain melingkar keluar (lihat word-cloud-layout.ts).
// Dirender sebagai SVG tanpa canvas/library: langsung tampil dari HTML server
// dan tajam di semua layar. Tokenisasi & stopword sama dengan versi
// sebelumnya, jadi angka "Kata Unik" tidak berubah.

import { layoutCloud, type CloudWord } from "./word-cloud-layout";

type Props = {
  words: string[];
};

const MAX_WORDS = 60;

// Warna mengikuti frekuensi, bukan acak: kata yang sering muncul memakai nada
// instrumen, kata lain abu-abu netral (keduanya lolos kontras 4.5:1).
const TOP_SHARE = 0.2;
const wordColor = (freq: number, min: number, max: number) =>
  max > min && (freq - min) / (max - min) >= TOP_SHARE ? "var(--tone-ink)" : "var(--text-muted)";

// Tata letak per lebar wadah (dipilih CSS container query, tanpa JS): layar
// sempit memakai rentang ukuran huruf lebih kecil agar kata kecil tetap terbaca.
const TIERS = [
  { key: "s", width: 340, height: 420, minSize: 13, maxSize: 47, className: "block @min-[440px]:hidden" },
  { key: "m", width: 520, height: 380, minSize: 13, maxSize: 58, className: "hidden @min-[440px]:block @min-[640px]:hidden" },
  { key: "l", width: 760, height: 380, minSize: 15, maxSize: 76, className: "hidden @min-[640px]:block @min-[900px]:hidden" },
  { key: "xl", width: 980, height: 400, minSize: 17, maxSize: 100, className: "hidden @min-[900px]:block" },
] as const;

const STOPWORDS = new Set<string>([
  "yang","dan","di","ini","itu","ada","dari","untuk","dengan","tidak",
  "saya","kami","kita","mereka","dia","anda","nya","ke","pada","dalam",
  "telah","sudah","akan","juga","atau","tapi","tetapi","karena","jika",
  "bisa","dapat","harus","perlu","ingin","mau","sangat","sekali","banget",
  "the","a","an","is","are","was","were","of","to","in","on","at","for",
  "and","or","but","i","you","he","she","it","we","they","my","your","sm",
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9À-ɏḀ-ỿ\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !STOPWORDS.has(w) && !/^\d+$/.test(w));
}

function countFrequencies(items: string[]): Map<string, number> {
  const freq = new Map<string, number>();
  for (const item of items) {
    for (const w of tokenize(item)) {
      freq.set(w, (freq.get(w) ?? 0) + 1);
    }
  }
  return freq;
}

/** Jumlah kata unik (setelah stopword dibuang) — sama dengan kata yang dipakai word cloud. */
export function countUniqueWords(items: string[]): number {
  return countFrequencies(items).size;
}

export function WordCloud({ words }: Props) {
  const ranked: CloudWord[] = Array.from(countFrequencies(words), ([text, freq]) => ({ text, freq }))
    .sort((a, b) => b.freq - a.freq)
    .slice(0, MAX_WORDS)
    .map((w, rank) => ({ ...w, rank }));

  if (ranked.length === 0) {
    return <p className="text-sm text-muted">Belum ada data.</p>;
  }
  const maxFreq = ranked[0].freq;
  const minFreq = ranked[ranked.length - 1].freq;

  return (
    <div>
      <div className="@container rounded-2xl bg-surface-muted px-3 py-6 sm:px-6">
        {TIERS.map((tier) => {
          const cloud = layoutCloud(ranked, tier);
          return (
            <svg
              key={tier.key}
              viewBox={cloud.viewBox}
              aria-hidden
              className={`word-cloud mx-auto h-auto w-full ${tier.className}`}
              style={{ maxWidth: cloud.width }}
            >
              {cloud.words.map((w) => (
                <text
                  key={w.text}
                  x={w.x}
                  y={w.y}
                  fontSize={w.size}
                  fontWeight={w.size >= 40 ? 800 : 700}
                  textLength={w.textWidth}
                  style={{ fill: wordColor(w.freq, minFreq, maxFreq) }}
                >
                  <title>{`${w.text}: muncul ${w.freq}×`}</title>
                  {w.text}
                </text>
              ))}
            </svg>
          );
        })}
        <ul className="sr-only" aria-label="Kata yang paling sering muncul">
          {ranked.map((w) => (
            <li key={w.text}>
              {w.text} ({w.freq} kali)
            </li>
          ))}
        </ul>
      </div>
      <p className="mt-3 text-xs text-muted">
        Semakin sering sebuah kata muncul, semakin besar ukurannya. Arahkan kursor ke kata untuk melihat jumlahnya.
      </p>
    </div>
  );
}
