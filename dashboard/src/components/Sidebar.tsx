"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { GuruData, KepsekData, OrtuData, SiswaData } from "@/lib/types";
import { WordCloud } from "@/components/WordCloud";
import { useTheme } from "@/components/ThemeProvider";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Legend,
  Pie,
  PieChart,
} from "recharts";

type ChartTokens = {
  palette: string[];
  axis: string;
  axisSecondary: string;
  label: string;
  grid: string;
  cursor: string;
  tooltipBg: string;
  tooltipBorder: string;
  tooltipText: string;
  radarPrimary: string;
  radarSecondary: string;
};

const DARK_TOKENS: ChartTokens = {
  palette: ["#f43f5e", "#a78bfa", "#38bdf8", "#34d399", "#fbbf24", "#f472b6", "#60a5fa", "#facc15"],
  axis: "#cbd5e1",
  axisSecondary: "#94a3b8",
  label: "#e8e8ec",
  grid: "rgba(255,255,255,0.08)",
  cursor: "rgba(255,255,255,0.04)",
  tooltipBg: "rgba(15,15,23,0.92)",
  tooltipBorder: "rgba(255,255,255,0.12)",
  tooltipText: "#e8e8ec",
  radarPrimary: "#f43f5e",
  radarSecondary: "#a78bfa",
};

const LIGHT_TOKENS: ChartTokens = {
  palette: ["#e11d48", "#7c3aed", "#0284c7", "#059669", "#d97706", "#db2777", "#2563eb", "#ca8a04"],
  axis: "#475569",
  axisSecondary: "#94a3b8",
  label: "#1e293b",
  grid: "rgba(15,15,23,0.08)",
  cursor: "rgba(15,15,23,0.04)",
  tooltipBg: "rgba(255,255,255,0.96)",
  tooltipBorder: "rgba(15,15,23,0.12)",
  tooltipText: "#0f172a",
  radarPrimary: "#e11d48",
  radarSecondary: "#7c3aed",
};

/** Returns the chart tokens for the currently-applied theme (from <html> class). */
function useChartTheme(): ChartTokens {
  // Subscribe to the <html> class so we re-read tokens after every theme change.
  // We can't use useSyncExternalStore cleanly here because we need to read multiple
  // values from getComputedStyle, so we use a snapshot + subscribe pattern manually
  // and update via a state that the MutationObserver triggers.
  const subscribe = useCallback((cb: () => void) => {
    if (typeof document === "undefined") return () => {};
    const obs = new MutationObserver(cb);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  const getThemeKey = useCallback(
    () => (typeof document === "undefined" ? "dark" : document.documentElement.classList.contains("theme-light") ? "light" : "dark"),
    [],
  );

  // useSyncExternalStore gives us a clean re-render trigger without setState-in-effect.
  useSyncExternalStore(
    subscribe,
    getThemeKey,
    () => "dark",
  );

  // We don't actually need the returned value (we read tokens directly) —
  // the subscription is what matters for re-rendering. But TS needs us to use it.
  // We intentionally ignore the return here.
  void getThemeKey;

  if (typeof document === "undefined") return DARK_TOKENS;
  return document.documentElement.classList.contains("theme-light") ? LIGHT_TOKENS : DARK_TOKENS;
}

/** Returns true saat viewport width < breakpoint (default 640px = Tailwind sm:).
 *  Dipakai chart components untuk compact mode (YAxis lebih kecil, font lebih
 *  besar) sehingga bar chart di mobile tidak terlalu kecil. */
function useChartMode(breakpoint = 640): boolean {
  const [compact, setCompact] = useState(false);
  useEffect(() => {
    const update = () => setCompact(window.innerWidth < breakpoint);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [breakpoint]);
  return compact;
}

function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Aktifkan mode terang" : "Aktifkan mode gelap"}
      title={isDark ? "Mode terang" : "Mode gelap"}
      className="group relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition active:scale-95"
      style={{
        background: "var(--sidebar-active-bg)",
        borderColor: "var(--sidebar-border)",
        color: "var(--sidebar-text)",
      }}
    >
      {isDark ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  );
}

type SectionKey = "guru" | "kepsek" | "ortu" | "siswa";

const SECTIONS: { key: SectionKey; label: string; shortLabel: string; emoji: string }[] = [
  { key: "guru", label: "Instrumen untuk Guru", shortLabel: "Guru", emoji: "👨‍🏫" },
  { key: "kepsek", label: "Instrumen untuk Kepala Sekolah", shortLabel: "Kepsek", emoji: "🎓" },
  { key: "ortu", label: "Instrumen untuk Orang Tua", shortLabel: "Orang Tua", emoji: "👨‍👩‍👧" },
  { key: "siswa", label: "Instrumen untuk Peserta Didik", shortLabel: "Peserta Didik", emoji: "🎒" },
];

export function Sidebar({
  active,
  onChange,
}: {
  active: SectionKey;
  onChange: (k: SectionKey) => void;
}) {
  return (
    <aside
      className="relative hidden md:flex md:w-72 shrink-0 flex-col bg-sidebar border-r"
      style={{
        color: "var(--sidebar-text)",
        borderColor: "var(--sidebar-border-soft)",
      }}
    >
      <div
        className="flex items-center gap-3 border-b px-6 py-6"
        style={{ borderColor: "var(--sidebar-border)" }}
      >
        <div
          className="flex h-9 w-9 items-center justify-center rounded-lg text-lg font-bold anim-pulse-glow"
          style={{ background: "var(--accent)", color: "var(--text-on-accent)" }}
        >
          D
        </div>
        <div className="leading-tight flex-1 min-w-0">
          <div className="font-semibold tracking-wide" style={{ color: "var(--text-primary)" }}>Dashboard</div>
          <div style={{ color: "var(--sidebar-text-muted)" }} className="text-xs">Evaluasi Layanan PDBK</div>
        </div>
        <ThemeToggle />
      </div>
      <div
        className="px-4 pt-5 pb-2 text-[10px] uppercase tracking-[0.2em]"
        style={{ color: "var(--sidebar-text-faint)" }}
      >
        Menu
      </div>
      <nav className="flex flex-col gap-1 px-2">
        {SECTIONS.map((s) => {
          const isActive = active === s.key;
          return (
            <button
              key={s.key}
              onClick={() => onChange(s.key)}
              className="group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition border-l-2"
              style={
                isActive
                  ? {
                      background: "var(--sidebar-active-bg)",
                      color: "var(--text-primary)",
                      borderLeftColor: "var(--accent)",
                      paddingLeft: 10,
                    }
                  : {
                      background: "transparent",
                      color: "var(--sidebar-text-muted)",
                      borderLeftColor: "transparent",
                    }
              }
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = "var(--sidebar-hover-bg)";
                  e.currentTarget.style.color = "var(--text-primary)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "var(--sidebar-text-muted)";
                }
              }}
            >
              <span className="text-lg">{s.emoji}</span>
              <span className="truncate">{s.label}</span>
            </button>
          );
        })}
      </nav>
      <div
        className="mt-auto border-t px-6 py-4 text-xs"
        style={{
          borderColor: "var(--sidebar-border)",
          color: "var(--sidebar-text-faint)",
        }}
      >
        v1.0.0 dari Google Forms
      </div>
      {/* depth meter — abysswalker-style decorative rail on the right edge */}
      <div className="depth-rail pointer-events-none absolute right-0 top-12 bottom-12 w-px opacity-70" />
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
    <div
      className="sticky top-0 z-40 md:hidden bg-sidebar border-b"
      style={{ color: "var(--sidebar-text)", borderColor: "var(--sidebar-border)" }}
    >
      <div ref={ref} className="relative flex items-center gap-3 px-3 py-3">
        <button
          type="button"
          aria-label="Buka menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="flex h-9 w-9 items-center justify-center rounded-lg transition active:scale-95"
          style={{
            background: "var(--sidebar-active-bg)",
            color: "var(--sidebar-text)",
            border: "1px solid var(--sidebar-border)",
          }}
        >
          {open ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          )}
        </button>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold"
            style={{ background: "var(--accent)", color: "var(--text-on-accent)" }}
          >
            D
          </div>
          <div className="leading-tight min-w-0">
            <div className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>Dashboard PDBK</div>
            <div
              className="text-[11px] truncate max-w-[180px]"
              style={{ color: "var(--sidebar-text-muted)" }}
            >
              {current.emoji} {current.label}
            </div>
          </div>
        </div>
        <ThemeToggle />
        {open && (
          <div
            role="menu"
            className="absolute left-2 right-2 top-full z-50 mt-2 overflow-hidden rounded-xl shadow-2xl"
            style={{
              background: "var(--chart-tooltip-bg)",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              border: "1px solid var(--chart-tooltip-border)",
            }}
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
                      className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition border-l-2"
                      style={
                        isActive
                          ? {
                              background: "var(--sidebar-active-bg)",
                              color: "var(--text-primary)",
                              borderLeftColor: "var(--accent)",
                            }
                          : {
                              background: "transparent",
                              color: "var(--sidebar-text)",
                              borderLeftColor: "transparent",
                            }
                      }
                    >
                      <span className="text-lg" aria-hidden>
                        {s.emoji}
                      </span>
                      <span className="font-medium">{s.label}</span>
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
  action,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl glass p-4 sm:p-5 anim-fade-in-up">
      <header className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>{title}</h2>
          {subtitle ? <p className="mt-0.5 text-xs sm:text-sm" style={{ color: "var(--text-muted)" }}>{subtitle}</p> : null}
        </div>
        {action}
      </header>
      <div className="divider-thin -mt-1 mb-3" />
      {children}
    </section>
  );
}

type Tone = "sumi" | "indigo" | "wisteria" | "torii" | "matcha" | "amber" | "sakura";

type ToneStyle = {
  stripe: string;
  iconBg: string;
  iconFg: string;
  glow: string;
};

const TONE_STYLES: Record<Tone, ToneStyle> = {
  sumi:     { stripe: "stat-stripe-sumi",     iconBg: "var(--tone-sumi-icon-bg)",     iconFg: "var(--tone-sumi-icon-text)",     glow: "var(--tone-sumi-glow)" },
  indigo:   { stripe: "stat-stripe-indigo",   iconBg: "var(--tone-indigo-icon-bg)",   iconFg: "var(--tone-indigo-icon-text)",   glow: "var(--tone-indigo-glow)" },
  wisteria: { stripe: "stat-stripe-wisteria", iconBg: "var(--tone-wisteria-icon-bg)", iconFg: "var(--tone-wisteria-icon-text)", glow: "var(--tone-wisteria-glow)" },
  torii:    { stripe: "stat-stripe-torii",    iconBg: "var(--tone-torii-icon-bg)",    iconFg: "var(--tone-torii-icon-text)",    glow: "var(--tone-torii-glow)" },
  matcha:   { stripe: "stat-stripe-matcha",   iconBg: "var(--tone-matcha-icon-bg)",   iconFg: "var(--tone-matcha-icon-text)",   glow: "var(--tone-matcha-glow)" },
  amber:    { stripe: "stat-stripe-amber",    iconBg: "var(--tone-amber-icon-bg)",    iconFg: "var(--tone-amber-icon-text)",    glow: "var(--tone-amber-glow)" },
  sakura:   { stripe: "stat-stripe-sakura",   iconBg: "var(--tone-sakura-icon-bg)",   iconFg: "var(--tone-sakura-icon-text)",   glow: "var(--tone-sakura-glow)" },
};

export function Stat({
  label,
  value,
  hint,
  tone = "sumi",
  icon,
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: Tone;
  icon?: string;
}) {
  const t = TONE_STYLES[tone] ?? TONE_STYLES.sumi;
  return (
    <div
      className="relative overflow-hidden rounded-2xl glass p-4 sm:p-5 transition hover:-translate-y-0.5"
      style={{ boxShadow: `0 0 18px -6px ${t.glow}` }}
    >
      <div className={`absolute inset-x-0 top-0 h-[2px] ${t.stripe}`} aria-hidden />
      <div className="flex items-start justify-between gap-3">
        <div className="text-[11px] sm:text-xs uppercase tracking-[0.18em] font-semibold" style={{ color: "var(--text-muted)" }}>{label}</div>
        {icon ? (
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-lg"
            style={{ background: t.iconBg, color: t.iconFg }}
          >
            <span aria-hidden>{icon}</span>
          </div>
        ) : null}
      </div>
      <div className="mt-2 text-2xl sm:text-[28px] font-semibold leading-tight break-words" style={{ color: "var(--text-primary)" }}>{value}</div>
      {hint ? <div className="mt-2 text-xs" style={{ color: "var(--text-muted)" }}>{hint}</div> : null}
    </div>
  );
}

// --- Helpers ---
function mostKelas(rows: { kelas: string; jumlah: number }[]): string {
  if (!rows.length) return "-";
  return rows.reduce((a, b) => (b.jumlah > a.jumlah ? b : a), rows[0]).kelas;
}

function mostSkill(rows: { skill: string; jumlah: number }[]): string {
  if (!rows.length) return "-";
  return rows.reduce((a, b) => (b.jumlah > a.jumlah ? b : a), rows[0]).skill;
}

function topAspek(rows: { aspek: string; nilai: number }[]): string {
  if (!rows.length) return "-";
  return rows.reduce((a, b) => (b.nilai > a.nilai ? b : a), rows[0]).aspek;
}

// --- Charts ---
export function BarChartCard({
  data,
  xKey,
  dataKey,
  height = 280,
}: {
  data: Array<Record<string, string | number>>;
  xKey: string;
  dataKey: string;
  height?: number;
}) {
  const ct = useChartTheme();
  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 24, right: 8, left: -16, bottom: 0 }}>
          <XAxis dataKey={xKey} tick={{ fontSize: 12, fill: ct.axis }} axisLine={false} tickLine={false} />
          <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: ct.axis }} axisLine={false} tickLine={false} />
          <Tooltip
            cursor={{ fill: ct.cursor }}
            contentStyle={{ background: ct.tooltipBg, border: `1px solid ${ct.tooltipBorder}`, borderRadius: 10, color: ct.tooltipText, fontSize: 12 }}
          />
          <Bar dataKey={dataKey} radius={[6, 6, 0, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill={ct.palette[i % ct.palette.length]} />
            ))}
            <LabelList dataKey={dataKey} position="top" style={{ fontSize: 12, fill: ct.label, fontWeight: 600 }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// Pie chart dengan legend vertikal di kanan + label persentase di dalam slice.
// Mirip visual ringkasan Google Forms. Data shape: { name, value }.
export function PieChartCard({
  data,
  nameKey = "name",
  valueKey = "value",
  height = 280,
}: {
  data: Array<Record<string, string | number>>;
  nameKey?: string;
  valueKey?: string;
  height?: number;
}) {
  const ct = useChartTheme();
  const total = data.reduce((s, d) => s + Number(d[valueKey] || 0), 0);
  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer>
        <PieChart>
          <Tooltip
            contentStyle={{ background: ct.tooltipBg, border: `1px solid ${ct.tooltipBorder}`, borderRadius: 10, color: ct.tooltipText, fontSize: 12 }}
            formatter={(value, name) => [`${value} (${total ? Math.round((Number(value) / total) * 100) : 0}%)`, String(name)]}
          />
          <Legend
            layout="horizontal"
            verticalAlign="bottom"
            align="center"
            iconType="circle"
            wrapperStyle={{ fontSize: 12, color: ct.label, paddingTop: 12 }}
          />
          <Pie
            data={data}
            dataKey={valueKey}
            nameKey={nameKey}
            cx="50%"
            cy="45%"
            outerRadius="70%"
            innerRadius="0"
            paddingAngle={1}
            stroke={ct.tooltipBg}
            label={({ percent }: { percent?: number }) => (percent && percent >= 0.05 ? `${Math.round(percent * 100)}%` : "")}
            labelLine={false}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={ct.palette[i % ct.palette.length]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function HorizontalBarChart({
  data,
  nameKey,
  valueKey,
  fullNameKey,
  height = 320,
  compact,
}: {
  data: Array<Record<string, string | number>>;
  nameKey: string;
  valueKey: string;
  // Optional: jika diisi, YAxis tick akan membungkus teks pendek dengan <title>
  // SVG berisi teks penuh dari field ini, sehingga saat hover browser menampilkan
  // tooltip native berisi label lengkap (berguna untuk label panjang yang
  // di-truncate oleh formatChartLabel). Pattern sama dengan DampakGroupedBarChart.
  fullNameKey?: string;
  height?: number;
  // Optional override: true=paksa compact, false=paksa normal, undefined=auto
  // (auto = true saat viewport <640px via useChartMode).
  compact?: boolean;
}) {
  const ct = useChartTheme();
  const compactAuto = useChartMode();
  const isCompact = compact ?? compactAuto;
  // Compact: YAxis lebih kecil (lebih banyak ruang untuk bar di mobile).
  const yWidth = isCompact ? 80 : 130;
  const yFont = isCompact ? 13 : 12;
  const labelFont = isCompact ? 13 : 12;
  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer>
        <BarChart data={data} layout="vertical" margin={{ top: 8, right: 32, left: 8, bottom: 0 }}>
          <XAxis type="number" tick={{ fontSize: isCompact ? 11 : 12, fill: ct.axis }} axisLine={false} tickLine={false} />
          <YAxis
            type="category"
            dataKey={nameKey}
            width={yWidth}
            tick={({ x, y, payload }) => {
              const idx = payload?.index ?? -1;
              const short = String(payload?.value ?? "");
              const full = fullNameKey && idx >= 0 ? String(data[idx]?.[fullNameKey] ?? short) : short;
              return (
                <g>
                  {fullNameKey && <title>{full}</title>}
                  <text x={x} y={y} textAnchor="end" fill={ct.label} fontSize={yFont}>
                    {short}
                  </text>
                </g>
              );
            }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: ct.cursor }}
            contentStyle={{ background: ct.tooltipBg, border: `1px solid ${ct.tooltipBorder}`, borderRadius: 10, color: ct.tooltipText, fontSize: 12 }}
          />
          <Bar dataKey={valueKey} radius={[0, 6, 6, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill={ct.palette[i % ct.palette.length]} />
            ))}
            <LabelList dataKey={valueKey} position="right" style={{ fontSize: labelFont, fill: ct.label, fontWeight: 600 }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// Tick label radar: tampilkan label pendek sebagai teks, dan teks asli
// (sebelum di-truncate oleh formatChartLabel) sebagai tooltip native SVG
// via <title>. Saat user hover pada label, browser otomatis show full text.
type PolarAngleTickDatum = { aspek: string; aspekFull?: string };
type PolarAngleTickProps = {
  x?: number;
  y?: number;
  payload?: { value?: string; index?: number };
  fill?: string;
  data?: PolarAngleTickDatum[];
};

function PolarAngleTick({ x = 0, y = 0, payload, fill, data }: PolarAngleTickProps) {
  const short = payload?.value ?? "";
  const full = data?.[payload?.index ?? -1]?.aspekFull ?? short;
  return (
    <g>
      <title>{full}</title>
      <text x={x} y={y} textAnchor="middle" fill={fill} fontSize={12}>
        {short}
      </text>
    </g>
  );
}

export function PolarAreaChart({
  data,
  height = 320,
}: {
  data: Array<{ aspek: string; aspekFull?: string; nilai: number }>;
  height?: number;
}) {
  const ct = useChartTheme();
  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer>
        <RadarChart
          data={data}
          outerRadius="75%"
          margin={{ top: 16, right: 64, bottom: 16, left: 64 }}
        >
          <PolarGrid stroke={ct.grid} />
          <PolarAngleAxis dataKey="aspek" tick={<PolarAngleTick fill={ct.label} data={data} />} />
          <PolarRadiusAxis angle={45} domain={[0, 100]} tick={{ fontSize: 10, fill: ct.axisSecondary }} />
          <Radar name="Skor" dataKey="nilai" stroke={ct.radarPrimary} fill={ct.radarPrimary} fillOpacity={0.45} />
          <Tooltip
            contentStyle={{ background: ct.tooltipBg, border: `1px solid ${ct.tooltipBorder}`, borderRadius: 10, color: ct.tooltipText, fontSize: 12 }}
          />
          <Legend wrapperStyle={{ fontSize: 12, color: ct.axis }} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

// Bar chart horizontal khusus shape {aspek, nilai} (skor/persentase).
// Dipakai card "Manfaat Asesmen" ortu yang sumber datanya pertanyaan
// multi-aspek di Google Form — radar/polar tidak cocok untuk banyak aspek
// dengan nilai yang seragam, sehingga sulit dibaca. Mirip visual Google
// Forms summary (bar horizontal + label nilai di kanan).
export function AspekBarChart({
  data,
  height = 320,
  compact,
}: {
  data: Array<{ aspek: string; aspekFull?: string; nilai: number }>;
  height?: number;
  // Optional override: true=paksa compact, false=paksa normal, undefined=auto
  // (auto = true saat viewport <640px via useChartMode).
  compact?: boolean;
}) {
  const ct = useChartTheme();
  const compactAuto = useChartMode();
  const isCompact = compact ?? compactAuto;
  // Compact: YAxis lebih kecil (lebih banyak ruang untuk bar di mobile).
  const yWidth = isCompact ? 90 : 160;
  const yFont = isCompact ? 13 : 12;
  const labelFont = isCompact ? 12 : 11;
  const marginR = isCompact ? 40 : 56;
  // Auto-grow jika baris >5 agar tidak terpotong (lebih ringkas di compact).
  const growPerRow = isCompact ? 24 : 28;
  const computed = height + Math.max(0, data.length - 5) * growPerRow;
  return (
    <div style={{ width: "100%", height: computed }}>
      <ResponsiveContainer>
        <BarChart data={data} layout="vertical" margin={{ top: 8, right: marginR, left: 8, bottom: 8 }}>
          <XAxis
            type="number"
            domain={[0, 100]}
            tick={{ fontSize: isCompact ? 10 : 11, fill: ct.axis }}
            axisLine={false}
            tickLine={false}
            unit="%"
          />
          <YAxis
            type="category"
            dataKey="aspek"
            width={yWidth}
            tick={({ x, y, payload }) => {
              const idx = payload?.index ?? -1;
              const short = String(payload?.value ?? "");
              const full = data[idx]?.aspekFull ?? short;
              return (
                <g>
                  <title>{full}</title>
                  <text x={x} y={y} textAnchor="end" fill={ct.label} fontSize={yFont}>
                    {short}
                  </text>
                </g>
              );
            }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: ct.cursor }}
            contentStyle={{
              background: ct.tooltipBg,
              border: `1px solid ${ct.tooltipBorder}`,
              borderRadius: 10,
              color: ct.tooltipText,
              fontSize: 12,
            }}
            formatter={(value) => [`${value}%`, "Skor"]}
          />
          <Bar dataKey="nilai" radius={[0, 6, 6, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill={ct.palette[i % ct.palette.length]} />
            ))}
            <LabelList
              dataKey="nilai"
              position="right"
              formatter={(value) => `${value}%`}
              style={{ fontSize: labelFont + 1, fill: ct.label, fontWeight: 600 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// Grouped horizontal bar chart untuk Sebelum vs Sesudah per aspek.
// Mirip visual ringkasan Google Forms: dua bar side-by-side per row
// + label "N (X%)" di ujung kanan.
function DampakGroupedBarChart({
  data,
  height = 320,
  compact,
}: {
  data: Array<{ aspek: string; aspekFull?: string; sebelum: number; sesudah: number; sebelumCount?: number; sesudahCount?: number }>;
  height?: number;
  // Optional override: true=paksa compact, false=paksa normal, undefined=auto
  // (auto = true saat viewport <640px via useChartMode).
  compact?: boolean;
}) {
  const ct = useChartTheme();
  const compactAuto = useChartMode();
  const isCompact = compact ?? compactAuto;
  // Compact: YAxis lebih kecil (lebih banyak ruang untuk bar di mobile).
  const yWidth = isCompact ? 100 : 180;
  const yFont = isCompact ? 13 : 12;
  const labelFont = isCompact ? 12 : 11;
  const marginR = isCompact ? 56 : 72;
  // Auto-grow jika baris >5 (lebih ringkas di compact).
  const growPerRow = isCompact ? 24 : 32;
  const computed = height + Math.max(0, data.length - 5) * growPerRow;
  return (
    <div style={{ width: "100%", height: computed }}>
      <ResponsiveContainer>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 8, right: marginR, left: 8, bottom: 8 }}
          barCategoryGap="20%"
        >
          <XAxis
            type="number"
            domain={[0, 100]}
            tick={{ fontSize: isCompact ? 10 : 11, fill: ct.axis }}
            axisLine={false}
            tickLine={false}
            unit="%"
          />
          <YAxis
            type="category"
            dataKey="aspek"
            width={yWidth}
            tick={({ x, y, payload }) => {
              const full = data[payload?.index ?? -1]?.aspekFull ?? String(payload?.value ?? "");
              return (
                <g>
                  <title>{full}</title>
                  <text x={x} y={y} textAnchor="end" fill={ct.label} fontSize={yFont}>
                    {payload?.value}
                  </text>
                </g>
              );
            }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: ct.cursor }}
            contentStyle={{
              background: ct.tooltipBg,
              border: `1px solid ${ct.tooltipBorder}`,
              borderRadius: 10,
              color: ct.tooltipText,
              fontSize: 12,
            }}
            formatter={(value, name) => [`${value}%`, String(name)]}
          />
          <Bar dataKey="sebelum" name="Sebelum" fill={ct.radarSecondary} radius={[0, 4, 4, 0]}>
            <LabelList
              dataKey={(d: { sebelum: number; sebelumCount?: number }) =>
                `${d.sebelumCount ?? 0} (${d.sebelum}%)`
              }
              position="right"
              style={{ fontSize: labelFont, fill: ct.axisSecondary, fontWeight: 500 }}
            />
          </Bar>
          <Bar dataKey="sesudah" name="Sesudah" fill={ct.radarPrimary} radius={[0, 4, 4, 0]}>
            <LabelList
              dataKey={(d: { sesudah: number; sesudahCount?: number }) =>
                `${d.sesudahCount ?? 0} (${d.sesudah}%)`
              }
              position="right"
              style={{ fontSize: labelFont, fill: ct.label, fontWeight: 600 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// --- Section components ---
function SectionHeader({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle: string }) {
  return (
    <header>
      <div className="text-[10px] uppercase tracking-[0.25em] font-semibold" style={{ color: "var(--accent)" }}>{eyebrow}</div>
      <h1 className="mt-1 text-2xl sm:text-3xl font-light tracking-tight" style={{ color: "var(--text-primary)" }}>{title}</h1>
      <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>{subtitle}</p>
      <div className="divider-thin mt-4" />
    </header>
  );
}

function NumberedList({ items, emptyText }: { items: string[]; emptyText: string }) {
  if (!items.length) return <p className="text-sm" style={{ color: "var(--text-muted)" }}>{emptyText}</p>;
  return (
    <ul style={{ borderColor: "var(--border)" }} className="divide-y">
      {items.map((k, i) => (
        <li key={i} className="flex items-start gap-3 py-3 text-sm">
          <span
            className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ring-1"
            style={{ background: "var(--sidebar-active-bg)", color: "var(--text-primary)", borderColor: "var(--border)" }}
          >
            {i + 1}
          </span>
          <span style={{ color: "var(--text-secondary)" }}>{k}</span>
        </li>
      ))}
    </ul>
  );
}

export function GuruSection({ data }: { data: GuruData }) {
  const most = mostKelas(data.sebaranKelas);
  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Bagian 1 dari 4"
        title="Instrumen untuk Guru"
        subtitle="Ringkasan hasil survei dari guru PDBK di berbagai jenjang dan kelas."
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 items-stretch">
        <Stat label="Total Responden" value={data.totalResponden} hint="Guru berpartisipasi" tone="sumi" icon="👥" />
        <Stat label="Kelas Terbanyak" value={most} hint="Guru paling banyak mengajar di sini" tone="indigo" icon="🏷️" />
        <Stat label="Skill Terbanyak" value={mostSkill(data.capaianKeterampilan)} hint="Keterampilan yang sering dikuasai" tone="wisteria" icon="⭐" />
        <Stat label="Total Kebutuhan" value={data.kebutuhanPendampingan.length} hint="Item pendampingan diminta" tone="amber" icon="📋" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card title="Sebaran Guru per Kelas" subtitle="Jumlah responden per kelas yang diajar">
          <BarChartCard data={data.sebaranKelas} xKey="kelas" dataKey="jumlah" />
        </Card>
        <Card title="Keterampilan Baru yang Dikuasai Peserta Didik" subtitle="Diurutkan dari yang paling banyak">
          <HorizontalBarChart
            data={data.capaianKeterampilan}
            nameKey="skill"
            valueKey="jumlah"
            fullNameKey="skillFull"
          />
        </Card>
      </div>
      <Card title="Pendampingan yang Masih Dibutuhkan" subtitle="Ringkasan kebutuhan dari guru">
        <NumberedList items={data.kebutuhanPendampingan} emptyText="Belum ada data." />
      </Card>
    </div>
  );
}

export function KepsekSection({ data }: { data: KepsekData }) {
  const totalSekolah = data.sebaranJenjang.reduce((s, d) => s + d.value, 0);
  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Bagian 2 dari 4"
        title="Instrumen untuk Kepala Sekolah"
        subtitle="Perspektif sekolah terhadap dampak program pendampingan PDBK."
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 items-stretch">
        <Stat label="Total Responden" value={data.totalResponden} hint="Kepala sekolah" tone="sumi" icon="👥" />
        <Stat label="Total Sekolah" value={totalSekolah} hint="Mewakili berbagai jenjang" tone="indigo" icon="🏫" />
        <Stat
          label="Rata-rata Dampak"
          value={`${Math.round(
            data.dampakProgram.reduce((s, d) => s + d.sesudah, 0) / Math.max(1, data.dampakProgram.length),
          )}%`}
          hint="Indeks komposit 5 aspek (sesudah)"
          tone="torii"
          icon="📊"
        />
        {/* HIDDEN: kotak stat "Kenaikan Tertinggi" (lihat dashboard/HIDDEN_FEATURES.md). */}
        {/* <Stat
          label="Kenaikan Tertinggi"
          value={`+${Math.max(...data.dampakProgram.map((d) => d.sesudah - d.sebelum))}%`}
          hint="Aspek yang paling melonjak"
          tone="matcha"
          icon="📈"
        /> */}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card title="Sebaran per Jenjang" subtitle="Distribusi sekolah responden">
          <PieChartCard data={data.sebaranJenjang} nameKey="name" valueKey="value" />
        </Card>
        <Card title="Dampak Program" subtitle="Lima aspek utama">
          <DampakGroupedBarChart data={data.dampakProgram} />
        </Card>
      </div>
      <Card title="Saran untuk Perbaikan Program" subtitle="Catatan dari kepala sekolah">
        <NumberedList items={data.saran} emptyText="Belum ada data." />
      </Card>
    </div>
  );
}

export function OrtuSection({ data }: { data: OrtuData }) {
  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Bagian 3 dari 4"
        title="Instrumen untuk Orang Tua"
        subtitle="Perspektif orang tua terhadap manfaat pendampingan bagi anak."
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 items-stretch">
        <Stat label="Total Responden" value={data.totalResponden} hint="Orang tua berpartisipasi" tone="sumi" icon="👨‍👩‍👧" />
        <Stat
          label="Rata-rata Manfaat"
          value={`${Math.round(
            data.capaianManfaat.reduce((s, d) => s + d.nilai, 0) / Math.max(1, data.capaianManfaat.length),
          )}%`}
          hint="Skor rata-rata"
          tone="torii"
          icon="💡"
        />
        <Stat
          label="Aspek Tertinggi"
          value={`${Math.max(...data.capaianManfaat.map((d) => d.nilai))}%`}
          hint={topAspek(data.capaianManfaat)}
          tone="wisteria"
          icon="🏆"
        />
        <Stat label="Total Testimoni" value={data.perubahanPositif.length} hint="Cerita perubahan positif" tone="matcha" icon="💬" />
      </div>
      <Card title="Manfaat Asesmen dari Perspektif Orang Tua" subtitle="Aspek yang paling dirasakan positif">
        <AspekBarChart data={data.capaianManfaat} />
      </Card>
      <Card title="Perubahan Positif yang Dirasakan Orang Tua" subtitle="Testimoni kualitatif">
        {data.perubahanPositif.length ? (
          <div className="grid sm:grid-cols-2 gap-3">
            {data.perubahanPositif.map((p, i) => (
              <article
                key={i}
                className="relative rounded-xl border p-4 pl-5 anim-fade-in-up"
                style={{
                  animationDelay: `${i * 60}ms`,
                  borderColor: "var(--testimoni-border)",
                  background: "var(--testimoni-bg)",
                }}
              >
                <span
                  className="absolute left-0 top-3 bottom-3 w-[2px] rounded-full"
                  style={{ background: "linear-gradient(to bottom, var(--testimoni-accent-from), var(--testimoni-accent-to))" }}
                  aria-hidden
                />
                <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{p.judul}</h3>
                <p
                  className="mt-2 text-sm leading-relaxed italic"
                  style={{ color: "var(--text-secondary)", fontFamily: "ui-serif, Georgia, 'Times New Roman', serif" }}
                >
                  &ldquo;{p.cerita}&rdquo;
                </p>
              </article>
            ))}
          </div>
        ) : (
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>Belum ada testimoni.</p>
        )}
      </Card>
    </div>
  );
}

export function SiswaSection({ data }: { data: SiswaData }) {
  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Bagian 4 dari 4"
        title="Instrumen untuk Peserta Didik"
        subtitle="Suara peserta didik tentang pengalaman belajar dan hal yang mereka sukai."
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 items-stretch">
        <Stat label="Total Responden" value={data.totalResponden} hint="Peserta didik" tone="sumi" icon="🎒" />
        <Stat
          label="Rata-rata Pengalaman"
          value={`${Math.round(
            data.pengalamanBelajar.reduce((s, d) => s + d.nilai, 0) / Math.max(1, data.pengalamanBelajar.length),
          )}%`}
          hint="Skor rata-rata"
          tone="torii"
          icon="📐"
        />
        <Stat
          label="Aspek Tertinggi"
          value={`${Math.max(...data.pengalamanBelajar.map((d) => d.nilai))}%`}
          hint={topAspek(data.pengalamanBelajar)}
          tone="wisteria"
          icon="🌟"
        />
        <Stat label="KATA UNIK" value={new Set(data.halDisukai.map(w => w.toLowerCase())).size} hint="Kata Unik Yang Muncul" tone="matcha" icon="💚" />
      </div>
      <Card title="Pengalaman Belajar setelah Asesmen" subtitle="Aspek yang paling dirasakan positif">
        <PolarAreaChart data={data.pengalamanBelajar} />
      </Card>
      <Card title="Hal yang Paling Disukai di Sekolah" subtitle="Kata-kata yang sering muncul">
        <div className="rounded-xl bg-wordcloud p-2">
          <WordCloud words={data.halDisukai} height={300} />
        </div>
      </Card>
    </div>
  );
}
