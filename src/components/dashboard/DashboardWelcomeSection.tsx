"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Plus, RefreshCw } from "lucide-react";
import Link from "next/link";

interface DashboardWelcomeSectionProps {
  userRole: string | undefined;
  onRefresh: () => void;
  isLoading: boolean;
}

export function DashboardWelcomeSection({ userRole, onRefresh, isLoading }: DashboardWelcomeSectionProps) {
  const getRoleDisplay = (role?: string) => {
    return role === "admin" ? "Administrador" : "Usuário";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 text-white"
    >
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold mb-1">
            Bem-vindo, {getRoleDisplay(userRole)}!
          </h1>
          <p className="text-blue-100">
            Gerencie seus documentos e acompanhe o status das assinaturas
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={onRefresh}
            variant="secondary"
            size="sm"
            disabled={isLoading}
            className="bg-white/20 text-white hover:bg-white/30 border-0"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
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
  );
}