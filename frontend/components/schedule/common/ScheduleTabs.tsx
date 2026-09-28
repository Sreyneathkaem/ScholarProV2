"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { GraduationCap, Users } from "lucide-react";

interface ScheduleTabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function ScheduleTabs({
  activeTab,
  setActiveTab,
}: ScheduleTabsProps) {
  const tabs = [
    { id: "exam", label: "Exam Schedule", icon: GraduationCap },
    { id: "interview", label: "Interview Schedule", icon: Users },
  ];

  return (
    <div className="flex items-center gap-1 bg-muted/70 p-1 rounded-[8px] border border-border/80 w-max shadow-inner">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-[6px] transition-all cursor-pointer",
              isActive
                ? "bg-card text-[#0F386C] dark:text-[#5a9be6] shadow-[0_1px_3px_rgba(0,0,0,0.08)] font-semibold"
                : "text-muted-foreground hover:text-foreground hover:bg-card/50",
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
