
"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Eye, Download } from "lucide-react";
import { Document } from "@/lib/types";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface RecentDocumentsProps {
  documents: Document[];
  loading?: boolean;
}

export function RecentDocuments({ documents, loading = false }: RecentDocumentsProps) {
  // Ensure documents is always an array to prevent .map() errors
  const safeDocuments = Array.isArray(documents) ? documents : [];
  const getStatusColor = (status: Document["status"]) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-100 text-green-800";
      case "SIGNING":
        return "bg-blue-100 text-blue-800";
      case "DRAFT":
        return "bg-gray-100 text-gray-800";
      case "REJECTED":
        return "bg-red-100 text-red-800";
      case "CANCELLED":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: Document["status"]) => {
    switch (status) {
      case "COMPLETED":
        return "Completo";
      case "SIGNING":
        return "Em assinatura";
      case "DRAFT":
        return "Rascunho";
      case "REJECTED":
        return "Rejeitado";
      case "CANCELLED":
        return "Cancelado";
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Documentos Recentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3 border rounded-lg animate-pulse">
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-48 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-24"></div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-6 bg-gray-200 rounded w-16"></div>
                  <div className="h-8 bg-gray-200 rounded w-8"></div>
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
          <FileText className="h-5 w-5" />
          Documentos Recentes
        </CardTitle>
      </CardHeader>
      <CardContent>
        {safeDocuments.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-2 opacity-20" />
            <p>Nenhum documento encontrado</p>
          </div>
        ) : (
          <div className="space-y-4">
            {safeDocuments.map((document, index) => (
              <motion.div
                key={document.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 truncate">
                    {document.originalFilename}
                  </h4>
                  <p className="text-sm text-gray-500">
                    {formatDistanceToNow(new Date(document.createdAt), {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor(document.status)}>
                    {getStatusText(document.status)}
                  </Badge>
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
