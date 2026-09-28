"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
  type TooltipItem,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

interface Props {
  data: {
    major: string;
    count: number;
  }[];
}

export default function PopularMajorsChart({ data }: Props) {
  const chartData = {
    labels: data.map((d) => d.major),
    datasets: [
      {
        label: "",
        data: data.map((d) => d.count),
        backgroundColor: "#0F386C",
        borderRadius: 4,
        barThickness: 32,
      },
    ],
  };

  const options = {
    maintainAspectRatio: false as const,
    layout: {
      padding: {
        bottom: 20,
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: TooltipItem<"bar">) => `${ctx.parsed.y} students`,
        },
        backgroundColor: "rgba(0, 0, 0, 0.75)",
        borderColor: "rgba(255, 255, 255, 0.1)",
        borderWidth: 1,
        bodyFont: { size: 12 },
      },
    },
    scales: {
      x: {
        ticks: {
          color: "#8c8c8c",
          maxRotation: 45,
          minRotation: 45,
          font: { size: 11 },
        },
        grid: { display: false },
      },
      y: {
        ticks: {
          color: "#8c8c8c",
          font: { size: 11 },
        },
        grid: { color: "rgba(0, 0, 0, 0.06)" },
      },
    },
  };

  return (
    <div className="bg-card border border-border/80 rounded-lg shadow-[0_1px_2px_0_rgba(0,0,0,0.03)] p-6 h-[360px] flex flex-col">
      <p className="text-sm font-semibold text-foreground">Most Popular Majors</p>
      <p className="text-xs text-muted-foreground mb-4">Distribution by academic program</p>

      {/* Chart wrapper (ensures space for labels) */}
      <div className="flex-1 min-h-0">
        <Bar data={chartData} options={options} />
      </div>
    </div>
  );
}
