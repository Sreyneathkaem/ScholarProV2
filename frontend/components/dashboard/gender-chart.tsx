"use client";

import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  type TooltipItem,
  type ChartOptions, // 1. Import ChartOptions
} from "chart.js";
import { Doughnut } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend);

interface Props {
  data: {
    female: number;
    male: number;
    total: number;
  };
}

export default function GenderChart({ data }: Props) {
  const chartData = {
    labels: ["Female", "Male"],
    datasets: [
      {
        data: [data.female, data.male],
        backgroundColor: ["#0F386C", "#5a9be6"],
        borderWidth: 0,
        hoverOffset: 6,
      },
    ],
  };

  // 2. Explicitly type the options object
  const options: ChartOptions<"doughnut"> = {
    cutout: "72%",
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: TooltipItem<"doughnut">) => {
            const value = ctx.raw || 0;
            return `${ctx.label}: ${value}`;
          },
        },
        backgroundColor: "rgba(0, 0, 0, 0.75)",
        titleColor: "#ffffff",
        bodyColor: "#ffffff",
        borderColor: "rgba(255, 255, 255, 0.1)",
        borderWidth: 1,
        bodyFont: { size: 12 },
        displayColors: false,
      },
    },
  };

  // 3. Helper to avoid NaN if total is 0
  const calculatePercentage = (value: number) => {
    if (data.total === 0) return "0.00";
    return ((value / data.total) * 100).toFixed(2);
  };

  return (
    <div className="bg-card border border-border/80 rounded-lg shadow-[0_1px_2px_0_rgba(0,0,0,0.03)] p-6 h-[360px] flex flex-col">
      <p className="text-sm font-semibold text-foreground">Total Applicants</p>
      <p className="text-xs text-muted-foreground mb-4">
        Gender distribution – Ratio analysis
      </p>

      <div className="flex items-center gap-6 h-full">
        {/* Smaller Chart */}
        <div className="w-40 h-40 relative">
          <Doughnut data={chartData} options={options} />
        </div>

        {/* Side Stats */}
        <div className="text-sm space-y-3">
          <div>
            <p className="text-xs text-muted-foreground">Total Students</p>
            <p className="text-2xl font-semibold text-foreground">{data.total.toLocaleString()}</p>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#0F386C]" />
            <p className="text-xs text-muted-foreground">
              Female: <span className="font-medium text-foreground">{calculatePercentage(data.female)}%</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#5a9be6]" />
            <p className="text-xs text-muted-foreground">
              Male: <span className="font-medium text-foreground">{calculatePercentage(data.male)}%</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
