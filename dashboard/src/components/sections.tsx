"use client";

import type { GuruData, KepsekData, OrtuData, SiswaData, Period } from "@/lib/types";
import { WordCloud, countUniqueWords } from "@/components/WordCloud";
import { BarList, Card, ColumnChart, DonutChart, EmptyState, RadarChart, Stat } from "./charts";

// --- Helpers ---
/** Item dengan nilai terbesar (item pertama menang bila seri). */
function maxBy<T>(rows: T[], value: (r: T) => number): T | undefined {
  return rows.reduce<T | undefined>((best, r) => (best === undefined || value(r) > value(best) ? r : best), undefined);
}

/** Rata-rata nilai persen, dibulatkan, sebagai teks "X%". */
function avgPercent(values: number[]): string {
  return `${Math.round(values.reduce((s, v) => s + v, 0) / Math.max(1, values.length))}%`;
}

/** Semua kelas dengan jumlah guru terbanyak (digabung " & " bila seri). */
function mostKelas(rows: GuruData["sebaranKelas"]): string {
  if (!rows.length) return "-";
  const max = Math.max(...rows.map((r) => r.jumlah));
  return rows.filter((r) => r.jumlah === max).map((r) => r.kelas).join(" & ");
}

function truncateWords(text: string, words: number): string {
  // "/" juga dianggap pemisah kata → "senang/semangat" jadi 2 kata terpisah
  const parts = text.trim().split(/\s+|\//);
  if (parts.length <= words) return text;
  return parts.slice(0, words).join(" ") + "...";
}

const percentItems = (rows: { aspek: string; aspekFull?: string; nilai: number }[]) =>
  rows.map((d) => ({ label: d.aspekFull ?? d.aspek, value: d.nilai, display: `${d.nilai}%` }));

// --- Layout bits ---
function StatGrid({ children, columns = 4 }: Readonly<{ children: React.ReactNode; columns?: 3 | 4 }>) {
  return (
    <div className={`grid grid-cols-2 gap-3 sm:gap-4 ${columns === 4 ? "lg:grid-cols-4" : "lg:grid-cols-3"}`}>
      {children}
    </div>
  );
}

function Pair({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-2">{children}</div>;
}

function Stack({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className="flex flex-col gap-4 sm:gap-5">{children}</div>;
}

function NumberedList({ items }: Readonly<{ items: string[] }>) {
  if (!items.length) return <EmptyState />;
  return (
    <ol className="flex flex-col divide-y divide-line">
      {items.map((k, i) => (
        <li key={i} className="flex items-start gap-3.5 py-3 first:pt-0 last:pb-0">
          <span
            aria-hidden
            className="mt-px flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full bg-hover px-1.5 text-[11.5px] font-extrabold tabular-nums text-muted"
          >
            {i + 1}
          </span>
          <span className="text-sm leading-relaxed text-pretty text-body">{k}</span>
        </li>
      ))}
    </ol>
  );
}

function Testimonials({ items }: Readonly<{ items: OrtuData["perubahanPositif"] }>) {
  if (!items.length) return <EmptyState text="Belum ada testimoni." />;
  return (
    <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((p, i) => (
        <li key={i}>
          <figure className="flex h-full flex-col gap-3 rounded-2xl bg-surface-muted p-5">
            <blockquote className="flex-1 text-sm leading-relaxed text-pretty text-body">&ldquo;{p.cerita}&rdquo;</blockquote>
            <figcaption className="text-xs font-semibold text-muted">{p.judul}</figcaption>
          </figure>
        </li>
      ))}
    </ul>
  );
}

// --- Sections ---
export function GuruSection({ data, period }: Readonly<{ data: GuruData; period: Period }>) {
  // Periode 2025 memakai instrumen Guru versi lama (regulasi, skill, kemampuan PDBK).
  const is2025 = period === "2025-s1" || period === "2025-s2";
  const top2025 = maxBy(data.skillYangDidapat ?? [], (d) => d.nilai);
  const topSkill = is2025
    ? (top2025?.aspekFull ?? top2025?.aspek)
    : maxBy(data.capaianKeterampilan, (d) => d.jumlah)?.skill;
  const topKemampuan = maxBy(data.chartTower ?? [], (d) => d.value);
  const kelasItems = data.sebaranKelas.map((d) => ({ label: d.kelas, value: d.jumlah }));
  return (
    <Stack>
      <StatGrid>
        <Stat label="Total Responden" value={data.totalResponden} hint="Guru berpartisipasi" />
        <Stat
          label="Kelas Terbanyak"
          value={mostKelas(data.sebaranKelas)}
          hint="Guru paling banyak mengajar di sini"
        />
        <Stat
          label="Skill Terbanyak"
          value={topSkill ?? "-"}
          hint={is2025 ? "Skill yang didapat setelah pendampingan" : "Keterampilan yang sering dikuasai"}
        />
        <Stat
          label={is2025 ? "Kemampuan Siswa/i" : "Total Kebutuhan"}
          value={
            is2025
              ? topKemampuan
                ? truncateWords(topKemampuan.nameFull ?? topKemampuan.name, 3)
                : "-"
              : data.kebutuhanPendampingan.length
          }
          hint={is2025 ? "Kemampuan terbaik yang dilakukan PDBK" : "Item pendampingan diminta"}
        />
      </StatGrid>
      {is2025 ? (
        // Instrumen 2025: kartu dengan tinggi serupa dipasangkan (donut + daftar
        // batang, lalu dua radar) agar tidak ada ruang kosong besar.
        <>
          <Pair>
            <Card title="Sebaran Guru per Kelas" subtitle="Jumlah responden per kelas yang diajar">
              <DonutChart items={kelasItems} label="Sebaran guru per kelas" unit="guru" />
            </Card>
            <Card title="Kemampuan Siswa/i" subtitle="Kemampuan yang dapat dilakukan PDBK">
              <BarList
                items={(data.chartTower ?? []).map((d) => ({ label: d.nameFull ?? d.name, value: d.value, display: `${d.value}%` }))}
                max={100}
                label="Kemampuan yang dapat dilakukan PDBK"
              />
            </Card>
          </Pair>
          <Pair>
            <Card title="Pemahaman Guru" subtitle="Sejauh mana pemahaman guru mengenai pendidikan inklusif">
              <RadarChart items={data.pemahamanInklusif ?? []} label="Pemahaman guru tentang regulasi pendidikan inklusif" />
            </Card>
            <Card title="Skill yang Didapat" subtitle="Skor keterampilan yang didapat guru setelah program PDBK">
              <RadarChart items={data.skillYangDidapat ?? []} label="Skill yang didapat guru" />
            </Card>
          </Pair>
        </>
      ) : (
        <>
          <Pair>
            <Card title="Sebaran Guru per Kelas" subtitle="Jumlah responden per kelas yang diajar">
              <ColumnChart items={kelasItems} label="Jumlah guru per kelas" />
            </Card>
            <Card title="Keterampilan Baru yang Dikuasai Peserta Didik" subtitle="Diurutkan dari yang paling banyak">
              <BarList
                items={data.capaianKeterampilan.map((d) => ({ label: d.skillFull ?? d.skill, value: d.jumlah }))}
                label="Keterampilan baru yang dikuasai"
              />
            </Card>
          </Pair>
          <Card title="Pendampingan yang Masih Dibutuhkan" subtitle="Ringkasan kebutuhan dari guru">
            <NumberedList items={data.kebutuhanPendampingan} />
          </Card>
        </>
      )}
    </Stack>
  );
}

export function KepsekSection({ data }: Readonly<{ data: KepsekData }>) {
  const totalSekolah = data.sebaranJenjang.reduce((s, d) => s + d.value, 0);
  return (
    <Stack>
      <StatGrid columns={3}>
        <Stat label="Total Responden" value={data.totalResponden} hint="Kepala sekolah" />
        <Stat label="Total Sekolah" value={totalSekolah} hint="Mewakili berbagai jenjang" />
        {/* Kartu ke-3 melebar penuh di layar 2 kolom (HP/tablet) agar tidak ada ruang kosong. */}
        <Stat
          label="Rata-rata Dampak"
          value={avgPercent(data.dampakProgram.map((d) => d.sesudah))}
          hint="Indeks komposit 5 aspek (sesudah)"
          className="col-span-2 lg:col-span-1"
        />
      </StatGrid>
      <Pair>
        <Card title="Sebaran per Jenjang" subtitle="Distribusi sekolah responden">
          <DonutChart
            items={data.sebaranJenjang.map((d) => ({ label: d.name, value: d.value }))}
            label="Sebaran sekolah per jenjang"
            unit="sekolah"
          />
        </Card>
        <Card title="Dampak Program" subtitle="Jumlah & persentase kepala sekolah yang merasakan tiap aspek">
          <BarList
            items={data.dampakProgram.map((d) => ({
              label: d.aspekFull ?? d.aspek,
              value: d.sesudah,
              display: `${d.sesudahCount} (${d.sesudah}%)`,
            }))}
            max={100}
            label="Dampak program per aspek"
          />
        </Card>
      </Pair>
      <Card title="Saran untuk Perbaikan Program" subtitle="Catatan dari kepala sekolah">
        <NumberedList items={data.saran} />
      </Card>
    </Stack>
  );
}

export function OrtuSection({ data }: Readonly<{ data: OrtuData }>) {
  const top = maxBy(data.capaianManfaat, (d) => d.nilai);
  return (
    <Stack>
      <StatGrid>
        <Stat
          label="Total Responden"
          value={data.totalResponden}
          hint="Orang tua berpartisipasi"
        />
        <Stat
          label="Rata-rata Manfaat"
          value={avgPercent(data.capaianManfaat.map((d) => d.nilai))}
          hint="Skor rata-rata"
        />
        <Stat label="Aspek Tertinggi" value={top ? `${top.nilai}%` : "-"} hint={top?.aspek ?? "-"} />
        <Stat
          label="Total Testimoni"
          value={data.perubahanPositif.length}
          hint="Cerita perubahan positif"
        />
      </StatGrid>
      <Card title="Manfaat Asesmen dari Perspektif Orang Tua" subtitle="Persentase orang tua yang merasakan tiap manfaat">
        <BarList items={percentItems(data.capaianManfaat)} max={100} label="Manfaat asesmen menurut orang tua" />
      </Card>
      <Card title="Perubahan Positif yang Dirasakan Orang Tua" subtitle="Testimoni kualitatif">
        <Testimonials items={data.perubahanPositif} />
      </Card>
    </Stack>
  );
}

export function SiswaSection({ data }: Readonly<{ data: SiswaData }>) {
  const top = maxBy(data.pengalamanBelajar, (d) => d.nilai);
  return (
    <Stack>
      <StatGrid>
        <Stat label="Total Responden" value={data.totalResponden} hint="Peserta didik" />
        <Stat
          label="Rata-rata Pengalaman"
          value={avgPercent(data.pengalamanBelajar.map((d) => d.nilai))}
          hint="Skor rata-rata"
        />
        <Stat label="Aspek Tertinggi" value={top ? `${top.nilai}%` : "-"} hint={top?.aspek ?? "-"} />
        <Stat
          label="Kata Unik"
          value={countUniqueWords(data.halDisukai)}
          hint="Kata unik yang muncul di word cloud"
        />
      </StatGrid>
      <Card title="Pengalaman Belajar setelah Asesmen" subtitle="Aspek yang paling dirasakan positif">
        <RadarChart items={data.pengalamanBelajar} label="Pengalaman belajar setelah asesmen" />
      </Card>
      <Card title="Hal yang Paling Disukai di Sekolah" subtitle="Kata-kata yang sering muncul">
        <WordCloud words={data.halDisukai} />
      </Card>
    </Stack>
  );
}
