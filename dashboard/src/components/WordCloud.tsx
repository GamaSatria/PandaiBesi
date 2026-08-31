"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";

type Props = {
  words: string[];
  height?: number;
};

type WCColors = { palette: string[]; hover: string };

const DARK_COLORS: WCColors = {
  palette: ["#f43f5e", "#a78bfa", "#38bdf8", "#34d399", "#fbbf24", "#f472b6"],
  hover: "#ffffff",
};
const LIGHT_COLORS: WCColors = {
  palette: ["#e11d48", "#7c3aed", "#0284c7", "#059669", "#d97706", "#db2777"],
  hover: "#0f172a",
};

/** Returns wordcloud palette + hover color for the currently-applied theme. */
function useWordCloudColors(): WCColors {
  const subscribe = useCallback((cb: () => void) => {
    if (typeof document === "undefined") return () => {};
    const obs = new MutationObserver(cb);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  const getKey = useCallback(
    () => (typeof document === "undefined" ? "dark" : document.documentElement.classList.contains("theme-light") ? "light" : "dark"),
    [],
  );

  useSyncExternalStore(subscribe, getKey, () => "dark");
  void getKey;

  if (typeof document === "undefined") return DARK_COLORS;
  return document.documentElement.classList.contains("theme-light") ? LIGHT_COLORS : DARK_COLORS;
}

// ponytail: stopword list kept inline; upgrade path: extract to /lib/stopwords.ts if it grows
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
    .replace(/[^a-z0-9\u00c0-\u024f\u1e00-\u1eff\s]/g, " ")
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

type PlacedWord = {
  text: string;
  freq: number;
  fontSize: number;
  x: number;
  y: number;
  width: number;
  color: string;
};

// Archimedean-spiral placement that retries overlap-free positions per word
function placeWords(
  ctx: CanvasRenderingContext2D,
  entries: { text: string; freq: number }[],
  width: number,
  height: number,
  palette: string[],
): PlacedWord[] {
  const maxFreq = Math.max(...entries.map((e) => e.freq), 1);
  const minSize = 13;
  const maxSize = Math.min(64, Math.floor(height / 4));

  // sort by freq desc so bigger words are placed first
  const sorted = [...entries].sort((a, b) => b.freq - a.freq);

  const placed: PlacedWord[] = [];
  const cx = width / 2;
  const cy = height / 2;

  for (const { text, freq } of sorted) {
    const fontSize = Math.round(minSize + (freq / maxFreq) * (maxSize - minSize));
    ctx.font = `600 ${fontSize}px ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`;
    const wWidth = ctx.measureText(text).width;
    const wHeight = fontSize * 1.05;

    const step = 0.35; // radians step
    const maxRadius = Math.hypot(width, height) / 2 + 10;
    let placedOk = false;

    for (let r = 0; r < maxRadius; r += 0.6) {
      for (let a = 0; a < Math.PI * 2; a += step) {
        const angle = a + r * 0.15;
        const x = cx + Math.cos(angle) * r - wWidth / 2;
        const y = cy + Math.sin(angle) * r + wHeight / 2;

        if (x < 2 || y - wHeight < 2 || x + wWidth > width - 2 || y > height - 2) {
          continue;
        }

        const collides = placed.some((p) => {
          return !(
            x + wWidth < p.x ||
            x > p.x + p.width ||
            y - wHeight > p.y ||
            y < p.y - p.fontSize * 1.05
          );
        });
        if (!collides) {
          placed.push({
            text,
            freq,
            fontSize,
            x,
            y,
            width: wWidth,
            color: palette[placed.length % palette.length],
          });
          placedOk = true;
          break;
        }
      }
      if (placedOk) break;
    }
    // skip word if no spot found (graceful degradation)
  }

  return placed;
}

export function WordCloud({ words, height = 300 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const placedRef = useRef<PlacedWord[]>([]);
  const [width, setWidth] = useState(800);
  const [hover, setHover] = useState<number | null>(null);
  const colors = useWordCloudColors();

  const entries = useMemo(() => {
    const freq = countFrequencies(words);
    return Array.from(freq.entries())
      .map(([text, f]) => ({ text, freq: f }))
      .sort((a, b) => b.freq - a.freq)
      .slice(0, 60); // cap to keep layout responsive
  }, [words]);

  // track wrapper width for responsive canvas
  useEffect(() => {
    if (!wrapperRef.current) return;
    const ro = new ResizeObserver(([entry]) => {
      const w = Math.max(200, Math.floor(entry.contentRect.width));
      setWidth(w);
    });
    ro.observe(wrapperRef.current);
    return () => ro.disconnect();
  }, []);

  // render canvas (DPR-aware for crisp text on retina)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    if (entries.length === 0) return;

    const placed = placeWords(ctx, entries, width, height, colors.palette);
    placedRef.current = placed;

    for (let i = 0; i < placed.length; i++) {
      const p = placed[i];
      ctx.font = `600 ${p.fontSize}px ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`;
      ctx.textBaseline = "alphabetic";
      const isHover = hover === i;
      ctx.fillStyle = isHover ? colors.hover : p.color;
      ctx.globalAlpha = isHover ? 1 : 0.92;
      ctx.fillText(p.text, p.x, p.y);
    }
    ctx.globalAlpha = 1;
  }, [entries, width, height, hover, colors]);

  // mouse hit-test uses cached placement to avoid recomputation per mousemove
  function handleMove(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const placed = placedRef.current;
    let found: number | null = null;
    for (let i = 0; i < placed.length; i++) {
      const p = placed[i];
      if (
        x >= p.x &&
        x <= p.x + p.width &&
        y <= p.y &&
        y >= p.y - p.fontSize * 1.05
      ) {
        found = i;
        break;
      }
    }
    if (found !== hover) setHover(found);
  }

  if (words.length === 0) {
    return <p className="text-sm" style={{ color: "var(--text-muted)" }}>Belum ada data.</p>;
  }

  return (
    <div ref={wrapperRef} className="w-full">
      <canvas
        ref={canvasRef}
        onMouseMove={handleMove}
        onMouseLeave={() => setHover(null)}
        className="block w-full cursor-default select-none"
        aria-label="Wordcloud hal yang paling disukai di sekolah"
      />
      <p className="mt-2 text-xs" style={{ color: "var(--text-muted)" }}>
        Ukuran kata menunjukkan frekuensi kemunculan.
      </p>
    </div>
  );
}

