"use client";

interface Props {
  data: { province: string; count: number }[];
}

export default function ProvinceTable({ data }: Props) {
  return (
    <div className="bg-white border rounded-xl shadow-sm p-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <p className="text-sm font-semibold text-blue-900">
            Students by Province & City
          </p>
          <p className="text-xs text-gray-500">Geographic distribution across Cambodia</p>
        </div>
        <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
          {data?.length || 0} Provinces / Cities
        </span>
      </div>

      <div className="max-h-[420px] overflow-y-auto divide-y pr-1">
        {data && data.length > 0 ? (
          data.map((item, index) => (
            <div
              key={`${item.province}-${index}`}
              className="flex justify-between py-3 px-2 rounded-lg hover:bg-gray-50 transition"
            >
              <span className="text-sm text-gray-700">{item.province}</span>
              <span className="text-sm font-semibold text-blue-900">{item.count}</span>
            </div>
          ))
        ) : (
          <div className="py-8 text-center text-sm text-gray-500">
            No province data available
          </div>
        )}
      </div>
    </div>
  );
}
