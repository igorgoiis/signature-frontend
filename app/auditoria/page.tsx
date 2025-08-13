
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Shield, 
  Search, 
  Filter, 
  FileText,
  User,
  Clock,
  Activity,
  Loader2
} from "lucide-react";
import { AuditLog } from "@/lib/types";
import { ApiService } from "@/lib/api";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

export default function AuditoriaPage() {
  const { data: session } = useSession();
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    // Check if user is admin
    if (session?.user?.role !== "admin") {
      router.push("/dashboard");
      return;
    }
    fetchAuditLogs();
  }, [session, router, actionFilter]);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const filters: any = {};
      if (actionFilter !== "all") {
        filters.action = actionFilter;
      }
      const data = await ApiService.get(`/audit-logs${buildQueryString(filters)}`);
      setAuditLogs(data);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      toast({
        title: "Erro ao carregar logs de auditoria",
        description: "Não foi possível carregar os logs de auditoria.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const buildQueryString = (params: any) => {
    const query = new URLSearchParams(params).toString();
    return query ? `?${query}` : "";
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case "DOCUMENT_UPLOADED":
      case "DOCUMENT_CREATED":
        return FileText;
      case "DOCUMENT_SIGNED":
      case "DOCUMENT_APPROVED":
        return Shield;
      case "USER_CREATED":
      case "USER_UPDATED":
      case "USER_DELETED":
        return User;
      default:
        return Activity;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case "DOCUMENT_UPLOADED":
      case "DOCUMENT_CREATED":
        return "bg-blue-100 text-blue-800";
      case "DOCUMENT_SIGNED":
      case "DOCUMENT_APPROVED":
        return "bg-green-100 text-green-800";
      case "USER_CREATED":
        return "bg-purple-100 text-purple-800";
      case "USER_DELETED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getActionText = (action: string) => {
    const actionMap: { [key: string]: string } = {
      DOCUMENT_UPLOADED: "Documento enviado",
      DOCUMENT_CREATED: "Documento criado", 
      DOCUMENT_SIGNED: "Documento assinado",
      DOCUMENT_APPROVED: "Documento aprovado",
      DOCUMENT_REJECTED: "Documento rejeitado",
      USER_CREATED: "Usuário criado",
      USER_UPDATED: "Usuário atualizado",
      USER_DELETED: "Usuário excluído",
      LOGIN: "Login realizado",
      LOGOUT: "Logout realizado",
    };
    return actionMap[action] || action;
  };

  const filteredLogs = auditLogs.filter(log =>
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.entityType.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.details?.toString().toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (session?.user?.role !== "admin") {
    return null; // Will redirect in useEffect
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Auditoria</h1>
            <p className="text-gray-600">Acompanhe todas as atividades do sistema</p>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Buscar nos logs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filtrar por ação" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as ações</SelectItem>
                  <SelectItem value="DOCUMENT_UPLOADED">Documento enviado</SelectItem>
                  <SelectItem value="DOCUMENT_SIGNED">Documento assinado</SelectItem>
                  <SelectItem value="USER_CREATED">Usuário criado</SelectItem>
                  <SelectItem value="LOGIN">Login</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Audit Logs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              {filteredLogs.length} log(s) de auditoria
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="text-center py-8">
                <Shield className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhum log encontrado
                </h3>
                <p className="text-gray-500">
                  {searchTerm || actionFilter !== "all"
                    ? "Tente ajustar os filtros de busca"
                    : "Os logs de auditoria aparecerão aqui"}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredLogs.map((log, index) => {
                  const ActionIcon = getActionIcon(log.action);
                  return (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="flex items-start gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="p-2 bg-blue-100 rounded-lg mt-1">
                        <ActionIcon className="h-4 w-4 text-blue-600" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={getActionColor(log.action)}>
                            {getActionText(log.action)}
                          </Badge>
                          <span className="text-sm text-gray-500">
                            {log.entityType} #{log.entityId}
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-2">
                          Ação realizada por usuário #{log.performedBy}
                        </p>
                        
                        {log.details && (
                          <div className="text-xs text-gray-500 bg-gray-50 rounded p-2 mb-2">
                            <pre className="whitespace-pre-wrap">
                              {typeof log.details === 'object' 
                                ? JSON.stringify(log.details, null, 2)
                                : log.details}
                            </pre>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Clock className="h-3 w-3" />
                          <span>
                            {formatDistanceToNow(new Date(log.performedAt), {
                              addSuffix: true,
                              locale: ptBR,
                            })}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
