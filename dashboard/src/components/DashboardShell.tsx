"use client";

import { useState } from "react";
import type { DashboardData, Period, SectionKey } from "@/lib/types";
import { PERIOD_SECTIONS } from "@/lib/types";
import {
  Sidebar,
  MobileTabs,
  GuruSection,
  KepsekSection,
  OrtuSection,
  SiswaSection,
} from "./Sidebar";
import { DATA_2025_S1 } from "@/lib/data-2025-s1";
import { DATA_2025_S2 } from "@/lib/data-2025-s2";

const PERIOD_DATA: Record<Period, DashboardData | null> = {
  "2026-s1": null, // filled from server prop
  "2025-s2": DATA_2025_S2,
  "2025-s1": DATA_2025_S1,
};

export function DashboardShell({ data }: { data: DashboardData }) {
  const [active, setActive] = useState<SectionKey>("guru");
  const [activePeriod, setActivePeriod] = useState<Period>("2026-s1");

  const handlePeriodChange = (p: Period) => {
    setActivePeriod(p);
    if (!PERIOD_SECTIONS[p].includes(active)) setActive("guru");
  };

  const resolvedData = activePeriod === "2026-s1" ? data : (PERIOD_DATA[activePeriod] ?? data);

  const section = {
    guru: <GuruSection data={resolvedData.guru} period={activePeriod} />,
    kepsek: <KepsekSection data={resolvedData.kepsek} />,
    ortu: <OrtuSection data={resolvedData.ortu} />,
    siswa: <SiswaSection data={resolvedData.siswa} />,
  }[active];

  return (
    <div className="flex min-h-screen bg-transparent">
      {/* Desktop sidebar — hidden below md */}
      <Sidebar
        active={active}
        onChange={setActive}
        activePeriod={activePeriod}
        onPeriodChange={handlePeriodChange}
      />

      {/* Right column: mobile tabs + main content */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Mobile/tablet top nav — hidden at md+ */}
        <MobileTabs
          active={active}
          onChange={setActive}
          activePeriod={activePeriod}
          onPeriodChange={handlePeriodChange}
        />

        <main className="flex-1 overflow-y-auto px-3 py-4 sm:px-5 sm:py-6 md:px-6 md:py-8 lg:px-10 lg:py-10">
          <div key={`${activePeriod}-${active}`} className="mx-auto max-w-7xl anim-fade-in">
            {section}
          </div>
        </main>
      </div>
    </div>
  );
}