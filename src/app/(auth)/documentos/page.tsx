"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  FileText, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  MoreHorizontal,
  Plus,
  Loader2 
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ApiService } from "@/lib/api";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { Document, DocumentStatus } from "@/types/document.type";
import { documentTypeLabels } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { documentService } from "@/lib/data/document";

// Interface para a resposta da API
interface ApiResponse {
  success: boolean;
  message: string;
  data: Document[];
}

export default function DocumentosPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { toast } = useToast();

  useEffect(() => {
    fetchDocuments();
  }, [statusFilter]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const filters: any = {};
      if (statusFilter !== "all") {
        filters.status = statusFilter;
      }
      
      // Atualizado para usar o novo formato de resposta
      const { data } = await ApiService.get(`/documents${buildQueryString(filters)}`) as ApiResponse;
      
      
      setDocuments(data || []);
    } catch (error) {
      console.error("Error fetching documents:", error);
      toast({
        title: "Erro ao carregar documentos",
        description: "Não foi possível carregar a lista de documentos.",
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

  const getStatusColor = (status: Document["status"]) => {
    switch (status) {
      case DocumentStatus.COMPLETED:
        return "bg-green-100 text-green-800";
      case DocumentStatus.IN_PROGRESS:
        return "bg-blue-100 text-blue-800";
      case DocumentStatus.DRAFT:
        return "bg-gray-100 text-gray-800";
      case DocumentStatus.REJECTED:
        return "bg-red-100 text-red-800";
      case DocumentStatus.CANCELLED:
        return "bg-gray-100 text-gray-800";
      case DocumentStatus.PENDING:
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: Document["status"]) => {
    switch (status) {
      case DocumentStatus.COMPLETED:
        return "Completo";
      case DocumentStatus.IN_PROGRESS:
        return "Em assinatura";
      case DocumentStatus.DRAFT:
        return "Rascunho";
      case DocumentStatus.REJECTED:
        return "Rejeitado";
      case DocumentStatus.CANCELLED:
        return "Cancelado";
      case DocumentStatus.PENDING:
        return "Pendente";
      default:
        return status;
    }
  };

  const filteredDocuments = documents.filter(doc =>
    (doc.title || doc.fileName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (doc.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (doc.description || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDownload = async (documentId: number, filename: string) => {
    try {
      await documentService.downloadDocument(documentId, filename);        
      toast({
        title: "Download iniciado",
        description: "O arquivo está sendo baixado.",
      });
    } catch (error) {
      toast({
        title: "Erro no download",
        description: "Não foi possível baixar o arquivo.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Documentos</h1>
          <p className="text-gray-600">Gerencie todos os seus documentos</p>
        </div>
        <Button asChild>
          <Link href="/upload">
            <Plus className="h-4 w-4 mr-2" />
            Novo Documento
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar documentos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value={DocumentStatus.DRAFT}>Rascunho</SelectItem>
                <SelectItem value={DocumentStatus.PENDING}>Pendente</SelectItem>
                <SelectItem value={DocumentStatus.IN_PROGRESS}>Em assinatura</SelectItem>
                <SelectItem value={DocumentStatus.COMPLETED}>Completo</SelectItem>
                <SelectItem value={DocumentStatus.REJECTED}>Rejeitado</SelectItem>
                <SelectItem value={DocumentStatus.CANCELLED}>Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Documents List */}
      <Card>
        <CardHeader>
          <CardTitle>
            {filteredDocuments.length} documento(s) encontrado(s)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhum documento encontrado
              </h3>
              <p className="text-gray-500">
                {searchTerm || statusFilter !== "all"
                  ? "Tente ajustar os filtros de busca"
                  : "Comece enviando seu primeiro documento"}
              </p>
              {!searchTerm && statusFilter === "all" && (
                <Button asChild className="mt-4">
                  <Link href="/upload">
                    <Plus className="h-4 w-4 mr-2" />
                    Enviar Documento
                  </Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredDocuments.map((document, index) => (
                <motion.div
                  key={document.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <FileText className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">
                        {document.title || document.fileName}
                      </h3>
                      {document.description && (
                        <p className="text-sm text-gray-600 truncate">
                          {document.description}
                        </p>
                      )}
                      <p className="text-sm text-gray-500">
                        Criado {formatDistanceToNow(new Date(document.createdAt), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                        {document.owner && (
                          <span className="ml-2">
                            por {document.owner.name}
                          </span>
                        )}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={getStatusColor(document.status)}>
                          {getStatusText(document.status)}
                        </Badge>
                        {document.tipoDocumento && (
                          <Badge variant="outline">
                            {documentTypeLabels[document.tipoDocumento]}
                          </Badge>
                        )}
                        {document.valor && (
                          <span className="text-xs text-gray-500">
                            {formatCurrency(document.valor * 100)}
                          </span>
                        )}
                        <span className="text-xs text-gray-500">
                          {document.installments?.length || 0} parcela(s)
                        </span>
                        {document.fornecedor && (
                          <span className="text-xs text-gray-500">
                            {document.fornecedor.razaoSocial}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/documentos/${document.id}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownload(document.id, document.fileName)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/documentos/${document.id}`}>Ver detalhes</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem>Editar</DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">
                          Cancelar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
