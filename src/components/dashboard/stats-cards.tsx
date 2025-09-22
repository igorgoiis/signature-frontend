"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Clock, CheckCircle, Users } from "lucide-react";
// Importa o tipo DashboardStats da nova localização
import { AnimatedNumber } from "../common/AnimatedNumber";
import { DashboardStats } from "@/types/dashboard.type";

interface StatsCardsProps {
  stats: DashboardStats;
  loading?: boolean;
}

export function StatsCards({ stats, loading = false }: StatsCardsProps) {
  // Mapeia as propriedades antigas para as novas conforme DashboardStats
  const cards = [
    {
      title: "Total de Documentos",
      value: stats?.totalDocuments ?? 0,
      description: "Total de documentos no sistema",
      icon: FileText,
      color: "bg-blue-500",
    },
    {
      title: "Pendentes",
      value: stats?.pendingSignatures ?? 0,
      description: "Aguardando assinatura",
      icon: Clock,
      color: "bg-yellow-500",
    },
    {
      title: "Concluídos",
      value: stats?.completedSignatures ?? 0,
      description: "Documentos com assinatura concluída",
      icon: CheckCircle,
      color: "bg-green-500",
    },
    {
      title: "Total de Usuários",
      value: stats?.totalUsers ?? 0,
      description: "Usuários registrados no sistema",
      icon: Users,
      color: "bg-purple-500",
    },
  ];

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 bg-gray-200 rounded w-24"></div>
              <div className="h-4 w-4 bg-gray-200 rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-16 mb-1"></div>
              <div className="h-3 bg-gray-200 rounded w-32"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Card className="relative overflow-hidden transition-all duration-200 hover:shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {card.title}
                </CardTitle>
                <div
                  className={`p-2 rounded-md ${card.color.replace(
                    "bg-",
                    "bg-opacity-10 bg-"
                  )}`}
                >
                  <Icon
                    className={`h-4 w-4 ${card.color.replace("bg-", "text-")}`}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  <AnimatedNumber value={card.value} />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {card.description}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}