"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge"; // Badge não é usado neste componente, pode ser removido se não for necessário
import { Activity, UserCheck, Clock, FileX2, FilePlus2, FileCheck2 } from "lucide-react";
// Importa o tipo RecentActivityItem da nova localização
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { RecentActivityActions, RecentActivityItem } from "@/types/dashboard.type";

interface RecentActivityProps {
  activities: RecentActivityItem[]; // Tipo atualizado para RecentActivityItem[]
  loading?: boolean;
}

export function RecentActivity({ activities, loading = false }: RecentActivityProps) {
  // A função getActivityIcon agora verifica a descrição para mapear o ícone
  const getActivityIcon = (action: RecentActivityActions) => {
    if (action === RecentActivityActions.DOCUMENT_CREATED) return FilePlus2;
    if (action === RecentActivityActions.CREATE_SIGNATURE) return UserCheck;
    if (action === RecentActivityActions.SIGN_DOCUMENT) return FileCheck2;
    if (action === RecentActivityActions.REJECT_DOCUMENT) return FileX2;
    return Clock; // Ícone padrão
  };

  // A função getActivityText agora apenas retorna a descrição, pois ela já deve ser legível
  // Se a descrição ainda for um código (ex: "DOCUMENT_UPLOADED"), você precisará manter a lógica de mapeamento.
  // Assumindo que 'description' já é o texto amigável.
  const getActivityText = (action: RecentActivityActions) => {
    if (action === RecentActivityActions.DOCUMENT_CREATED) return 'Documento criado';
    if (action === RecentActivityActions.CREATE_SIGNATURE) return 'Usuário assinou o documento';
    if (action === RecentActivityActions.SIGN_DOCUMENT) return 'Documento assinado';
    if (action === RecentActivityActions.REJECT_DOCUMENT) return 'Documento rejeitado';
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
              // Usa activity.description para determinar o ícone
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
                      {getActivityText(activity.action)}{" "}
                      {/* action agora é description */}
                    </p>
                    <p className="text-xs text-gray-500">
                      {/* performedAt agora é timestamp */}
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
