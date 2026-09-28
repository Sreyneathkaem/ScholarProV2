"use client";

import { useHeader } from "@/components/header/header-context";
import React, { useEffect, useState } from "react";
import { apiClient } from "@/api/api";
import { API_ENDPOINTS } from "@/api/endpoint";

import StatsCard from "@/components/dashboard/stats-card";
import GenderChart from "@/components/dashboard/gender-chart";
import PopularMajorsChart from "@/components/dashboard/popular-majors-chart";
import ProvinceTable from "@/components/dashboard/province-table";

import { FileText, Users, TrendingUp, UserCheck } from "lucide-react";
import BatchSelectorApi from "@/components/batch-selector-api";
import { PageHero } from "@/components/common/page-hero";

export default function DashboardPage() {
  const { setTitle } = useHeader();

  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [charts, setCharts] = useState<DashboardCharts | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedBatchId, setSelectedBatchId] = useState<string>("");

  useEffect(() => {
    setTitle("Dashboard Overview");
  }, [setTitle]);

  useEffect(() => {
    let mounted = true;

    const loadDashboard = async () => {
      setLoading(true);
      try {
        const res = await apiClient.get<DashboardResponse>(
          API_ENDPOINTS.DASHBOARD as string,
          {
            params: selectedBatchId ? { batchId: selectedBatchId } : undefined,
          },
        );

        if (!mounted) return;

        setOverview(res.data.data.overview);
        setCharts(res.data.data.charts);
      } catch (error) {
        console.error("Failed to load dashboard", error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadDashboard();
    return () => {
      mounted = false;
    };
  }, [selectedBatchId]);

  if (loading || !overview || !charts) {
    return (
      <div className="p-12 flex items-center justify-center min-h-[350px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
          <p className="text-xs text-muted-foreground">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 min-w-0 max-w-full">
      <PageHero
        title="Overview & Performance"
        subtitle="Real-time candidate metrics, admissions funnel, and demographic distribution"
        actions={
          <div className="w-48 shrink-0">
            <BatchSelectorApi
              value={selectedBatchId}
              onValueChange={setSelectedBatchId}
            />
          </div>
        }
      />

      {/* TOP STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="New Applications"
          value={overview.newApplications}
          trend="—"
          icon={<FileText size={18} />}
        />

        <StatsCard
          title="Total Applicants"
          value={overview.totalApplicants}
          trend="—"
          icon={<Users size={18} />}
        />

        <StatsCard
          title="Female Ratio (%)"
          value={Number(overview.femaleRatio)}
          trend="—"
          icon={<TrendingUp size={18} />}
        />

        <StatsCard
          title="Acceptance Rate (%)"
          value={Number(overview.acceptanceRate)}
          trend="—"
          icon={<UserCheck size={18} />}
        />
      </div>

      {/* CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GenderChart
          data={{
            female: overview.genderDistribution
              .filter((g) => g.gender.toLowerCase().startsWith("f"))
              .reduce((s, g) => s + g.count, 0),
            male: overview.genderDistribution
              .filter((g) => g.gender.toLowerCase().startsWith("m"))
              .reduce((s, g) => s + g.count, 0),
            total: overview.genderDistribution.reduce((s, g) => s + g.count, 0),
          }}
        />
        <PopularMajorsChart data={charts.popularMajors} />
      </div>

      {/* PROVINCE TABLE */}
      <ProvinceTable data={charts.studentsByProvince} />
    </div>
  );
}
