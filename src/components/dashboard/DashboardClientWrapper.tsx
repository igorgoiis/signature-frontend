"use client";

import { useDashboard } from "@/hooks/use-dashboard";
import { DashboardWelcomeSection } from "./DashboardWelcomeSection";
import { DashboardMainContent } from "./DashboardMainContent";
import { DashboardData } from "@/types/dashboard.type";

interface DashboardClientWrapperProps {
  initialData: DashboardData;
  userRole: string | undefined;
}

export function DashboardClientWrapper({ initialData, userRole }: DashboardClientWrapperProps) {
  const { stats, recentDocuments, recentActivity, loading, error, refreshData } = useDashboard({ initialData });

  return (
    <>
      <DashboardWelcomeSection
        userRole={userRole}
        onRefresh={refreshData}
        isLoading={loading}
      />
      <DashboardMainContent
        stats={stats}
        recentDocuments={recentDocuments}
        recentActivity={recentActivity}
        loading={loading}
        error={error}
        userRole={userRole}
      />
    </>
  );
}