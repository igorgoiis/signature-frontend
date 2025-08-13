
"use client";

import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { MainLayout } from "@/components/layout/main-layout";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { RecentDocuments } from "@/components/dashboard/recent-documents";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { Button } from "@/components/ui/button";
import { Plus, Upload, RefreshCw } from "lucide-react";
import { useDashboard } from "@/hooks/use-dashboard";
import Link from "next/link";

export default function DashboardPage() {
  const { data: session } = useSession();
  const { stats, recentDocuments, recentActivity, loading, error, refreshData } = useDashboard();

  const getRoleDisplay = (role?: string) => {
    return role === "admin" ? "Administrador" : "Usuário";
  };

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold mb-1">
                Bem-vindo, {getRoleDisplay(session?.user?.role)}!
              </h1>
              <p className="text-blue-100">
                Gerencie seus documentos e acompanhe o status das assinaturas
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={refreshData}
                variant="secondary"
                size="sm"
                disabled={loading}
                className="bg-white/20 text-white hover:bg-white/30 border-0"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                Atualizar
              </Button>
              <Button asChild className="bg-white text-blue-600 hover:bg-gray-100">
                <Link href="/upload">
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Upload
                </Link>
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Error Alert */}
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

        {/* Stats Cards */}
        <StatsCards stats={stats} loading={loading} />

        {/* Recent Documents and Activity */}
        <div className="grid gap-6 md:grid-cols-2">
          <RecentDocuments documents={recentDocuments} loading={loading} />
          <RecentActivity activities={recentActivity} loading={loading} />
        </div>

        {/* Quick Actions */}
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
            {session?.user?.role === "admin" && (
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
    </MainLayout>
  );
}
