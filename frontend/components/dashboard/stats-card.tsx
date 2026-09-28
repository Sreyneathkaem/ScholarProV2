"use client";

interface StatsCardProps {
  icon: React.ReactNode;
  title: string;
  value: number;
  trend: string;
}

export default function StatsCard({ icon, title, value }: StatsCardProps) {
  return (
    <div className="p-5 bg-card rounded-lg border border-border/80 shadow-[0_1px_2px_0_rgba(0,0,0,0.03)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.04)] transition-all duration-200 flex items-center justify-between gap-4">
      <div className="flex-1 min-w-0">
        <p className="text-xs font-normal text-muted-foreground mb-1 truncate">{title}</p>
        <p className="text-2xl font-semibold text-foreground tracking-tight">{value.toLocaleString()}</p>
      </div>

      <div className="shrink-0 p-2.5 rounded-[6px] bg-[#edf4fc] text-[#0F386C] dark:bg-[#0f2238] dark:text-[#5a9be6] flex items-center justify-center">
        {icon}
      </div>
    </div>
  );
}
