
"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, FileText, UserCheck, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface RecentActivityProps {
  activities: any[];
  loading?: boolean;
}

export function RecentActivity({ activities, loading = false }: RecentActivityProps) {
  const getActivityIcon = (action: string) => {
    switch (action) {
      case "DOCUMENT_UPLOADED":
        return FileText;
      case "DOCUMENT_SIGNED":
        return UserCheck;
      case "DOCUMENT_REVIEWED":
        return Activity;
      default:
        return Clock;
    }
  };

  const getActivityText = (action: string) => {
    switch (action) {
      case "DOCUMENT_UPLOADED":
        return "Documento enviado";
      case "DOCUMENT_SIGNED":
        return "Documento assinado";
      case "DOCUMENT_REVIEWED":
        return "Documento revisado";
      default:
        return action;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Atividade Recente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-start gap-3 animate-pulse">
                <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-40 mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-24"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Atividade Recente
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activities?.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            <Activity className="h-12 w-12 mx-auto mb-2 opacity-20" />
            <p>Nenhuma atividade recente</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities?.map((activity, index) => {
              const Icon = getActivityIcon(activity.action);
              return (
                <motion.div
                  key={activity.id || index}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="flex items-start gap-3"
                >
                  <div className="p-2 bg-blue-100 rounded-full">
                    <Icon className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {getActivityText(activity.action)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {activity.performedAt
                        ? formatDistanceToNow(new Date(activity.performedAt), {
                            addSuffix: true,
                            locale: ptBR,
                          })
                        : "Há alguns minutos"}
                    </p>
                  </div>
                </motion.div>
              );
            })}
            
            {/* Link to view complete audit */}
            <div className="pt-2 border-t">
              <button className="text-sm text-blue-600 hover:underline">
                Ver auditoria completa
              </button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
