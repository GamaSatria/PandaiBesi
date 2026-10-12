"use client";

import { useRef, useState } from "react";
import type { DashboardData, Period, SectionKey } from "@/lib/types";
import { PERIOD_SECTIONS } from "@/lib/types";
import { DATA_2025_S1, DATA_2025_S2 } from "@/lib/data-2025";
import { SECTION_BY_KEY, type SectionMeta } from "./nav-meta";
import { Sidebar, MobileNav } from "./Sidebar";
import { GuruSection, KepsekSection, OrtuSection, SiswaSection } from "./sections";

// Periode berdata statis. Periode yang tidak terdaftar di sini (2026 S1)
// memakai data live dari server (prop `data`).
const STATIC_DATA: Partial<Record<Period, DashboardData>> = {
  "2025-s2": DATA_2025_S2,
  "2025-s1": DATA_2025_S1,
};

// Judul halaman: label instrumen + pengantar yang menjelaskan siapa yang
// mengisi dan apa saja yang ditampilkan di halaman ini.
function PageHeader({ meta, isArchive }: Readonly<{ meta: SectionMeta; isArchive: boolean }>) {
  const description = isArchive && meta.archiveDescription ? meta.archiveDescription : meta.description;
  return (
    <header>
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-tone-ink">Instrumen untuk</p>
      <h1
        id="section-title"
        className="mt-1.5 text-[30px] font-extrabold leading-[1.1] tracking-[-0.025em] text-balance text-ink sm:text-[38px]"
      >
        {meta.label}
      </h1>
      <p className="mt-3 max-w-3xl text-[15px] leading-relaxed text-pretty text-body sm:text-base">{description}</p>
      <div aria-hidden className="divider-fade mt-6 md:mt-8" />
    </header>
  );
}

export function DashboardShell({ data }: Readonly<{ data: DashboardData }>) {
  const [active, setActive] = useState<SectionKey>("guru");
  const [activePeriod, setActivePeriod] = useState<Period>("2026-s1");
  // Animasi masuk hanya setelah pengguna berpindah tampilan, bukan saat load
  // pertama — konten awal langsung terlihat (LCP tidak tertunda animasi).
  const [hasSwitched, setHasSwitched] = useState(false);
  const mainRef = useRef<HTMLElement | null>(null);

  const afterSwitch = () => {
    setHasSwitched(true);
    mainRef.current?.scrollTo({ top: 0 });
  };

  const handleSectionChange = (k: SectionKey) => {
    setActive(k);
    afterSwitch();
  };

  const handlePeriodChange = (p: Period) => {
    setActivePeriod(p);
    if (!PERIOD_SECTIONS[p].includes(active)) setActive("guru");
    afterSwitch();
  };

  const resolvedData = STATIC_DATA[activePeriod] ?? data;
  const meta = SECTION_BY_KEY[active];

  const section = {
    guru: <GuruSection data={resolvedData.guru} period={activePeriod} />,
    kepsek: <KepsekSection data={resolvedData.kepsek} />,
    ortu: <OrtuSection data={resolvedData.ortu} />,
    siswa: <SiswaSection data={resolvedData.siswa} />,
  }[active];

  const navProps = {
    active,
    onChange: handleSectionChange,
    activePeriod,
    onPeriodChange: handlePeriodChange,
  };

  return (
    <div className="flex h-dvh">
      {/* Desktop sidebar — hidden below md */}
      <Sidebar {...navProps} />

      {/* Right column: mobile top bar + main content */}
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileNav {...navProps} />

        <main ref={mainRef} id="main-content" tabIndex={-1} className="flex-1 overflow-y-auto focus:outline-none">
          <div
            key={`${activePeriod}-${active}`}
            className={`tone-${meta.tone} mx-auto w-full max-w-6xl px-4 pb-14 pt-6 sm:px-6 md:px-8 md:pt-10 lg:px-10 ${
              hasSwitched ? "anim-enter" : ""
            }`}
          >
            <PageHeader meta={meta} isArchive={activePeriod in STATIC_DATA} />
            <div className="mt-6 md:mt-8">{section}</div>
          </div>
        </main>
      </div>
    </div>
  );
}
