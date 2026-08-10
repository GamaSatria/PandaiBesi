"use client";

import { useEffect, useRef, useState } from "react";
import type { DashboardData, GuruData, KepsekData, OrtuData, SiswaData } from "@/lib/types";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList, PieChart, Pie, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend } from "recharts";

const COLOR_PALETTE = {
  primary: "#c53030",
  purple: "#805ad5",
  green: "#5f8d74",
  orange: "#c58b39",
  pink: "#d9829b",
};

type DashboardKey = keyof DashboardData;
type SectionKey = "guru" | "kepsek" | "ortu" | "siswa";

const SECTIONS: { key: SectionKey; label: string; shortLabel: string; emoji: string }[] = [
  { key: "guru",   label: "Instrumen untuk Guru",          shortLabel: "Guru",          emoji: "👩‍🏫" },
  { key: "kepsek", label: "Instrumen untuk Kepala Sekolah", shortLabel: "Kepsek",       emoji: "🏫" },
  { key: "ortu",   label: "Instrumen untuk Orang Tua",    shortLabel: "Orang Tua",     emoji: "👨‍👩‍👧" },
  { key: "siswa",  label: "Instrumen untuk Peserta Didik", shortLabel: "Peserta Didik", emoji: "🎓" },
];

export function Sidebar({
  active,
  onChange,
}: {
  active: SectionKey;
  onChange: (k: SectionKey) => void;
}) {
  return (
    <aside className="hidden md:flex md:w-64 shrink-0 flex-col bg-seigaiha text-slate-100">
      <div className="flex items-center gap-3 border-b border-white/10 px-6 py-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#c53030] text-lg font-bold text-white shadow-sm">
          D
        </div>
        <div className="leading-tight">
          <div className="font-semibold tracking-wide">Dashboard</div>
          <div className="text-xs text-slate-400">Evaluasi Layanan PDBK</div>
        </div>
      </div>

      <div className="px-4 py-4 text-xs uppercase tracking-widest text-slate-400">
        Menu
      </div>

      <nav className="flex flex-col gap-1 px-2">
        {SECTIONS.map((s) => {
          const isActive = active === s.key;
          return (
            <button
              key={s.key}
              onClick={() => onChange(s.key)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition ${
                isActive
                  ? "bg-[#c53030] text-white shadow-sm"
                  : "text-slate-300 hover:bg-white/10"
              }`}
            >
              <span className="text-lg">{s.emoji}</span>
              <span className="truncate">{s.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-white/10 px-6 py-4 text-xs text-slate-400">
        v1.0.0 · Data dari Google Forms
      </div>
    </aside>
  );
}

export function MobileTabs({
  active,
  onChange,
}: {
  active: SectionKey;
  onChange: (k: SectionKey) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  // Close dropdown when clicking outside or pressing Escape
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const current = SECTIONS.find((s) => s.key === active) ?? SECTIONS[0];

  return (
    <div className="md:hidden shrink-0 bg-seigaiha text-slate-100">
      <div ref={ref} className="relative flex items-center gap-3 border-b border-white/10 px-3 py-3">
        {/* Hamburger dropdown trigger */}
        <button
          type="button"
          aria-label="Buka menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-slate-100 transition hover:bg-white/20 active:scale-95"
        >
          {open ? (
            // Close (X) icon
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          ) : (
            // Hamburger icon
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          )}
        </button>

        {/* Logo + title (centered-ish) */}
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#c53030] text-sm font-bold text-white shadow-sm">
            D
          </div>
          <div className="leading-tight">
            <div className="font-semibold text-sm">Dashboard PDBK</div>
            <div className="text-[11px] text-slate-400 truncate max-w-[180px]">
              {current.emoji} {current.label}
            </div>
          </div>
        </div>

        {/* Dropdown panel */}
        {open && (
          <div
            role="menu"
            className="absolute left-2 right-2 top-full z-50 mt-2 overflow-hidden rounded-xl bg-[#1a1f36] shadow-xl ring-1 ring-white/15"
          >
            <ul className="py-1">
              {SECTIONS.map((s) => {
                const isActive = active === s.key;
                return (
                  <li key={s.key}>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        onChange(s.key);
                        setOpen(false);
                      }}
                      className={`flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition ${
                        isActive
                          ? "bg-[#c53030] text-white"
                          : "text-slate-200 hover:bg-white/10"
                      }`}
                    >
                      <span className="text-lg" aria-hidden>
                        {s.emoji}
                      </span>
                      <span className="font-medium">{s.label}</span>
                      {isActive && (
                        <svg
                          className="ml-auto"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M5 12l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

// --- Shared UI bits ---
export function Card({
  title,
  subtitle,
  children,
  className = "",
}: {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-2xl border border-[#e8e0d4] bg-[#fffefb] p-5 shadow-washi transition-shadow hover:shadow-washi-hover ${className}`}
    >
      {title && (
        <h2 className="text-base font-semibold tracking-tight text-slate-800">
          {title}
        </h2>
      )}
      {subtitle && (
        <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
      )}
      <div className={title || subtitle ? "mt-4" : ""}>{children}</div>
    </section>
  );
}

type StatTone = "torii" | "indigo" | "wisteria" | "matcha" | "amber" | "sumi";

const TONE_STYLE: Record<StatTone, { stripe: string; iconBg: string; iconColor: string; gauge: string; deco: string }> = {
  torii:    { stripe: "stat-stripe-torii",    iconBg: "rgba(197, 48, 48, 0.10)",  iconColor: "#a12626", gauge: "#c53030", deco: "rgba(254, 215, 226, 0.55)" },
  indigo:   { stripe: "stat-stripe-indigo",   iconBg: "rgba(58, 67, 120, 0.10)",  iconColor: "#3a4378", gauge: "#3a4378", deco: "rgba(199, 210, 254, 0.45)" },
  wisteria: { stripe: "stat-stripe-wisteria", iconBg: "rgba(128, 90, 213, 0.10)", iconColor: "#553c9a", gauge: "#805ad5", deco: "rgba(233, 216, 253, 0.6)" },
  matcha:   { stripe: "stat-stripe-matcha",   iconBg: "rgba(47, 133, 90, 0.10)",  iconColor: "#276749", gauge: "#2f855a", deco: "rgba(198, 246, 213, 0.6)" },
  amber:    { stripe: "stat-stripe-amber",    iconBg: "rgba(183, 121, 31, 0.10)", iconColor: "#744210", gauge: "#b7791f", deco: "rgba(254, 235, 200, 0.6)" },
  sumi:     { stripe: "stat-stripe-sumi",     iconBg: "rgba(26, 31, 54, 0.10)",   iconColor: "#1a202c", gauge: "#1a1f36", deco: "rgba(226, 232, 240, 0.6)" },
};

export function Stat({
  label,
  value,
  hint,
  tone = "torii",
  icon,
  percent,
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: StatTone;
  icon?: React.ReactNode;
  percent?: number; // 0..100 — when provided, draw a faint gauge background
}) {
  const style = TONE_STYLE[tone];

  // Detect a percent-based value automatically if no `percent` prop is passed
  const autoPercent =
    typeof percent === "number"
      ? percent
      : typeof value === "string" && value.trim().endsWith("%")
      ? Math.max(0, Math.min(100, parseFloat(value)))
      : undefined;

  return (
    <div className="relative flex flex-col h-full overflow-hidden rounded-2xl border border-[#e8e0d4] bg-[#fffefb] p-4 shadow-washi transition hover:shadow-washi-hover">
      {/* Top color stripe */}
      <div className={`absolute inset-x-0 top-0 h-1 ${style.stripe}`} />

      <div className="flex items-start justify-between gap-2">
        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          {label}
        </div>
        {icon && (
          <span
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-base"
            style={{ backgroundColor: style.iconBg, color: style.iconColor }}
          >
            {icon}
          </span>
        )}
      </div>

      <div className="relative mt-1.5 flex items-center justify-between gap-3 min-h-[44px]">
        <div
          className="text-3xl font-semibold tracking-tight text-slate-900 leading-none"
          style={{ fontFamily: "var(--font-jetbrains-mono), ui-monospace, monospace" }}
        >
          {value}
        </div>
      </div>

      {hint && <div className={hint ? "mt-1 text-xs text-slate-500" : "mt-0 text-xs text-slate-500 opacity-0 select-none"} aria-hidden={hint ? undefined : true}>{hint ?? "placeholder"}</div>}

      <div className="mt-auto pt-3">
        {autoPercent != null ? (
          <div
            className="h-2 md:h-1.5 w-full overflow-hidden rounded-full bg-slate-200/80"
            role="progressbar"
            aria-valuenow={autoPercent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={label}
          >
            <div
              className="h-full rounded-full transition-[width] duration-500"
              style={{ width: `${autoPercent}%`, backgroundColor: style.gauge }}
            />
          </div>
        ) : (
          <div className="h-2 md:h-1.5 w-full" aria-hidden />
        )}
      </div>
    </div>
  );
}

// --- Chart components ---
function wrapLabel(value: string, max = 16, maxLines = 3) {
  const words = value.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    if ((line + " " + word).trim().length > max && line) {
      lines.push(line);
      line = word;
    } else line = `${line} ${word}`.trim();
  }
  if (line) lines.push(line);
  return lines.slice(0, maxLines);
}

function AxisTick({ x, y, payload, vertical = false, isMobile = false }: any) {
  // Tighter wrap on mobile so labels stay readable when columns are narrow.
  const maxChars = vertical ? (isMobile ? 18 : 22) : (isMobile ? 12 : 20);
  const lines = wrapLabel(String(payload?.value ?? ""), maxChars);
  
  // If horizontal, push the text down by 14px so it doesn't overlap the axis line
  // If vertical, just use default Y behavior
  const yOffset = vertical ? 0 : 14;

  return (
    <g transform={`translate(${x},${y + yOffset})`}>
      {lines.map((line, i) => (
        <text 
          key={line + i} 
          x={vertical ? -8 : 0} 
          y={i * 14} 
          textAnchor={vertical ? "end" : "middle"} 
          fill="#475569" 
          fontSize={11}
          fontWeight={500}
          style={{ fontFamily: "var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif" }}
        >
          {line}
        </text>
      ))}
    </g>
  );
}

export function BarChartCard({ data, xKey, dataKey, color }: { data: any[]; xKey: string; dataKey: string; color?: string }) {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  
  return (
    <div className="h-[300px] sm:h-80 w-full -ml-2 sm:ml-0">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart 
          data={data} 
          margin={isMobile 
            ? { top: 16, right: 8, left: 8, bottom: 36 } 
            : { top: 24, right: 12, left: 0, bottom: 24 }
          }
        >
          {/* Taller XAxis so wrapped labels never overlap the axis line */}
          <XAxis 
            dataKey={xKey} 
            tick={<AxisTick isMobile={isMobile} />} 
            interval={0} 
            height={isMobile ? 64 : 60} 
            axisLine={{ stroke: '#cbd5e1' }} 
            tickLine={false} 
          />
          <YAxis 
            tick={{ fontSize: 11, fill: "#475569", fontFamily: "var(--font-geist-sans), sans-serif", fontWeight: 500 }} 
            width={isMobile ? 32 : 40} 
            axisLine={false} 
            tickLine={false} 
          />
          <Tooltip cursor={{ fill: "#f1f5f9" }} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
          <Bar dataKey={dataKey} radius={[4, 4, 0, 0]} maxBarSize={50}>
            <LabelList 
              dataKey={dataKey} 
              position="insideTop" 
              fill="#ffffff" 
              fontSize={isMobile ? 11 : 12} 
              fontWeight={700} 
              formatter={(value: any) => String(value)} 
            />
            {data.map((_, i) => (
              <Cell key={i} fill={Object.values(COLOR_PALETTE)[i % 5]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function HorizontalBarChart({ data, nameKey, valueKey }: { data: any[]; nameKey: string; valueKey: string }) {
  return (
    <div className="h-80 w-full -ml-2 sm:ml-0">
      <ResponsiveContainer width="100%" height="100%">
        {/* Tightened horizontal margins so the bars span better and aren't floating. */}
        <BarChart data={data} layout="vertical" margin={{ top: 8, right: 28, left: 0, bottom: 0 }}>
          <XAxis type="number" tick={{ fontSize: 11, fill: "#475569", fontFamily: "var(--font-geist-sans), sans-serif", fontWeight: 500 }} height={24} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey={nameKey} tick={<AxisTick vertical />} width={135} axisLine={{ stroke: '#cbd5e1' }} tickLine={false} />
          <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
          <Bar dataKey={valueKey} radius={[0, 4, 4, 0]} maxBarSize={30}>
            <LabelList dataKey={valueKey} position="insideRight" fill="#ffffff" fontSize={11} fontWeight={700} formatter={(value: any) => String(value)} />
            {data.map((_, i) => (
              <Cell key={i} fill={Object.values(COLOR_PALETTE)[i % 5]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

const JENJANG_COLORS: Record<string, string> = {
  PAUD: "#c53030",
  SD: "#805ad5",
  SMP: "#5f8d74",
  SMA: "#c58b39",
  SMK: "#d9829b",
  Kesetaraan: "#9b2c2c",
};
const DEFAULT_DONUT_COLORS = ["#c53030", "#805ad5", "#5f8d74", "#c58b39", "#d9829b", "#9b2c2c"];

function colorFor(name: string, index: number) {
  return JENJANG_COLORS[name] ?? DEFAULT_DONUT_COLORS[index % DEFAULT_DONUT_COLORS.length];
}

function DonutLabel(props: any) {
  const { cx, cy, midAngle, outerRadius, name, value, fill, percent, isMobile } = props;
  const RAD = Math.PI / 180;
  const isLeft = midAngle > 90 && midAngle < 270;
  
  // Anchor point on the slice edge
  const sx = cx + outerRadius * Math.cos(-midAngle * RAD);
  const sy = cy + outerRadius * Math.sin(-midAngle * RAD);
  
  // Dot just outside the slice
  const dotDist = isMobile ? 6 : 8;
  const dx = cx + (outerRadius + dotDist) * Math.cos(-midAngle * RAD);
  const dy = cy + (outerRadius + dotDist) * Math.sin(-midAngle * RAD);
  
  // Leader line bends horizontally
  const bendDist = isMobile ? 10 : 16;
  const bendX = isLeft ? cx - outerRadius - bendDist : cx + outerRadius + bendDist;
  const labelX = isLeft ? bendX - 4 : bendX + 4;
  const labelY = dy;
  const anchor = isLeft ? "end" : "start";
  
  return (
    <g pointerEvents="none" className="overflow-visible">
      <line x1={sx} y1={sy} x2={dx} y2={dy} stroke={fill} strokeWidth={1} />
      <line x1={dx} y1={dy} x2={bendX} y2={dy} stroke={fill} strokeWidth={1} />
      <circle cx={dx} cy={dy} r={2.5} fill={fill} />
      <text
        x={labelX}
        y={labelY - 4}
        textAnchor={anchor}
        fill={fill}
        fontSize={isMobile ? 10 : 11}
        fontWeight={700}
        style={{
          fontFamily: "var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif",
          paintOrder: "stroke",
          stroke: "#fffefb",
          strokeWidth: 3,
          strokeLinejoin: "round",
        }}
      >
        {`${name} (${value})`}
      </text>
      <text
        x={labelX}
        y={labelY + 9}
        textAnchor={anchor}
        fill="#475569"
        fontSize={isMobile ? 9 : 10}
        fontWeight={500}
        style={{
          fontFamily: "var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif",
          paintOrder: "stroke",
          stroke: "#fffefb",
          strokeWidth: 3,
          strokeLinejoin: "round",
        }}
      >
        {`${(percent * 100).toFixed(1).replace(".", ",")}%`}
      </text>
    </g>
  );
}

export function DonutChart({ data }: { data: { name: string; value: number }[] }) {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <div className="w-full">
      <div className="h-[340px] w-full overflow-visible">
        <ResponsiveContainer width="100%" height="100%" className="overflow-visible">
          <PieChart margin={{ top: 20, right: isMobile ? 15 : 30, bottom: 20, left: isMobile ? 15 : 30 }} style={{ overflow: "visible" }}>
            <Pie
              data={data}
              innerRadius={isMobile ? 55 : 75}
              outerRadius={isMobile ? 85 : 115}
              paddingAngle={2}
              stroke="#fffefb"
              strokeWidth={2}
              dataKey="value"
              labelLine={false}
              label={(props: any) => <DonutLabel {...props} isMobile={isMobile} />}
            >
              {data.map((d, i) => (
                <Cell key={d.name} fill={colorFor(d.name, i)} />
              ))}
            </Pie>
            <Tooltip
              formatter={(v: any) => {
                const n = Number(v);
                const pct = total ? Math.round((n / total) * 100) : 0;
                return [`${n} (${pct}%)`, "Jumlah"];
              }}
              contentStyle={{ borderRadius: 8, fontSize: 12 }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs">
        {data.map((d, i) => (
          <div key={d.name} className="flex items-center gap-1.5">
            <span
              className="inline-block h-3 w-3 rounded-sm"
              style={{ backgroundColor: colorFor(d.name, i) }}
              aria-hidden
            />
            <span className="font-medium text-slate-700">{`${d.name} (${d.value})`}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Custom tick for radar axis labels.
// Strategy: aggressively wrap text (max 11 chars/line), so labels stay compact
// and never get clipped at the card edges. Headroom in the margin keeps the
// block visible without shrinking the chart.
const RADAR_LABEL_FONT = "var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif";
function RadarAxisTick({ x, y, cx, cy, payload }: any) {
  const lines = wrapLabel(String(payload?.value ?? "").toUpperCase(), 11, 4);
  // Determine quadrant-based anchor & offset to push labels AWAY from polygon
  const isLeft = x < cx - 12;
  const isRight = x > cx + 12;
  const isTop = y < cy - 12;
  const isBottom = y > cy + 12;
  const textAnchor = isLeft ? "end" : isRight ? "start" : "middle";
  // Push labels further from polygon edges
  const dx = isLeft ? -18 : isRight ? 18 : 0;
  // Vertical: push top labels up, bottom labels down, center labels stay
  const blockH = (lines.length - 1) * 12;
  const dy = isTop ? -blockH - 4 : isBottom ? 8 : -(blockH / 2);
  return (
    <g transform={`translate(${x + dx},${y + dy})`}>
      {lines.map((line, i) => (
        <text
          key={line + i}
          x={0}
          y={i * 12}
          textAnchor={textAnchor}
          fill="#123b35"
          fontSize={10}
          fontWeight={700}
          style={{ fontFamily: RADAR_LABEL_FONT, letterSpacing: "0.01em" }}
        >
          {line}
        </text>
      ))}
    </g>
  );
}

// Vertical radial scale along the central axis (angle=90). The default
// `stroke` on PolarRadiusAxis is hidden so no extra diagonal "stub" line is
// drawn across the chart; only the numeric ticks remain, shifted slightly
// off-center so they don't sit on top of the top vertex label.
function RadarRadiusTick({ x, y, payload }: any) {
  const v = Number(payload?.value ?? 0);
  return (
    <text
      x={x}
      y={y}
      dx={0}
      dy={-2}
      textAnchor="middle"
      fill="#334155"
      fontSize={10}
      fontWeight={500}
      style={{
        fontFamily: RADAR_LABEL_FONT,
        paintOrder: "stroke",
        stroke: "#fffefb",
        strokeWidth: 3,
        strokeLinejoin: "round",
      }}
    >
      {v}
    </text>
  );
}

export function RadarImpactChart({ data }: { data: { aspek: string; sebelum: number; sesudah: number }[] }) {
  return (
    <div className="h-[440px] sm:h-[420px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} outerRadius="65%" margin={{ top: 40, right: 40, bottom: 30, left: 40 }}>
          <PolarGrid stroke="#cbd5e1" strokeWidth={1.25} />
          <PolarAngleAxis dataKey="aspek" tick={<RadarAxisTick />} />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={<RadarRadiusTick />}
            tickCount={5}
            stroke="none"
          />
          <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12, fontWeight: 500 }} />
          <Legend
            iconType="circle"
            wrapperStyle={{ fontSize: 11, paddingTop: 16 }}
            formatter={(value) => <span className="text-slate-700 font-medium">{value}</span>}
          />
          <Radar name="Sebelum" dataKey="sebelum" stroke={COLOR_PALETTE.purple} strokeWidth={2} fill={COLOR_PALETTE.purple} fillOpacity={0.25} />
          <Radar name="Sesudah" dataKey="sesudah" stroke={COLOR_PALETTE.primary} strokeWidth={2} fill={COLOR_PALETTE.primary} fillOpacity={0.4} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function PolarAreaChart({ data }: { data: { aspek: string; nilai: number }[] }) {
  return (
    <div className="h-[440px] sm:h-[420px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} outerRadius="65%" margin={{ top: 40, right: 40, bottom: 30, left: 40 }}>
          <PolarGrid stroke="#cbd5e1" strokeWidth={1.25} />
          <PolarAngleAxis dataKey="aspek" tick={<RadarAxisTick />} />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={<RadarRadiusTick />}
            tickCount={5}
            stroke="none"
          />
          <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12, fontWeight: 500 }} formatter={(v: any) => [`${v}%`, "Persentase"]} />
          <Radar name="Nilai" dataKey="nilai" stroke={COLOR_PALETTE.green} strokeWidth={2} fill={COLOR_PALETTE.green} fillOpacity={0.45} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

// --- Sections ---
export function GuruSection({ data }: { data: GuruData }) {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Instrumen untuk Guru</h1>
        <p className="mt-1 text-sm text-slate-500">
          Ringkasan hasil survei dari guru PDBK di berbagai jenjang dan kelas.
        </p>
      </header>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 items-stretch">
        <Stat label="Total Responden" value={data.totalResponden} hint="Guru berpartisipasi" tone="sumi" icon="👩‍🏫" />
        <Stat label="Kelas Terbanyak" value={mostKelas(data.sebaranKelas)} hint="Guru paling banyak mengajar di sini" tone="indigo" icon="📊" />
        <Stat label="Skill Terbanyak" value={mostSkill(data.capaianKeterampilan)} hint="Keterampilan yang sering dikuasai" tone="wisteria" icon="🎯" />
        <Stat label="Total Kebutuhan" value={data.kebutuhanPendampingan.length} hint="Item pendampingan diminta" tone="amber" icon="📝" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card title="Sebaran Guru per Kelas" subtitle="Jumlah responden per kelas yang diajar">
          <BarChartCard data={data.sebaranKelas} xKey="kelas" dataKey="jumlah" />
        </Card>
        <Card title="Keterampilan Baru yang Dikuasai Peserta Didik" subtitle="Diurutkan dari yang paling banyak">
          <HorizontalBarChart data={data.capaianKeterampilan} nameKey="skill" valueKey="jumlah" />
        </Card>
      </div>

      <Card title="Pendampingan yang Masih Dibutuhkan" subtitle="Ringkasan kebutuhan dari guru">
        {data.kebutuhanPendampingan.length ? (
          <ul className="divide-y divide-slate-100">
            {data.kebutuhanPendampingan.map((k, i) => (
              <li key={i} className="flex items-start gap-3 py-3 text-sm">
                <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#fce7ea] text-xs font-semibold text-[#a12626]">
                  {i + 1}
                </span>
                <span className="text-slate-700">{k}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-500">Belum ada data.</p>
        )}
      </Card>
    </div>
  );
}

export function KepsekSection({ data }: { data: KepsekData }) {
  const totalSekolah = data.sebaranJenjang.reduce((s, d) => s + d.value, 0);
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Instrumen untuk Kepala Sekolah</h1>
        <p className="mt-1 text-sm text-slate-500">
          Perspektif sekolah terhadap dampak program pendampingan PDBK.
        </p>
      </header>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 items-stretch">
        <Stat label="Total Responden" value={data.totalResponden} hint="Kepala sekolah" tone="sumi" icon="🏫" />
        <Stat label="Total Sekolah" value={totalSekolah} hint="Mewakili berbagai jenjang" tone="indigo" icon="🏛️" />
        <Stat
          label="Rata-rata Dampak"
          value={`${Math.round(
            data.dampakProgram.reduce((s, d) => s + d.sesudah, 0) /
              Math.max(1, data.dampakProgram.length),
          )}%`}
          hint="Indeks komposit 5 aspek (sesudah)"
          tone="torii"
          icon="📈"
        />
        <Stat
          label="Kenaikan Tertinggi"
          value={`+${Math.max(
            ...data.dampakProgram.map((d) => d.sesudah - d.sebelum),
          )}%`}
          hint="Aspek yang paling melonjak"
          tone="matcha"
          icon="🚀"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card title="Sebaran Jenjang Sekolah" subtitle="Responden per jenjang">
          <DonutChart data={data.sebaranJenjang} />
        </Card>
        <Card title="Dampak Program Pendampingan" subtitle="Indeks Sebelum vs Sesudah (0–100)">
          <RadarImpactChart data={data.dampakProgram} />
        </Card>
      </div>

      <Card title="Saran Perbaikan dari Kepala Sekolah">
        {data.saran.length ? (
          <ul className="space-y-2 max-h-72 overflow-y-auto pr-2">
            {data.saran.map((s, i) => (
              <li
                key={i}
                className="flex gap-3 rounded-lg border border-[#eee6db] bg-[#faf8f4] px-3 py-2 text-sm text-slate-700"
              >
                <span className="text-slate-400 select-none">{i + 1}.</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-500">Belum ada data.</p>
        )}
      </Card>
    </div>
  );
}

export function OrtuSection({ data }: { data: OrtuData }) {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Instrumen untuk Orang Tua</h1>
        <p className="mt-1 text-sm text-slate-500">
          Penilaian orang tua terhadap manfaat asesmen & pendampingan.
        </p>
      </header>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 items-stretch">
        <Stat label="Total Responden" value={data.totalResponden} hint="Orang tua berpartisipasi" tone="sumi" icon="👨‍👩‍👧" />
        <Stat
          label="Rata-rata Manfaat"
          value={`${Math.round(
            data.capaianManfaat.reduce((s, d) => s + d.nilai, 0) /
              Math.max(1, data.capaianManfaat.length),
          )}%`}
          hint="Skor rata-rata"
          tone="torii"
          icon="❤️"
        />
        <Stat
          label="Aspek Tertinggi"
          value={`${Math.max(...data.capaianManfaat.map((d) => d.nilai))}%`}
          hint={topAspek(data.capaianManfaat)}
          tone="wisteria"
          icon="🌟"
        />
        <Stat label="Total Testimoni" value={data.perubahanPositif.length} hint="Cerita perubahan positif" tone="matcha" icon="💬" />
      </div>

      <Card title="Manfaat Asesmen dari Perspektif Orang Tua" subtitle="Persentase (%)">
        <BarChartCard data={data.capaianManfaat} xKey="aspek" dataKey="nilai" />
      </Card>

      <Card title="Perubahan Positif yang Dirasakan Orang Tua" subtitle="Testimoni kualitatif">
        {data.perubahanPositif.length ? (
          <div className="grid sm:grid-cols-2 gap-3">
            {data.perubahanPositif.map((p, i) => (
              <article key={i} className="rounded-xl border border-[#eee6db] bg-[#faf8f4] p-4 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-800">{p.judul}</h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed" style={{ fontFamily: "serif" }}>
                  “{p.cerita}”
                </p>
              </article>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">Belum ada testimoni.</p>
        )}
      </Card>
    </div>
  );
}

export function SiswaSection({ data }: { data: SiswaData }) {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Instrumen untuk Peserta Didik</h1>
        <p className="mt-1 text-sm text-slate-500">
          Suara peserta didik tentang pengalaman belajar di sekolah inklusif.
        </p>
      </header>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 items-stretch">
        <Stat label="Total Responden" value={data.totalResponden} hint="Peserta didik" tone="sumi" icon="🎓" />
        <Stat
          label="Rata-rata Pengalaman"
          value={`${Math.round(
            data.pengalamanBelajar.reduce((s, d) => s + d.nilai, 0) /
              Math.max(1, data.pengalamanBelajar.length),
          )}%`}
          hint="Skor rata-rata"
          tone="torii"
          icon="✨"
        />
        <Stat
          label="Aspek Tertinggi"
          value={`${Math.max(...data.pengalamanBelajar.map((d) => d.nilai))}%`}
          hint={topAspek(data.pengalamanBelajar)}
          tone="wisteria"
          icon="🏆"
        />
        <Stat label="Total Kata" value={data.halDisukai.length} hint="Hal disukai di sekolah" tone="amber" icon="💭" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card title="Pengalaman Belajar" subtitle="Polar area — aspek yang paling dirasakan positif">
          <PolarAreaChart data={data.pengalamanBelajar} />
        </Card>
        <Card title="Hal yang Paling Disukai di Sekolah" subtitle="Word cloud sederhana dari jawaban siswa">
          <WordCloud items={data.halDisukai} />
        </Card>
      </div>
    </div>
  );
}

// --- Helpers ---
function mostKelas(rows: { kelas: string; jumlah: number }[]) {
  if (!rows.length) return "-";
  return rows.reduce((a, b) => (a.jumlah >= b.jumlah ? a : b)).kelas;
}

function mostSkill(rows: { skill: string; jumlah: number }[]) {
  if (!rows.length) return "-";
  return rows.reduce((a, b) => (a.jumlah >= b.jumlah ? a : b)).skill;
}

function topAspek(rows: { aspek: string; nilai: number }[]) {
  if (!rows.length) return "-";
  return rows.reduce((a, b) => (a.nilai >= b.nilai ? a : b)).aspek;
}

const WORD_PALETTE = [
  { bg: "rgba(197, 48, 48, 0.12)",  fg: "#9b2c2c" }, // torii
  { bg: "rgba(128, 90, 213, 0.14)", fg: "#553c9a" }, // wisteria
  { bg: "rgba(47, 133, 90, 0.14)",  fg: "#276749" }, // matcha
  { bg: "rgba(217, 130, 155, 0.16)",fg: "#9b2c5b" }, // sakura
  { bg: "rgba(183, 121, 31, 0.16)", fg: "#744210" }, // amber
  { bg: "rgba(58, 67, 120, 0.14)",  fg: "#3a4378" }, // indigo
];

function WordCloud({ items }: { items: string[] }) {
  const counts = items.reduce<Record<string, number>>((acc, w) => {
    const k = w.toLowerCase().trim();
    if (!k) return acc;
    acc[k] = (acc[k] ?? 0) + 1;
    return acc;
  }, {});
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  if (entries.length === 0) return <p className="text-sm text-slate-500">Belum ada data.</p>;
  const max = entries[0][1];
  return (
    <div className="relative bg-wordcloud overflow-hidden rounded-2xl border border-[#eee6db] px-3 py-4">
      <div className="sakura-corner" aria-hidden />
      <div className="flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1.5 text-center">
        {entries.map(([word, n], i) => {
          // Logarithmic scale keeps popular words from dominating too much
          const ratio = Math.log(n + 1) / Math.log(max + 1);
          const size = 10 + Math.round(ratio * 10); // 10px .. 20px
          const palette = WORD_PALETTE[i % WORD_PALETTE.length];
          return (
            <span
              key={word}
              title={`${word} · ${n}× disebut`}
              className="inline-block cursor-default rounded-full px-2 py-0.5 font-medium leading-tight transition-transform hover:-translate-y-0.5 hover:scale-[1.04]"
              style={{
                fontSize: `${size}px`,
                backgroundColor: palette.bg,
                color: palette.fg,
                transform: i % 2 === 0 ? "rotate(-0.6deg)" : "rotate(0.6deg)",
                fontWeight: ratio > 0.6 ? 600 : 500,
              }}
            >
              {word}
            </span>
          );
        })}
      </div>
      {entries[0] && (
        <div className="mt-3 text-center text-[11px] text-slate-500">
          Total {entries.length} kata · paling sering: <span className="font-semibold text-slate-700">{entries[0][0]}</span>
        </div>
      )}
    </div>
  );
}
