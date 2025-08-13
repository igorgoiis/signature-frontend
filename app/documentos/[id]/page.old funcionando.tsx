"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { 
  FileText, 
  Download, 
  Edit, 
  ArrowLeft,
  User,
  Calendar,
  DollarSign,
  Building,
  CheckCircle,
  Clock,
  XCircle,
  Loader2,
  Receipt,
  PieChart,
  PenTool,
  Eye,
  AlertCircle,
  Users
} from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ApiService } from "@/lib/api";

interface DocumentData {
  id: number;
  title: string | null;
  description: string | null;
  filePath: string;
  fileName: string;
  fileSize: string;
  mimeType: string;
  fileHash: string;
  tipoDocumento: string | null;
  status: string;
  valor: number | null;
  dataVencimento: string | null;
  observacoes: string | null;
  createdAt: string;
  updatedAt: string;
  ownerId: number;
  fornecedorId: number | null;
  owner: {
    id: number;
    name: string;
    email: string;
    role: string;
  };
  fornecedor: {
    id: number;
    name: string;
    email: string;
  } | null;
  installments: Array<{
    id: number;
    documentId: number;
    installmentNumber: number;
    amount: number;
    dueDate: string;
    status: string;
    paidAt?: string | null;
  }>;
  signatories?: Array<{
    id: number;
    userId: number;
    documentId: number;
    order: number;
    status: string;
    signedAt?: string | null;
    rejectionReason?: string | null;
    user: {
      id: number;
      name: string;
      email: string;
    };
  }>;
  allocations?: Array<{
    id: number;
    filial: string;
    centroCusto: string;
    valor: number;
    percentual: number;
  }>;
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

// Mock do usuário atual - em produção, isso viria do contexto de autenticação
const CURRENT_USER = {
  id: 1,
  name: "Administrador Principal",
  email: "admin@admin.com"
};

const getStatusBadge = (status: string) => {
  const statusConfig = {
    PENDING: { label: 'Pendente', variant: 'secondary' as const, icon: Clock },
    SIGNING: { label: 'Em Assinatura', variant: 'default' as const, icon: FileText },
    COMPLETED: { label: 'Concluído', variant: 'default' as const, icon: CheckCircle },
    REJECTED: { label: 'Rejeitado', variant: 'destructive' as const, icon: XCircle },
    CANCELLED: { label: 'Cancelado', variant: 'secondary' as const, icon: XCircle },
    pending: { label: 'Pendente', variant: 'secondary' as const, icon: Clock },
    signing: { label: 'Em Assinatura', variant: 'default' as const, icon: FileText },
    signed: { label: 'Assinado', variant: 'default' as const, icon: CheckCircle },
    completed: { label: 'Concluído', variant: 'default' as const, icon: CheckCircle },
    rejected: { label: 'Rejeitado', variant: 'destructive' as const, icon: XCircle },
    cancelled: { label: 'Cancelado', variant: 'secondary' as const, icon: XCircle }
  };

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING;
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className="flex items-center gap-1">
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
};

const getSignatureStatusBadge = (status: string) => {
  const statusConfig = {
    PENDING: { label: 'Pendente', variant: 'secondary' as const, icon: Clock },
    SIGNED: { label: 'Assinado', variant: 'default' as const, icon: CheckCircle },
    REJECTED: { label: 'Rejeitado', variant: 'destructive' as const, icon: XCircle },
    pending: { label: 'Pendente', variant: 'secondary' as const, icon: Clock },
    signed: { label: 'Assinado', variant: 'default' as const, icon: CheckCircle },
    rejected: { label: 'Rejeitado', variant: 'destructive' as const, icon: XCircle }
  };

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING;
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className="flex items-center gap-1">
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

export default function DocumentViewPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [document, setDocument] = useState<DocumentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [signing, setSigning] = useState(false);

  const documentId = params?.id as string;

  const calculateAllocations = (allocations: DocumentData['allocations'], totalValue: number | null) => {
    const totalAllocated = allocations?.reduce((total, allocation) => total + allocation.valor, 0) || 0;
    const percentualDistribuido = totalValue ? (totalAllocated / totalValue) * 100 : 0;
    
    return {
      totalItems: allocations?.length || 0,
      totalValor: totalAllocated,
      percentualDistribuido: Math.round(percentualDistribuido * 100) / 100,
      saldoRestante: totalValue ? totalValue - totalAllocated : 0
    };
  };

  const calculateSignatures = (signatories: DocumentData['signatories']) => {
    const total = signatories?.length || 0;
    const signed = signatories?.filter(sig => sig.status === 'SIGNED' || sig.status === 'signed').length || 0;
    const pending = signatories?.filter(sig => sig.status === 'PENDING' || sig.status === 'pending').length || 0;
    const rejected = signatories?.filter(sig => sig.status === 'REJECTED' || sig.status === 'rejected').length || 0;
    const progress = total > 0 ? (signed / total) * 100 : 0;
    
    return {
      total,
      assinadas: signed,
      pendentes: pending,
      rejeitadas: rejected,
      progresso: Math.round(progress * 100) / 100
    };
  };

  const canUserSign = () => {
    if (!document?.signatories) return false;
    
    const userSignatory = document.signatories.find(
      sig => sig.user.id === CURRENT_USER.id
    );
    
    if (!userSignatory) return false;
    
    // Verifica se o usuário ainda não assinou
    if (userSignatory.status === 'SIGNED' || userSignatory.status === 'signed') {
      return false;
    }
    
    // Verifica se é a vez do usuário (ordem de assinatura)
    const pendingSignatories = document.signatories
      .filter(sig => sig.status === 'PENDING' || sig.status === 'pending')
      .sort((a, b) => a.order - b.order);
    
    return pendingSignatories.length > 0 && pendingSignatories[0].id === userSignatory.id;
  };

  const getSigningStatus = () => {
    if (!document?.signatories) return null;
    
    const userSignatory = document.signatories.find(
      sig => sig.user.id === CURRENT_USER.id
    );
    
    if (!userSignatory) {
      return { type: 'not_signatory', message: 'Você não é um signatário deste documento' };
    }
    
    if (userSignatory.status === 'SIGNED' || userSignatory.status === 'signed') {
      return { type: 'already_signed', message: 'Você já assinou este documento' };
    }
    
    if (userSignatory.status === 'REJECTED' || userSignatory.status === 'rejected') {
      return { type: 'rejected', message: 'Você rejeitou este documento' };
    }
    
    const pendingSignatories = document.signatories
      .filter(sig => sig.status === 'PENDING' || sig.status === 'pending')
      .sort((a, b) => a.order - b.order);
    
    if (pendingSignatories.length > 0 && pendingSignatories[0].id === userSignatory.id) {
      return { type: 'can_sign', message: 'É sua vez de assinar' };
    }
    
    return { type: 'waiting_turn', message: 'Aguardando outros signatários' };
  };

  const handleSign = async () => {
    if (!canUserSign()) return;
    
    setSigning(true);
    try {
      // Aqui seria feita a chamada para a API de assinatura
      // const response = await ApiService.post(`/documents/${documentId}/sign`);
      
      // Simulação de sucesso
      toast({
        title: "Sucesso",
        description: "Documento assinado com sucesso!",
        variant: "default",
      });
      
      // Recarregar o documento para atualizar o status
      await fetchDocument();
    } catch (error: any) {
      console.error('Error signing document:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao assinar documento",
        variant: "destructive",
      });
    } finally {
      setSigning(false);
    }
  };

  const formatBytes = (bytes: number | string) => {
    const numBytes = typeof bytes === 'string' ? parseInt(bytes) : bytes;
    if (numBytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(numBytes) / Math.log(k));
    return parseFloat((numBytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatInstallments = (installments: DocumentData['installments']) => {
    if (!installments || !Array.isArray(installments)) return [];
    return installments.map(installment => ({
      ...installment,
      formattedDueDate: new Date(installment.dueDate).toLocaleDateString('pt-BR'),
      formattedAmount: formatCurrency(installment.amount)
    }));
  };

  const getPdfUrl = () => {
    if (!document?.filePath) return null;
    // Assumindo que a API serve os arquivos em /api/files/
    return `/api/files/${document.filePath}`;
  };

  useEffect(() => {
    if (documentId) {
      fetchDocument();
    }
  }, [documentId]);

  const fetchDocument = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await ApiService.get(`/documents/${documentId}`) as ApiResponse<DocumentData>;

      if (!response.success) {
        throw new Error(response.message || response.error || 'Erro ao carregar documento');
      }

      if (!response.data) {
        throw new Error('Dados do documento não encontrados');
      }

      setDocument(response.data);
    } catch (error: any) {
      console.error('Error fetching document:', error);
      setError(error.message || 'Erro ao carregar documento');
      toast({
        title: "Erro",
        description: error.message || "Erro ao carregar documento",
        variant: "destructive",
      });

      if (error.response?.status === 401) {
        router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="flex items-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Carregando documento...</span>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error || !document) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <Card className="w-full max-w-md">
              <CardContent className="flex flex-col items-center gap-4 pt-6">
                <XCircle className="h-12 w-12 text-destructive" />
                <div className="text-center">
                  <h3 className="text-lg font-semibold">Documento não encontrado</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {error || 'O documento solicitado não existe ou você não tem permissão para visualizá-lo.'}
                  </p>
                </div>
                <Button onClick={() => router.push('/documentos')} className="mt-4">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar aos Documentos
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </MainLayout>
    );
  }

  const getDocumentTitle = () => {
    return document.title || document.fileName || 'Documento sem título';
  };

  const signingStatus = getSigningStatus();
  const pdfUrl = getPdfUrl();

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/documentos">Documentos</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{getDocumentTitle()}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="mb-6">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">{getDocumentTitle()}</CardTitle>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <span>
                        Criado {formatDistanceToNow(new Date(document.createdAt), { 
                          addSuffix: true, 
                          locale: ptBR 
                        })}
                      </span>
                      <span>•</span>
                      <span>Por: {document.owner.name}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {getStatusBadge(document.status)}
                  <div className="flex gap-2">
                    {/* Botão de Assinatura */}
                    {signingStatus && (
                      <Button 
                        variant={signingStatus.type === 'can_sign' ? 'default' : 'outline'}
                        size="sm"
                        disabled={!canUserSign() || signing}
                        onClick={handleSign}
                      >
                        {signing ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <PenTool className="h-4 w-4 mr-2" />
                        )}
                        {signing ? 'Assinando...' : 'Assinar'}
                      </Button>
                    )}
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>
        </motion.div>

        {/* Status de Assinatura Alert */}
        {signingStatus && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-6"
          >
            <Alert className={
              signingStatus.type === 'can_sign' ? 'border-green-200 bg-green-50' :
              signingStatus.type === 'already_signed' ? 'border-blue-200 bg-blue-50' :
              signingStatus.type === 'rejected' ? 'border-red-200 bg-red-50' :
              'border-yellow-200 bg-yellow-50'
            }>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Status de Assinatura</AlertTitle>
              <AlertDescription>{signingStatus.message}</AlertDescription>
            </Alert>
          </motion.div>
        )}

        {/* Layout Principal - PDF Central + Card Lateral */}
        <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-200px)]">
          {/* Área Central - Visualização do PDF */}
          <div className="flex-1 lg:flex-[2]">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="h-full"
            >
              <Card className="h-full">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Visualização do Documento
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-[calc(100%-80px)] p-0">
                  {pdfUrl ? (
                    <iframe
                      src={pdfUrl}
                      className="w-full h-full border-0 rounded-b-lg"
                      title="Visualização do PDF"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full bg-muted/20 rounded-b-lg">
                      <div className="text-center">
                        <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">
                          Visualização do documento não disponível
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Arquivo: {document.fileName}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Card Lateral - Todas as Informações */}
          <div className="w-full lg:w-96 lg:flex-shrink-0">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="h-full"
            >
              <Card className="h-full">
                <CardHeader className="pb-3 border-b">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Informações do Documento</CardTitle>
                    {/* Botão de Assinatura no Header */}
                    {signingStatus && (
                      <Button 
                        variant={signingStatus.type === 'can_sign' ? 'default' : 'outline'}
                        size="sm"
                        disabled={!canUserSign() || signing}
                        onClick={handleSign}
                      >
                        {signing ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <PenTool className="h-4 w-4 mr-2" />
                        )}
                        {signing ? 'Assinando...' : 'Assinar'}
                      </Button>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent className="h-[calc(100%-80px)] overflow-y-auto p-4 space-y-6">
                  {/* Seção de Assinatura */}
                  {signingStatus && (
                    <div className="space-y-3">
                      <Alert className={
                        signingStatus.type === 'can_sign' ? 'border-green-200 bg-green-50' :
                        signingStatus.type === 'already_signed' ? 'border-blue-200 bg-blue-50' :
                        signingStatus.type === 'rejected' ? 'border-red-200 bg-red-50' :
                        'border-yellow-200 bg-yellow-50'
                      }>
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle className="text-sm">Status de Assinatura</AlertTitle>
                        <AlertDescription className="text-xs">{signingStatus.message}</AlertDescription>
                      </Alert>
                    </div>
                  )}

                  {/* Informações de Assinatura */}
                  {document.signatories && document.signatories.length > 0 && (() => {
                    const signatureSummary = calculateSignatures(document.signatories);
                    const signedSignatories = document.signatories.filter(sig => sig.status === 'SIGNED' || sig.status === 'signed');
                    const pendingSignatories = document.signatories.filter(sig => sig.status === 'PENDING' || sig.status === 'pending');
                    
                    return (
                      <div className="space-y-4">
                        <div>
                          <h3 className="flex items-center gap-2 font-semibold text-sm mb-3">
                            <Users className="h-4 w-4" />
                            Signatários ({signatureSummary.total})
                          </h3>
                          <div className="space-y-2">
                            <div className="flex justify-between text-xs">
                              <span>Progresso</span>
                              <span>{signatureSummary.progresso.toFixed(0)}%</span>
                            </div>
                            <Progress value={signatureSummary.progresso} className="h-2" />
                            <div className="flex gap-3 text-xs text-muted-foreground">
                              <span>✓ {signatureSummary.assinadas}</span>
                              <span>⏳ {signatureSummary.pendentes}</span>
                              {signatureSummary.rejeitadas > 0 && <span>✗ {signatureSummary.rejeitadas}</span>}
                            </div>
                          </div>
                        </div>

                        {/* Quem já assinou */}
                        {signedSignatories.length > 0 && (
                          <div>
                            <h4 className="text-xs font-medium text-green-600 mb-2">✓ Já assinaram</h4>
                            <div className="space-y-2">
                              {signedSignatories
                                .sort((a, b) => a.order - b.order)
                                .map((signatory) => (
                                <div key={signatory.id} className="flex items-center justify-between p-2 rounded-md bg-green-50 border border-green-200">
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-xs px-1 py-0">
                                      {signatory.order}º
                                    </Badge>
                                    <div>
                                      <p className="text-xs font-medium">{signatory.user.name}</p>
                                      <p className="text-xs text-muted-foreground">{signatory.user.email}</p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    {getSignatureStatusBadge(signatory.status)}
                                    {signatory.signedAt && (
                                      <p className="text-xs text-muted-foreground mt-1">
                                        {formatDistanceToNow(new Date(signatory.signedAt), { 
                                          addSuffix: true, 
                                          locale: ptBR 
                                        })}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Pendentes */}
                        {pendingSignatories.length > 0 && (
                          <div>
                            <h4 className="text-xs font-medium text-amber-600 mb-2">⏳ Pendentes</h4>
                            <div className="space-y-2">
                              {pendingSignatories
                                .sort((a, b) => a.order - b.order)
                                .map((signatory) => (
                                <div key={signatory.id} className="flex items-center justify-between p-2 rounded-md bg-amber-50 border border-amber-200">
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-xs px-1 py-0">
                                      {signatory.order}º
                                    </Badge>
                                    <div>
                                      <p className="text-xs font-medium">{signatory.user.name}</p>
                                      <p className="text-xs text-muted-foreground">{signatory.user.email}</p>
                                    </div>
                                  </div>
                                  {getSignatureStatusBadge(signatory.status)}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  <Separator />

                  {/* Informações Financeiras */}
                  {(document.tipoDocumento || document.valor || document.dataVencimento) && (
                    <div className="space-y-4">
                      <h3 className="flex items-center gap-2 font-semibold text-sm">
                        <DollarSign className="h-4 w-4" />
                        Informações Financeiras
                      </h3>
                      <div className="space-y-3">
                        {document.tipoDocumento && (
                          <div>
                            <label className="text-xs font-medium text-muted-foreground">Tipo de Documento</label>
                            <p className="text-sm mt-1">{document.tipoDocumento}</p>
                          </div>
                        )}
                        {document.valor && (
                          <div>
                            <label className="text-xs font-medium text-muted-foreground">Valor Total</label>
                            <p className="text-lg font-semibold text-green-600 mt-1">
                              {formatCurrency(document.valor)}
                            </p>
                          </div>
                        )}
                        {document.dataVencimento && (
                          <div>
                            <label className="text-xs font-medium text-muted-foreground">Data de Vencimento</label>
                            <p className="text-sm mt-1 flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(document.dataVencimento).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                        )}
                        
                        {/* Parcelas */}
                        {document.installments && document.installments.length > 0 && (
                          <div>
                            <label className="text-xs font-medium text-muted-foreground">
                              Parcelas ({document.installments.length})
                            </label>
                            <div className="mt-2 space-y-2">
                              {formatInstallments(document.installments).map((installment) => (
                                <div key={installment.id} className="p-2 rounded-md border bg-card/50">
                                  <div className="flex items-center justify-between mb-1">
                                    <Badge variant="outline" className="text-xs">
                                      {installment.installmentNumber}ª parcela
                                    </Badge>
                                    {getStatusBadge(installment.status)}
                                  </div>
                                  <div className="flex justify-between text-xs">
                                    <span>Vencimento: {installment.formattedDueDate}</span>
                                    <span className="font-semibold">{installment.formattedAmount}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <Separator />

                  {/* Informações do Fornecedor */}
                  {document.fornecedor && (
                    <div className="space-y-4">
                      <h3 className="flex items-center gap-2 font-semibold text-sm">
                        <Building className="h-4 w-4" />
                        Fornecedor
                      </h3>
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs font-medium text-muted-foreground">Nome</label>
                          <p className="text-sm font-medium mt-1">{document.fornecedor.name}</p>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-muted-foreground">Email</label>
                          <p className="text-sm mt-1">{document.fornecedor.email}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <Separator />

                  {/* Informações de Rateio */}
                  {document.allocations && document.allocations.length > 0 && (() => {
                    const allocationSummary = calculateAllocations(document.allocations, document.valor);
                    return (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="flex items-center gap-2 font-semibold text-sm">
                            <PieChart className="h-4 w-4" />
                            Rateio ({allocationSummary.totalItems})
                          </h3>
                          <Badge variant="outline" className="text-xs">
                            {allocationSummary.percentualDistribuido.toFixed(1)}%
                          </Badge>
                        </div>
                        <div className="space-y-2">
                          {document.allocations.map((allocation) => (
                            <div key={allocation.id} className="p-2 rounded-md border bg-card/50">
                              <div className="flex justify-between items-start mb-1">
                                <div>
                                  <p className="text-xs font-medium">{allocation.filial}</p>
                                  <p className="text-xs text-muted-foreground">{allocation.centroCusto}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-xs font-semibold">{formatCurrency(allocation.valor)}</p>
                                  <p className="text-xs text-muted-foreground">{allocation.percentual.toFixed(1)}%</p>
                                </div>
                              </div>
                            </div>
                          ))}
                          <div className="p-2 rounded-md bg-muted/50 border-t-2">
                            <div className="flex justify-between text-xs font-semibold">
                              <span>Total Distribuído</span>
                              <span>{formatCurrency(allocationSummary.totalValor)}</span>
                            </div>
                            {allocationSummary.saldoRestante > 0 && (
                              <div className="flex justify-between text-xs text-amber-600 mt-1">
                                <span>Saldo Restante</span>
                                <span>{formatCurrency(allocationSummary.saldoRestante)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  <Separator />

                  {/* Informações Básicas */}
                  <div className="space-y-4">
                    <h3 className="flex items-center gap-2 font-semibold text-sm">
                      <FileText className="h-4 w-4" />
                      Informações Básicas
                    </h3>
                    <div className="space-y-3">
                      {document.description && (
                        <div>
                          <label className="text-xs font-medium text-muted-foreground">Descrição</label>
                          <p className="text-sm mt-1">{document.description}</p>
                        </div>
                      )}
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Nome do Arquivo</label>
                        <p className="text-sm mt-1">{document.fileName}</p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Tamanho</label>
                        <p className="text-sm mt-1">{formatBytes(document.fileSize)}</p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Proprietário</label>
                        <p className="text-sm mt-1 flex items-center gap-2">
                          <User className="h-3 w-3" />
                          {document.owner.name}
                        </p>
                      </div>
                      {document.observacoes && (
                        <div>
                          <label className="text-xs font-medium text-muted-foreground">Observações</label>
                          <p className="text-sm mt-1">{document.observacoes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
