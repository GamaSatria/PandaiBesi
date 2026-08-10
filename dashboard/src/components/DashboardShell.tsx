"use client";

import { useState } from "react";
import type { DashboardData } from "@/lib/types";
import {
  Sidebar,
  MobileTabs,
  GuruSection,
  KepsekSection,
  OrtuSection,
  SiswaSection,
} from "./Sidebar";

type SectionKey = "guru" | "kepsek" | "ortu" | "siswa";

export function DashboardShell({ data }: { data: DashboardData }) {
  const [active, setActive] = useState<SectionKey>("guru");

  const section = {
    guru: <GuruSection data={data.guru} />,
    kepsek: <KepsekSection data={data.kepsek} />,
    ortu: <OrtuSection data={data.ortu} />,
    siswa: <SiswaSection data={data.siswa} />,
  }[active];

  return (
    <div className="flex min-h-screen bg-transparent">
      {/* Desktop sidebar — hidden below md */}
      <Sidebar active={active} onChange={setActive} />

      {/* Right column: mobile tabs + main content */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Mobile/tablet top nav — hidden at md+ */}
        <MobileTabs active={active} onChange={setActive} />

        <main className="flex-1 overflow-y-auto px-3 py-4 sm:px-5 sm:py-6 md:px-6 md:py-8 lg:px-10 lg:py-10">
          <div className="mx-auto max-w-7xl">{section}</div>
        </main>
      </div>
    </div>
  );
}