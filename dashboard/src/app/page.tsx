import { loadDashboardData } from "@/lib/data";
import { DashboardShell } from "@/components/DashboardShell";

// ISR: halaman disajikan statis (instan) dan diperbarui di belakang layar paling
// cepat tiap 60 detik — respons Google Form baru muncul paling lambat ±1 menit.
// Kalau pembaruan gagal, data terakhir yang berhasil tetap ditampilkan.
export const revalidate = 60;

export default async function Page() {
  const data = await loadDashboardData();
  return <DashboardShell data={data} />;
}
