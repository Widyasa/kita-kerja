"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatRupiah } from "@/lib/mock/utils";
import type { TitikBulan } from "@/lib/data/riwayat";

export type { TitikBulan };

/**
 * Grafik penghasilan per bulan — batang sederhana, warna token biru-600,
 * label rupiah, responsif. Komponen client karena Recharts.
 */
export function GrafikPenghasilan({ data }: { data: TitikBulan[] }) {
  return (
    <div
      role="img"
      aria-label={`Grafik batang penghasilan per bulan. ${data
        .map((d) => `${d.bulan}: ${formatRupiah(d.total)}`)
        .join(". ")}`}
      className="h-64 w-full"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--tanah-200)"
            vertical={false}
          />
          <XAxis
            dataKey="bulan"
            tick={{ fill: "var(--tanah-600)", fontSize: 15 }}
            tickLine={false}
            axisLine={{ stroke: "var(--tanah-300)" }}
          />
          <YAxis
            width={64}
            tick={{ fill: "var(--tanah-600)", fontSize: 13 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) =>
              v >= 1000 ? `Rp${Math.round(v / 1000)} rb` : `Rp${v}`
            }
          />
          <Tooltip
            cursor={{ fill: "var(--tanah-100)" }}
            formatter={(value) => [formatRupiah(Number(value)), "Penghasilan"]}
            contentStyle={{
              backgroundColor: "var(--tanah-0)",
              border: "1px solid var(--tanah-200)",
              borderRadius: "12px",
              fontSize: 15,
            }}
          />
          <Bar
            dataKey="total"
            fill="var(--biru-600)"
            radius={[8, 8, 0, 0]}
            maxBarSize={48}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
