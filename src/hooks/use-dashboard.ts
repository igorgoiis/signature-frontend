"use client";

import { useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useToast } from "@/hooks/use-toast";
import {
  dashboardService 
} from "@/lib/data/dashboard";
import { Document } from "@/types/document.type";
import { documentService } from "@/lib/api/services/documentService";
import { DashboardData, DashboardStats, RecentActivityItem } from "@/types/dashboard.type";

interface UseDashboardProps {
  initialData: DashboardData;
}

interface UseDashboardResult {
  stats: DashboardStats;
  recentDocuments: Document[];
  recentActivity: RecentActivityItem[];
  loading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
}

export function useDashboard({ initialData }: UseDashboardProps): UseDashboardResult {
  const { data: session } = useSession();
  const { toast } = useToast();

  const [stats, setStats] = useState<DashboardStats>(initialData.stats);
  const [recentDocuments, setRecentDocuments] = useState<Document[]>(initialData.recentDocuments);
  const [recentActivity, setRecentActivity] = useState<RecentActivityItem[]>(initialData.recentActivity);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshData = useCallback(async () => {
    if (!session?.accessToken) {
      setError("Sessão não autenticada para atualizar dados.");
      toast({
        title: "Erro de Autenticação",
        description: "Sua sessão expirou ou não está ativa. Por favor, faça login novamente.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Usa o dashboardService para buscar os dados
      const { success: successStats, data: stats } = await dashboardService.getStats({
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
        },
      });
  
      const { success: successRecentActivity, data: recentActivity } = await dashboardService.getRecentActivity({
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
        },
      });
  
      const { success: successRecentDocuments, data: recentDocuments } = await documentService.getDocuments(
        { limit: 5, sort: 'createdAt:desc' },
        { headers: { 'Authorization': `Bearer ${session.accessToken}` } }
      );

      if (successStats && successRecentActivity && successRecentDocuments && stats && recentActivity && recentDocuments) {
        setStats(stats);
        setRecentDocuments(recentDocuments);
        setRecentActivity(recentActivity);
        toast({
          title: "Dados Atualizados",
          description: "O dashboard foi atualizado com sucesso.",
          // @ts-ignore - Remova se 'success' não for um variant válido
          variant: "success",
        });
      } else {
        // Trata o erro retornado pelo ApiResponse
        const errorMessage = "Não foi possível atualizar os dados do dashboard.";
        setError(errorMessage);
        toast({
          title: "Erro ao Atualizar",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Erro ao atualizar dados do dashboard (cliente):", err);
      setError((err as Error).message || "Ocorreu um erro inesperado ao atualizar o dashboard.");
      toast({
        title: "Erro Inesperado",
        description: (err as Error).message || "Verifique sua conexão e tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [session, toast]);

  return {
    stats,
    recentDocuments,
    recentActivity,
    loading,
    error,
    refreshData,
  };
}