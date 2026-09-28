"use client";

interface Props {
  data: { province: string; count: number }[];
}

export default function ProvinceTable({ data }: Props) {
  return (
    <div className="bg-card border border-border/80 rounded-lg shadow-[0_1px_2px_0_rgba(0,0,0,0.03)] p-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <p className="text-sm font-semibold text-foreground">
            Students by Province & City
          </p>
          <p className="text-xs text-muted-foreground">Geographic distribution across Cambodia</p>
        </div>
        <span className="text-xs font-normal text-[#0F386C] bg-[#edf4fc] border border-[#b8d4f6] dark:bg-[#0f2238] dark:text-[#5a9be6] dark:border-[#1e3f66] px-2 py-0.5 rounded-[4px]">
          {data?.length || 0} Provinces / Cities
        </span>
      </div>

      <div className="max-h-[420px] overflow-y-auto divide-y divide-border/60 pr-1">
        {data && data.length > 0 ? (
          data.map((item, index) => (
            <div
              key={`${item.province}-${index}`}
              className="flex justify-between items-center py-2.5 px-3 rounded-[4px] hover:bg-muted/60 transition-colors"
            >
              <span className="text-sm text-foreground/90 font-normal">{item.province}</span>
              <span className="text-sm font-semibold text-primary">{item.count}</span>
            </div>
          ))
        ) : (
          <div className="py-8 text-center text-sm text-muted-foreground">
            No province data available
          </div>
        )}
      </div>
    </div>
  );
}
