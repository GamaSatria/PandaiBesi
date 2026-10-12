"use client";

// Komponen visual dashboard: kartu, statistik, dan grafik ringan berbasis
// HTML/SVG (pengganti Recharts). Warna diambil dari CSS variable nada aktif
// (`--tone`, lihat .tone-* di globals.css) — satu grafik satu nada — jadi
// grafik ikut tema tanpa JavaScript tambahan dan sudah lengkap sejak
// HTML pertama dikirim server.

import { useId, useState, type CSSProperties } from "react";
import type { AspekItem } from "@/lib/types";

// --- Primitives ---
export function Card({
  title,
  subtitle,
  children,
}: Readonly<{ title: string; subtitle?: string; children: React.ReactNode }>) {
  const titleId = useId();
  return (
    <section aria-labelledby={titleId} className="flex flex-col rounded-[20px] border border-line bg-surface shadow-card">
      <header className="px-5 pt-5 sm:px-6 sm:pt-6">
        <h2 id={titleId} className="text-[15px] font-bold leading-snug text-balance text-ink sm:text-base">
          {title}
        </h2>
        {subtitle ? <p className="mt-1 text-[13px] leading-snug text-pretty text-muted">{subtitle}</p> : null}
      </header>
      <div className="flex-1 px-5 pb-5 pt-5 sm:px-6 sm:pb-6">{children}</div>
    </section>
  );
}

// Semua kartu statistik seragam & netral (flat, tanpa warna/glow).
export function Stat({
  label,
  value,
  hint,
  className = "",
}: Readonly<{ label: string; value: string | number; hint?: string; /** Kelas tata letak tambahan (mis. lebar kolom). */ className?: string }>) {
  const isLongText = typeof value === "string" && value.length > 14;
  return (
    <div className={`flex flex-col gap-3 rounded-[20px] border border-line bg-surface p-4 shadow-card sm:p-5 ${className}`}>
      <span className="text-[12.5px] font-semibold leading-tight text-muted">{label}</span>
      <div
        className={`font-extrabold tabular-nums wrap-break-word text-ink ${
          isLongText ? "text-lg leading-snug" : "text-[30px] leading-none tracking-[-0.02em]"
        }`}
      >
        {value}
      </div>
      {hint ? <div className="mt-auto text-[12.5px] leading-snug text-pretty text-muted">{hint}</div> : null}
    </div>
  );
}

export function EmptyState({ text = "Belum ada data." }: Readonly<{ text?: string }>) {
  return (
    <p role="status" className="rounded-2xl bg-surface-muted py-10 text-center text-sm text-muted">
      {text}
    </p>
  );
}

const width = (pct: number) => ({ "--w": `${pct}%` }) as CSSProperties;

// --- Batang horizontal ---
// Label tampil utuh (dibungkus ke baris berikut), jadi tidak perlu tooltip
// atau "ketuk untuk detail". Semua batang satu warna (nada instrumen).
export type BarItem = { label: string; value: number; display?: string };

export function BarList({
  items,
  max,
  label,
}: Readonly<{ items: BarItem[]; /** Nilai yang setara batang penuh; default = nilai terbesar. */ max?: number; label: string }>) {
  if (!items.length) return <EmptyState />;
  const full = max ?? Math.max(...items.map((d) => d.value), 1);
  return (
    <ul aria-label={label} className="flex flex-col gap-4">
      {items.map((d, i) => {
        const pct = d.value > 0 ? Math.max(1.5, Math.min(100, (d.value / full) * 100)) : 0;
        return (
          <li key={i} className="flex flex-col gap-1.5">
            <div className="flex items-start justify-between gap-4 text-[13.5px] leading-snug">
              <span className="text-pretty text-body">{d.label}</span>
              <span className="shrink-0 font-bold tabular-nums text-ink">{d.display ?? d.value}</span>
            </div>
            <div aria-hidden className="h-2 overflow-hidden rounded-full bg-track">
              <div className="bar-fill h-full rounded-full bg-tone" style={width(pct)} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

// --- Kolom vertikal (kategori pendek, mis. kelas) ---
export function ColumnChart({
  items,
  label,
  height = 220,
}: Readonly<{ items: { label: string; value: number }[]; label: string; height?: number }>) {
  if (!items.length) return <EmptyState />;
  const peak = Math.max(...items.map((d) => d.value), 1);
  // Area batang memanjang mengikuti tinggi kartu (minimal `height`), agar
  // sejajar dengan kartu di sebelahnya tanpa ruang kosong di bawah.
  return (
    <div className="flex h-full flex-col overflow-x-auto pb-1">
      <ul
        aria-label={label}
        className="grid min-w-full flex-1 gap-2 sm:gap-3"
        style={{ gridTemplateColumns: `repeat(${items.length}, minmax(52px, 1fr))` }}
      >
        {items.map((d, i) => (
          <li key={i} className="flex flex-col">
            <div className="flex flex-1 items-end justify-center border-b border-line-strong pt-6" style={{ minHeight: height }}>
              <div
                className="relative w-full max-w-12 rounded-t-[10px] bg-tone"
                style={{ height: `${Math.max(d.value > 0 ? 2 : 0, (d.value / peak) * 100)}%` }}
              >
                <span className="absolute inset-x-0 bottom-full mb-1.5 text-center text-[13px] font-bold tabular-nums text-ink">
                  {d.value}
                </span>
              </div>
            </div>
            <span className="mt-2 text-center text-xs font-medium leading-tight text-balance text-muted">{d.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// --- Donut + legenda ---
// Kategori dibedakan dengan gradasi SATU nada (tua → muda), bukan warna-warni.
// Gradasi dibagi rata 100% → 35% agar kategori terakhir tetap terlihat.
const shadeOf = (i: number, n: number) => (n > 1 ? Math.round(100 - (i * 65) / (n - 1)) : 100);
const shadeColor = (shade: number) => `color-mix(in oklab, var(--tone) ${shade}%, var(--surface))`;
/** Bagian donut yang cukup lebar untuk diberi label persen langsung. */
const MIN_LABEL_SHARE = 8;

export function DonutChart({
  items,
  label,
  unit,
}: Readonly<{ items: { label: string; value: number }[]; label: string; /** Satuan total di tengah donut. */ unit: string }>) {
  // Bagian yang disorot: kursor (hover/fokus) didahulukan, lalu yang diketuk.
  const [pinned, setPinned] = useState<number | null>(null);
  const [hover, setHover] = useState<number | null>(null);
  const total = items.reduce((s, d) => s + d.value, 0);
  if (!items.length || total === 0) return <EmptyState />;

  const n = items.length;
  const active = hover ?? pinned;
  const toggle = (i: number) => setPinned((cur) => (cur === i ? null : i));
  const dim = (i: number) => active !== null && active !== i;
  const percent = (v: number) => Math.round((v / total) * 100);
  const gap = items.filter((d) => d.value > 0).length > 1 ? 0.6 : 0;
  const shares = items.map((d) => (d.value / total) * 100);
  // Bagian yang disorot selalu tampil dengan warna nada penuh, agar jelas
  // walau aslinya bagian bergradasi paling muda.
  const segments = shares.map((share, i) => ({
    share,
    len: Math.max(0, share - gap),
    start: shares.slice(0, i).reduce((s, v) => s + v, 0),
    shade: active === i ? 100 : shadeOf(i, n),
  }));
  const focus = active !== null ? items[active] : null;
  const hoverProps = (i: number) => ({
    onMouseEnter: () => setHover(i),
    onMouseLeave: () => setHover(null),
  });

  return (
    // Mengisi tinggi kartu (h-full) dan berada di tengah, agar sejajar dengan
    // kartu di sebelahnya tanpa ruang kosong di bawah.
    <figure className="flex h-full flex-col items-center justify-center gap-8 sm:flex-row">
      <figcaption className="sr-only">{label}</figcaption>
      <div className="relative h-48 w-48 shrink-0 lg:h-60 lg:w-60">
        <svg viewBox="0 0 120 120" aria-hidden className="h-full w-full -rotate-90">
          <circle cx="60" cy="60" r="48" fill="none" strokeWidth="16" style={{ stroke: "var(--track)" }} />
          {segments.map((s, i) =>
            s.len > 0 ? (
              <circle
                key={i}
                {...hoverProps(i)}
                onClick={() => toggle(i)}
                className="donut-seg"
                cx="60"
                cy="60"
                r="48"
                fill="none"
                strokeWidth={active === i ? 19 : 16}
                pathLength={100}
                strokeDasharray={`${s.len} ${100 - s.len}`}
                strokeDashoffset={-s.start}
                style={{ stroke: shadeColor(s.shade), opacity: dim(i) ? 0.3 : 1 }}
              />
            ) : null,
          )}
        </svg>
        {/* Label persen di bagian yang cukup lebar (lapisan tanpa rotasi). */}
        {n > 1 ? (
          <svg viewBox="0 0 120 120" aria-hidden className="pointer-events-none absolute inset-0 h-full w-full">
            {segments.map((s, i) => {
              if (s.share < MIN_LABEL_SHARE) return null;
              const angle = ((s.start + s.share / 2) / 100) * 2 * Math.PI - Math.PI / 2;
              return (
                <text
                  key={i}
                  x={(60 + 48 * Math.cos(angle)).toFixed(1)}
                  y={(60 + 48 * Math.sin(angle)).toFixed(1)}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={6.5}
                  fontWeight={800}
                  className={`donut-label ${s.shade >= 90 ? "seg-top" : ""} ${s.shade >= 75 ? "seg-hi" : ""}`}
                  style={{ opacity: dim(i) ? 0.3 : 1 }}
                >
                  {percent(items[i].value)}%
                </text>
              );
            })}
          </svg>
        ) : null}
        {/* Tengah donut: total, atau detail bagian yang sedang disorot. */}
        {/* Posisi diset inline (bukan class arbitrer) agar selalu di tengah lubang donut. */}
        <div
          aria-live="polite"
          className="pointer-events-none absolute flex flex-col items-center justify-center text-center"
          style={{ inset: "19%" }}
        >
          {focus ? (
            <>
              <span className="text-[28px] font-extrabold leading-none tabular-nums text-ink lg:text-[34px]">
                {percent(focus.value)}%
              </span>
              <span className="mt-1.5 line-clamp-2 text-xs font-bold leading-tight text-body lg:text-[13px]">{focus.label}</span>
              <span className="mt-0.5 text-[11px] tabular-nums text-muted lg:text-xs">
                {focus.value} dari {total} {unit}
              </span>
            </>
          ) : (
            <>
              <span className="text-[32px] font-extrabold leading-none tabular-nums text-ink lg:text-[38px]">{total}</span>
              <span className="mt-1 text-xs font-medium text-muted lg:text-[13px]">{unit}</span>
            </>
          )}
        </div>
      </div>
      <div className="flex w-full min-w-0 flex-col gap-2 sm:max-w-sm">
        <ul className="flex flex-col gap-0.5">
          {items.map((d, i) => (
            <li key={i}>
              <button
                type="button"
                aria-pressed={pinned === i}
                onClick={() => toggle(i)}
                {...hoverProps(i)}
                onFocus={() => setHover(i)}
                onBlur={() => setHover(null)}
                className={`focus-ring flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left text-[13.5px] leading-snug transition-[background-color,opacity] duration-150 ${
                  active === i ? "bg-hover" : ""
                } ${dim(i) ? "opacity-50" : ""}`}
              >
                <span aria-hidden className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: shadeColor(segments[i].shade) }} />
                <span className={`min-w-0 flex-1 text-pretty text-body ${active === i ? "font-bold" : ""}`}>{d.label}</span>
                {/* Persentase tidak diulang di sini: sudah tertulis di donut / tengah donut saat disorot. */}
                <span className="shrink-0 font-bold tabular-nums text-ink">{d.value}</span>
              </button>
            </li>
          ))}
        </ul>
        {n > 1 ? <p className="px-2 text-xs text-muted">Arahkan kursor atau ketuk untuk melihat detail.</p> : null}
      </div>
    </figure>
  );
}

// --- Radar + legenda bernomor ---
// Sumbu radar diberi nomor (bukan teks) supaya tidak tumpang tindih di layar
// sempit; teks lengkap & nilai ada di legenda. Arahkan/ketuk legenda atau
// nomor untuk menyorot satu aspek.
const RADAR = { size: 300, c: 150, r: 104, badge: 126 };

export function RadarChart({ items, label }: Readonly<{ items: AspekItem[]; label: string }>) {
  const [pinned, setPinned] = useState<number | null>(null);
  const [hover, setHover] = useState<number | null>(null);
  if (items.length < 3) {
    return (
      <BarList
        items={items.map((d) => ({ label: d.aspekFull ?? d.aspek, value: d.nilai, display: `${d.nilai}%` }))}
        max={100}
        label={label}
      />
    );
  }

  const active = hover ?? pinned;
  const toggle = (i: number) => setPinned((cur) => (cur === i ? null : i));
  const n = items.length;
  const point = (i: number, radius: number) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    return [RADAR.c + radius * Math.cos(a), RADAR.c + radius * Math.sin(a)] as const;
  };
  const polygon = (radiusAt: (i: number) => number) =>
    items.map((_, i) => point(i, radiusAt(i)).map((v) => v.toFixed(1)).join(",")).join(" ");
  const clamp = (v: number) => Math.min(100, Math.max(0, v));
  const dataRadius = (i: number) => (RADAR.r * clamp(items[i].nilai)) / 100;

  return (
    <figure className="@container">
      <figcaption className="sr-only">{label}</figcaption>
      <div className="flex flex-col items-center gap-5 @lg:flex-row @lg:items-center @lg:gap-8">
        <svg viewBox={`0 0 ${RADAR.size} ${RADAR.size}`} aria-hidden className="w-full max-w-[280px] shrink-0">
          <polygon points={polygon(() => RADAR.r)} style={{ fill: "var(--surface-muted)", stroke: "var(--border-strong)" }} />
          {[0.75, 0.5, 0.25].map((f) => (
            <polygon key={f} points={polygon(() => RADAR.r * f)} fill="none" style={{ stroke: "var(--border)" }} />
          ))}
          {items.map((_, i) => {
            const [x, y] = point(i, RADAR.r);
            return <line key={i} x1={RADAR.c} y1={RADAR.c} x2={x} y2={y} style={{ stroke: "var(--border)" }} />;
          })}
          <polygon
            points={polygon(dataRadius)}
            strokeWidth={2}
            strokeLinejoin="round"
            style={{ fill: "var(--tone)", fillOpacity: 0.18, stroke: "var(--tone)" }}
          />
          {items.map((d, i) => {
            const [x, y] = point(i, dataRadius(i));
            const isActive = active === i;
            return (
              <circle
                key={i}
                cx={x}
                cy={y}
                r={isActive ? 6 : 4}
                strokeWidth={2}
                style={{ fill: isActive ? "var(--tone)" : "var(--surface)", stroke: "var(--tone)" }}
              />
            );
          })}
          {items.map((_, i) => {
            const [x, y] = point(i, RADAR.badge);
            const isActive = active === i;
            return (
              <g
                key={i}
                onClick={() => toggle(i)}
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
                style={{ cursor: "pointer" }}
              >
                <circle
                  cx={x}
                  cy={y}
                  r={11}
                  style={{
                    fill: isActive ? "var(--tone)" : "var(--surface)",
                    stroke: isActive ? "var(--tone)" : "var(--border-strong)",
                  }}
                />
                <text
                  x={x}
                  y={y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={11}
                  fontWeight={800}
                  style={{ fill: isActive ? "var(--tone-on)" : "var(--text-primary)" }}
                >
                  {i + 1}
                </text>
              </g>
            );
          })}
        </svg>
        <ol className="flex w-full min-w-0 flex-col gap-0.5">
          {items.map((d, i) => (
            <li key={i}>
              <button
                type="button"
                aria-pressed={pinned === i}
                onClick={() => toggle(i)}
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(i)}
                onBlur={() => setHover(null)}
                className={`focus-ring flex w-full items-start gap-3 rounded-xl px-2.5 py-2 text-left transition-colors ${
                  active === i ? "bg-tone-soft" : "hover:bg-hover"
                }`}
              >
                <span
                  aria-hidden
                  className={`mt-px flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full text-[11px] font-extrabold tabular-nums ${
                    active === i ? "bg-tone text-tone-on" : "bg-surface-muted text-ink ring-1 ring-line-strong"
                  }`}
                >
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1 text-[13.5px] leading-snug text-pretty text-body">{d.aspekFull ?? d.aspek}</span>
                <span className="shrink-0 text-[13.5px] font-bold tabular-nums text-ink">{d.nilai}%</span>
              </button>
            </li>
          ))}
        </ol>
      </div>
    </figure>
  );
}
