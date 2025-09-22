"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Upload, Plus } from "lucide-react";

// Componentes de dashboard que recebem props
import { StatsCards } from "@/components/dashboard/stats-cards";
import { RecentDocuments } from "@/components/dashboard/recent-documents";
import { RecentActivity } from "@/components/dashboard/recent-activity";

import { Document } from "@/types/document.type";
import { DashboardData } from "@/types/dashboard.type";

// Extrai os tipos específicos para as props
type DashboardStats = DashboardData['stats'];
type RecentDocument = DashboardData['recentDocuments'][0];
type RecentActivityItem = DashboardData['recentActivity'][0];

interface DashboardMainContentProps {
  stats: DashboardStats;
  recentDocuments: Document[];
  recentActivity: RecentActivityItem[];
  loading: boolean;
  error: string | null;
  userRole: string | undefined;
}

export function DashboardMainContent({
  stats,
  recentDocuments,
  recentActivity,
  loading,
  error,
  userRole,
}: DashboardMainContentProps) {
  return (
    <div className="space-y-8">
      {/* Alerta de Erro */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 rounded-lg p-4"
        >
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Erro ao carregar dados
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Cartões de Estatísticas */}
      <StatsCards stats={stats} loading={loading} />

      {/* Documentos Recentes e Atividade Recente */}
      <div className="grid gap-6 md:grid-cols-2">
        <RecentDocuments documents={recentDocuments} loading={loading} />
        <RecentActivity activities={recentActivity} loading={loading} />
      </div>

      {/* Ações Rápidas */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="bg-white rounded-lg border p-6"
      >
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Ações Rápidas
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Button asChild variant="outline" className="h-auto p-4">
            <Link href="/upload" className="flex flex-col items-center gap-2">
              <Upload className="h-6 w-6 text-blue-600" />
              <span>Enviar Documento</span>
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-auto p-4">
            <Link href="/documentos" className="flex flex-col items-center gap-2">
              <Plus className="h-6 w-6 text-green-600" />
              <span>Ver Documentos</span>
            </Link>
          </Button>
          {/* Renderização condicional para admin */}
          {userRole === "admin" && (
            <>
              <Button asChild variant="outline" className="h-auto p-4">
                <Link href="/usuarios" className="flex flex-col items-center gap-2">
                  <Plus className="h-6 w-6 text-purple-600" />
                  <span>Gerenciar Usuários</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-auto p-4">
                <Link href="/auditoria" className="flex flex-col items-center gap-2">
                  <Plus className="h-6 w-6 text-orange-600" />
                  <span>Ver Auditoria</span>
                </Link>
              </Button>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}