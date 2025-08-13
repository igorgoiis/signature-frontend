
"use client";

import { useState, useEffect } from "react";
import { ApiService } from "@/lib/api";
import { DashboardStats, Document } from "@/lib/types";

export function useDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalDocuments: 0,
    pendingDocuments: 0,
    approvedDocuments: 0,
    activeUsers: 0,
  });
  const [recentDocuments, setRecentDocuments] = useState<Document[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch stats
      const statsResponse = await ApiService.get("/dashboard/stats");
      setStats(statsResponse);

      // Fetch recent documents
      const docsResponse = await ApiService.get("/documents?limit=5&sort=createdAt:desc");
      
      // Handle different response structures from backend
      let documents = [];
      if (Array.isArray(docsResponse)) {
        // Direct array response
        documents = docsResponse;
      } else if (docsResponse && Array.isArray(docsResponse.data)) {
        // Response with data property containing array
        documents = docsResponse.data;
      } else if (docsResponse && Array.isArray(docsResponse.documents)) {
        // Response with documents property containing array
        documents = docsResponse.documents;
      } else {
        // Fallback - log the structure for debugging
        console.log("Unexpected documents response structure:", docsResponse);
        documents = [];
      }
      
      setRecentDocuments(documents);

      // Fetch recent activity
      const activityResponse = await ApiService.get("/dashboard/recent-activity");
      setRecentActivity(activityResponse);

    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError("Erro ao carregar dados do dashboard");
      
      // Set default values on error
      setStats({
        totalDocuments: 0,
        pendingDocuments: 0,
        approvedDocuments: 0,
        activeUsers: 0,
      });
      setRecentDocuments([]);
      setRecentActivity([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const refreshData = () => {
    fetchDashboardData();
  };

  return {
    stats,
    recentDocuments,
    recentActivity,
    loading,
    error,
    refreshData,
  };
}
