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
  allocations?: Array<{
    id: number;
    filial: string;
    centroCusto: string;
    valor: number;
    percentual: number;
  }>;
}

interface DocumentSignatoryData {
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
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

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
  const [signatories, setSignatories] = useState<DocumentSignatoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [signing, setSigning] = useState(false);
  const [downloading, setDownloading] = useState(false);

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

  const calculateSignatures = (sigs: DocumentSignatoryData[]) => {
    const total = sigs?.length || 0;
    const signed = sigs?.filter(sig => sig.status === 'SIGNED' || sig.status === 'signed').length || 0;
    const pending = sigs?.filter(sig => sig.status === 'PENDING' || sig.status === 'pending').length || 0;
    const rejected = sigs?.filter(sig => sig.status === 'REJECTED' || sig.status === 'rejected').length || 0;
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
    if (!signatories || signatories.length === 0) return false;
    
    const userSignatory = signatories.find(
      sig => sig.user.id === CURRENT_USER.id
    );
    
    if (!userSignatory) return false;
    
    if (userSignatory.status === 'SIGNED' || userSignatory.status === 'signed') {
      return false;
    }
    
    const pendingSignatories = signatories
      .filter(sig => sig.status === 'PENDING' || sig.status === 'pending')
      .sort((a, b) => a.order - b.order);
    
    return pendingSignatories.length > 0 && pendingSignatories[0].id === userSignatory.id;
  };

  const getSigningStatus = () => {
    if (!signatories || signatories.length === 0) return null;
    
    const userSignatory = signatories.find(
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
    
    const pendingSignatories = signatories
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
      const response = await ApiService.post(`/documents/${documentId}/sign`);
      
      if (!response.success) {
        throw new Error(response.message || response.error || 'Erro ao assinar documento');
      }
      
      toast({
        title: "Sucesso",
        description: "Documento assinado com sucesso!",
        variant: "default",
      });
      
      await fetchDocument();
      await fetchSignatories(); // Re-fetch signatories after signing
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
    if (!document?.id) return null;
    return `/documents/${document.id}/download`;
  };

  const handleDownload = async () => {
    if (!document?.id || downloading) return;
    
    setDownloading(true);
    try {
      const response = await ApiService.get(`/documents/${document.id}/download`, {
        responseType: 'blob'
      });
      
      if (!response.success) {
        throw new Error(response.message || response.error || 'Erro ao baixar documento');
      }
      
      const blob = new Blob([response.data], { type: document.mimeType });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = document.fileName || 'documento.pdf';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Sucesso",
        description: "Download concluído com sucesso!",
        variant: "default",
      });
    } catch (error: any) {
      console.error('Error downloading document:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao baixar documento",
        variant: "destructive",
      });
    } finally {
      setDownloading(false);
    }
  };

  const handleViewPdf = () => {
    if (!document?.id) return;
    const pdfUrl = `/documents/${document.id}/download`;
    window.open(pdfUrl, '_blank');
  };

  useEffect(() => {
    if (documentId) {
      fetchDocument();
      fetchSignatories();
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

  const fetchSignatories = async () => {
    try {
      const response = await ApiService.get(`/documents/${documentId}/signatories`) as ApiResponse<DocumentSignatoryData[]>;

      if (!response.success) {
        throw new Error(response.message || response.error || 'Erro ao carregar signatários');
      }

      if (!response.data) {
        setSignatories([]);
        return;
      }

      setSignatories(response.data);
    } catch (error: any) {
      console.error('Error fetching signatories:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao carregar signatários",
        variant: "destructive",
      });
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

  const signatureStats = calculateSignatures(signatories);
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
                     <span>Por: {document.owner?.name}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {getStatusBadge(document.status)}
                  <div className="flex gap-2">
                    {document.mimeType === 'application/pdf' && (
                      <Button variant="outline" size="sm" onClick={handleViewPdf}>
                        <Eye className="h-4 w-4 mr-2" />
                        Ver PDF
                      </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={handleDownload} disabled={downloading}>
                      {downloading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4 mr-2" />
                      )}
                      Download
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => router.push(`/documentos/${document.id}/editar`)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Coluna Principal para o PDF Viewer */}
                <div className="lg:col-span-2">
                  {document.mimeType === 'application/pdf' && pdfUrl && (
                    <Card className="h-[600px]">
                      <CardHeader>
                        <CardTitle>Visualização do Documento</CardTitle>
                      </CardHeader>
                      <CardContent className="h-[calc(100%-70px)]">
                        <iframe src={pdfUrl} className="w-full h-full border-none rounded-md" title="Visualização do PDF"></iframe>
                      </CardContent>
                    </Card>
                  )} 
                  {/* Se não for PDF ou não tiver URL, pode adicionar um fallback ou deixar em branco */}
                  {document.mimeType !== 'application/pdf' && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Visualização não disponível</AlertTitle>
                      <AlertDescription>
                        Este tipo de documento não pode ser visualizado diretamente aqui.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                {/* Coluna Lateral para Cards de Informações */}
                <div className="lg:col-span-1 flex flex-col gap-6">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Informações Gerais</CardTitle>
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">{document.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">{document.description}</p>
                      <Separator className="my-3" />
                      <div className="text-sm">
                        <p className="flex items-center gap-2"><User className="h-4 w-4" /> Proprietário: {document.owner?.name}</p>
                        <p className="flex items-center gap-2"><Building className="h-4 w-4" /> Fornecedor: {document.fornecedor?.name || 'N/A'}</p>
                        <p className="flex items-center gap-2"><Receipt className="h-4 w-4" /> Tipo: {document.tipoDocumento}</p>
                        <p className="flex items-center gap-2"><FileText className="h-4 w-4" /> Nome do Arquivo: {document.fileName}</p>
                        <p className="flex items-center gap-2"><FileText className="h-4 w-4" /> Tamanho: {formatBytes(document.fileSize)}</p>
                        <p className="flex items-center gap-2"><Calendar className="h-4 w-4" /> Criado em: {new Date(document.createdAt).toLocaleDateString('pt-BR')}</p>
                        {document.dataVencimento && (
                          <p className="flex items-center gap-2"><Calendar className="h-4 w-4" /> Vencimento: {new Date(document.dataVencimento).toLocaleDateString('pt-BR')}</p>
                        )}
                        {document.observacoes && (
                          <p className="flex items-center gap-2"><Eye className="h-4 w-4" /> Observações: {document.observacoes}</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Valores e Parcelas</CardTitle>
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">{formatCurrency(document.valor || 0)}</p>
                      <p className="text-xs text-muted-foreground mt-1">Valor Total do Documento</p>
                      <Separator className="my-3" />
                      <div className="text-sm">
                        <p className="flex items-center gap-2"><PieChart className="h-4 w-4" /> Parcelas: {document.installments?.length || 0}</p>
                        {document.installments && document.installments.length > 0 && (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>#</TableHead>
                                <TableHead>Valor</TableHead>
                                <TableHead>Vencimento</TableHead>
                                <TableHead>Status</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {formatInstallments(document.installments).map((installment) => (
                                <TableRow key={installment.id}>
                                  <TableCell>{installment.installmentNumber}</TableCell>
                                  <TableCell>{installment.formattedAmount}</TableCell>
                                  <TableCell>{installment.formattedDueDate}</TableCell>
                                  <TableCell>{getStatusBadge(installment.status)}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Signatários</CardTitle>
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{signatureStats.assinadas} de {signatureStats.total}</div>
                      <p className="text-xs text-muted-foreground mt-1">Assinaturas Concluídas</p>
                      <Progress value={signatureStats.progresso} className="mt-2" />
                      <Separator className="my-3" />
                      <div className="text-sm">
                        {signatories.length > 0 ? (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Ordem</TableHead>
                                <TableHead>Nome</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Status</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {signatories.sort((a, b) => a.order - b.order).map((signatory) => (
                                <TableRow key={signatory.id}>
                                  <TableCell>{signatory.order}</TableCell>
                                  <TableCell>{signatory.user.name}</TableCell>
                                  <TableCell>{signatory.user.email}</TableCell>
                                  <TableCell>{getSignatureStatusBadge(signatory.status)}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        ) : (
                          <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Nenhum signatário</AlertTitle>
                            <AlertDescription>
                              Este documento não possui signatários cadastrados.
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {document.allocations && document.allocations.length > 0 && (
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Rateio</CardTitle>
                        <PieChart className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(calculateAllocations(document.allocations, document.valor).totalValor)}</div>
                        <p className="text-xs text-muted-foreground mt-1">Total Alocado</p>
                        <Separator className="my-3" />
                        <div className="text-sm">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Filial</TableHead>
                                <TableHead>Centro de Custo</TableHead>
                                <TableHead>Valor</TableHead>
                                <TableHead>Percentual</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {document.allocations.map((allocation) => (
                                <TableRow key={allocation.id}>
                                  <TableCell>{allocation.filial}</TableCell>
                                  <TableCell>{allocation.centroCusto}</TableCell>
                                  <TableCell>{formatCurrency(allocation.valor)}</TableCell>
                                  <TableCell>{allocation.percentual}%</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                {signingStatus?.type === 'can_sign' && (
                  <Button onClick={handleSign} disabled={signing}>
                    {signing ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <PenTool className="h-4 w-4 mr-2" />
                    )}
                    Assinar Documento
                  </Button>
                )}
                {signingStatus?.type === 'waiting_turn' && (
                  <Alert className="w-auto">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Aguardando sua vez</AlertTitle>
                    <AlertDescription>
                      {signingStatus.message}
                    </AlertDescription>
                  </Alert>
                )}
                {signingStatus?.type === 'already_signed' && (
                  <Alert className="w-auto">
                    <CheckCircle className="h-4 w-4" />
                    <AlertTitle>Já Assinado</AlertTitle>
                    <AlertDescription>
                      {signingStatus.message}
                    </AlertDescription>
                  </Alert>
                )}
                {signingStatus?.type === 'rejected' && (
                  <Alert className="w-auto">
                    <XCircle className="h-4 w-4" />
                    <AlertTitle>Documento Rejeitado</AlertTitle>
                    <AlertDescription>
                      {signingStatus.message}
                    </AlertDescription>
                  </Alert>
                )}
                {signingStatus?.type === 'not_signatory' && (
                  <Alert className="w-auto">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Não é Signatário</AlertTitle>
                    <AlertDescription>
                      {signingStatus.message}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </MainLayout>
  );
}


