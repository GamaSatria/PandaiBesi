"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Menu, Moon, Sun, X } from "lucide-react";
import type { Period, SectionKey } from "@/lib/types";
import { PERIODS, PERIOD_SECTIONS } from "@/lib/types";
import { useTheme } from "@/components/useTheme";
import { SECTIONS } from "@/components/nav-meta";

type NavProps = Readonly<{
  active: SectionKey;
  onChange: (k: SectionKey) => void;
  activePeriod: Period;
  onPeriodChange: (p: Period) => void;
}>;

// Satu tombol: klik untuk berganti tema. Ikon yang tampil (bulan di mode
// terang, matahari di mode gelap) diatur CSS dari class tema di <html>
// (.theme-icon-*), jadi tidak berkedip saat hidrasi dan berganti dengan
// transisi halus.
function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const label = theme === "dark" ? "Aktifkan mode terang" : "Aktifkan mode gelap";
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      className="focus-ring relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line bg-surface-muted text-ink transition-[background-color,transform] duration-150 hover:bg-hover active:scale-95"
    >
      <Moon aria-hidden className="theme-icon theme-icon-moon absolute h-[18px] w-[18px]" />
      <Sun aria-hidden className="theme-icon theme-icon-sun absolute h-[18px] w-[18px]" />
    </button>
  );
}

function Logo({ preload = false }: Readonly<{ preload?: boolean }>) {
  return (
    <Image
      src="/logo.webp"
      alt="Logo PDBK"
      width={40}
      height={40}
      preload={preload}
      className="h-10 w-10 shrink-0 rounded-xl object-cover outline-1 -outline-offset-1 outline-line"
    />
  );
}

function GroupLabel({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className="px-2 text-[11px] font-bold uppercase tracking-[0.14em] text-muted">{children}</div>;
}

// Tanpa ikon: titik berwarna menandai nada tiap instrumen (sama dengan warna
// halaman instrumennya).
function SectionList({ active, onChange, activePeriod }: Omit<NavProps, "onPeriodChange">) {
  const available = PERIOD_SECTIONS[activePeriod];
  return (
    <div className="flex flex-col gap-0.5 rounded-[20px] bg-surface-muted p-1.5">
      {SECTIONS.map((s) => {
        const disabled = !available.includes(s.key);
        return (
          <button
            key={s.key}
            type="button"
            onClick={() => onChange(s.key)}
            disabled={disabled}
            aria-current={active === s.key ? "page" : undefined}
            title={disabled ? "Tidak tersedia di periode ini" : undefined}
            // Tinggi tetap (satu baris) agar kotak menu tidak berubah ukuran saat periode diganti.
            className={`nav-btn focus-ring tone-${s.tone} flex h-11 w-full items-center gap-3 rounded-[14px] px-3.5 text-left`}
          >
            <span aria-hidden className="nav-dot h-2.5 w-2.5 shrink-0 rounded-full" />
            <span className="nav-label min-w-0 flex-1 truncate text-[14.5px] leading-5">
              {s.label}
              {disabled ? <span className="sr-only">, tidak tersedia di periode ini</span> : null}
            </span>
            {disabled ? (
              <span aria-hidden className="shrink-0 text-[11px] font-semibold text-muted">
                Tidak ada
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

function PeriodList({ activePeriod, onPeriodChange }: Pick<NavProps, "activePeriod" | "onPeriodChange">) {
  return (
    <div role="group" aria-label="Periode data" className="flex flex-col rounded-[20px] bg-surface-muted p-1.5">
      {PERIODS.map((p, i) => {
        const [year, ...semester] = p.label.split(" ");
        const isFirst = i === 0;
        const isLast = i === PERIODS.length - 1;
        return (
          <button
            key={p.key}
            type="button"
            onClick={() => onPeriodChange(p.key)}
            aria-pressed={activePeriod === p.key}
            aria-label={`${p.label} (${PERIOD_SECTIONS[p.key].length} instrumen)`}
            className="nav-btn focus-ring flex h-[60px] w-full items-stretch gap-3.5 rounded-[14px] pl-4 pr-3 text-left"
          >
            <span aria-hidden className="flex w-3 shrink-0 flex-col items-center">
              <span className={`w-0.5 flex-1 ${isFirst ? "" : "bg-line-strong"}`} />
              <span className="period-node h-3 w-3 shrink-0 rounded-full" />
              <span className={`w-0.5 flex-1 ${isLast ? "" : "bg-line-strong"}`} />
            </span>
            <span aria-hidden className="flex min-w-0 flex-1 flex-col justify-center">
              <span className="period-year text-[11.5px] font-extrabold leading-4 tabular-nums text-muted">
                {year}
                {isFirst ? " · Terbaru" : ""}
              </span>
              <span className="text-sm font-bold leading-5 text-ink">{semester.join(" ")}</span>
            </span>
            <span aria-hidden className="flex items-center">
              <span className="period-count whitespace-nowrap rounded-full bg-hover px-2 py-0.5 text-[11px] font-bold tabular-nums text-muted">
                {PERIOD_SECTIONS[p.key].length} instrumen
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

function Credit() {
  return (
    <p className="text-[11.5px] leading-relaxed text-muted">
      Pandaibesi by
      <br />
      <span className="font-semibold text-body">Dr. Sri Rakhmawanti, S.E., M.M.</span>
    </p>
  );
}

export function Sidebar(props: NavProps) {
  return (
    <aside className="bg-sidebar hidden w-72 shrink-0 flex-col border-r border-line md:flex">
      <div className="flex items-center gap-3 px-5 pb-5 pt-[22px]">
        <Logo preload />
        <div className="min-w-0 flex-1 leading-tight">
          <div className="text-base font-extrabold tracking-[-0.01em] text-ink">Dashboard</div>
          <div className="text-xs font-medium text-muted">Evaluasi Layanan PDBK</div>
        </div>
        <ThemeToggle />
      </div>
      <div className="divider-fade mx-5" />
      <nav aria-label="Navigasi dashboard" className="flex flex-1 flex-col gap-6 overflow-y-auto px-4 pb-4 pt-5">
        <div className="flex flex-col gap-2.5">
          <GroupLabel>Instrumen untuk</GroupLabel>
          <SectionList active={props.active} onChange={props.onChange} activePeriod={props.activePeriod} />
        </div>
        <div className="flex flex-col gap-2.5">
          <GroupLabel>Periode</GroupLabel>
          <PeriodList activePeriod={props.activePeriod} onPeriodChange={props.onPeriodChange} />
        </div>
      </nav>
      <div className="mx-5 border-t border-line py-4">
        <Credit />
      </div>
    </aside>
  );
}

export function MobileNav(props: NavProps) {
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

  return (
    <div ref={ref} className="bg-sidebar sticky top-0 z-40 border-b border-line md:hidden">
      <div className="flex items-center gap-3 px-4 py-3">
        <Logo />
        <div className="min-w-0 flex-1 truncate text-[15px] font-extrabold leading-tight text-ink">Dashboard PDBK</div>
        <ThemeToggle />
        <button
          type="button"
          aria-label={open ? "Tutup menu" : "Buka menu"}
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen((v) => !v)}
          className="focus-ring flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line bg-surface-muted text-ink active:scale-95"
        >
          {open ? <X aria-hidden className="h-5 w-5" /> : <Menu aria-hidden className="h-5 w-5" />}
        </button>
      </div>
      {open ? (
        <div
          id="mobile-menu"
          className="absolute inset-x-0 top-full max-h-[calc(100dvh-4rem)] overflow-y-auto border-b border-line bg-surface px-4 pb-5 pt-4 shadow-raised"
        >
          <nav aria-label="Navigasi dashboard" className="flex flex-col gap-5">
            <div className="flex flex-col gap-2.5">
              <GroupLabel>Instrumen untuk</GroupLabel>
              <SectionList
                active={props.active}
                activePeriod={props.activePeriod}
                onChange={(k) => {
                  props.onChange(k);
                  setOpen(false);
                }}
              />
            </div>
            <div className="flex flex-col gap-2.5">
              <GroupLabel>Periode</GroupLabel>
              <PeriodList
                activePeriod={props.activePeriod}
                onPeriodChange={(p) => {
                  props.onPeriodChange(p);
                  setOpen(false);
                }}
              />
            </div>
            <div className="border-t border-line pt-4">
              <Credit />
            </div>
          </nav>
        </div>
      ) : null}
    </div>
  );
}
