import { Suspense } from "react";
import { loadDashboardData } from "@/lib/data";
import { DashboardShell } from "@/components/DashboardShell";

export const revalidate = 0; // pull fresh on each request; PRD: sinkron saat refresh

export default async function Page() {
  const data = await loadDashboardData();
  return (
    <Suspense fallback={<div className="p-6 text-sm text-slate-500">Memuat data…</div>}>
      <DashboardShell data={data} />
    </Suspense>
  );
}