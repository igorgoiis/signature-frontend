"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { 
  FileText, 
  Download, 
  ArrowLeft,
  User,
  Calendar,
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
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ApiService } from "@/lib/api";
import { documentService } from "@/lib/data/document";
import { documentTypeLabels } from "@/lib/types";
import { Document } from "@/types/document.type";
import { formatCurrency, getSignatureStatusBadge } from "@/lib/utils";
import { DocumentSignatory, SignatoryStatus } from "@/types/document-signatory.type";
import { authService } from "@/lib/api/services/authService";
import { formatUTCDateToUserTimezone } from "@/lib/date-helper";

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

const getStatusInstallmentBadge = (isPaid: boolean) => {
  const statusConfig = {
    PENDING: { label: 'Pendente', variant: 'secondary' as const, icon: Clock },
    PAID: { label: 'Pago', variant: 'default' as const, icon: CheckCircle },
  };

  const config = isPaid ? statusConfig.PAID : statusConfig.PENDING;
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className="flex items-center gap-1">
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}

const renderSignatureStatusBadge = (status: SignatoryStatus) => {
  const { Icon, config } = getSignatureStatusBadge(status);

  return (
    <Badge variant={config.variant} className="flex items-center gap-1">
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
};

export default function DocumentViewPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [document, setDocument] = useState<Document | null>(null);
  const [signatories, setSignatories] = useState<DocumentSignatory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [signing, setSigning] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  const documentId = params?.id as string;

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const userProfile = await authService.getCurrentUser();
        if (userProfile.success) {
          setCurrentUserId(userProfile.data?.id || null);
        }
      } catch (err: any) {
        console.error('Erro ao carregar perfil do usuário:', err.message || err);
        // Optionally redirect to login if profile cannot be fetched
        // router.push('/login');
      }
    };

    fetchCurrentUser();

    if (documentId) {
      fetchDocument();
      fetchSignatories();
    }
  }, [documentId]);

  const calculateAllocations = (allocations: Document['allocations'], totalValue: number | null) => {
    const totalAllocated = allocations?.reduce((total, allocation) => total + Number(allocation.valor), 0) || 0;
    const percentualDistribuido = totalValue ? (totalAllocated / Number(totalValue)) * 100 : 0;

    return {
      totalItems: allocations?.length || 0,
      totalValor: totalAllocated,
      percentualDistribuido: Math.round(percentualDistribuido * 100) / 100,
      saldoRestante: totalValue ? Number(totalValue) - totalAllocated : 0
    };
  };

  const calculateSignatures = (sigs: DocumentSignatory[]) => {
    const total = sigs?.length || 0;
    const signed = sigs?.filter(sig => sig.status === SignatoryStatus.SIGNED).length || 0;
    const pending = sigs?.filter(sig => sig.status === SignatoryStatus.PENDING).length || 0;
    const rejected = sigs?.filter(sig => sig.status === SignatoryStatus.REJECTED).length || 0;
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
    if (!signatories || signatories.length === 0 || currentUserId === null) return false;
    
    const userSignatory = signatories.find(
      sig => sig.user.id === currentUserId
    );
    
    if (!userSignatory) return false;
    
    if (userSignatory.status === SignatoryStatus.SIGNED) {
      return false;
    }
    
    const pendingSignatories = signatories
      .filter(sig => sig.status === SignatoryStatus.PENDING)
      .sort((a, b) => a.order - b.order);
    
    return pendingSignatories.length > 0 && pendingSignatories[0].id === userSignatory.id;
  };

  const getSigningStatus = () => {
    if (!signatories || signatories.length === 0 || currentUserId === null) return null;
    
    const userSignatory = signatories.find(
      sig => sig.user.id === currentUserId
    );
    
    if (!userSignatory) {
      return { type: 'not_signatory', message: 'Você não é um signatário deste documento' };
    }
    
    if (userSignatory.status === SignatoryStatus.SIGNED) {
      return { type: 'already_signed', message: 'Você já assinou este documento' };
    }
    
    if (userSignatory.status === SignatoryStatus.REJECTED) {
      return { type: 'rejected', message: 'Você rejeitou este documento' };
    }
    
    const pendingSignatories = signatories
      .filter(sig => sig.status === SignatoryStatus.PENDING)
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
      const token = localStorage.getItem("token"); // Ou de onde seu ApiService obtém o token
      if (token) {
        try {
          const [, payloadBase64] = token.split(".");
          const decodedPayload = JSON.parse(atob(payloadBase64));
          console.log("Payload do JWT:", decodedPayload);
        } catch (e) {
          console.error("Erro ao decodificar JWT:", e);
        }
      } else {
        console.log("Token JWT não encontrado no localStorage.");
      }

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

  const formatInstallments = (installments: Document['installments']) => {
    if (!installments || !Array.isArray(installments)) return [];
    return installments.map(installment => ({
      ...installment,
      formattedDueDate: format(formatUTCDateToUserTimezone(installment.dueDate), 'dd/MM/yyyy'),
      formattedAmount: formatCurrency(Number(installment.amount) * 100)
    }));
  };

  const getPdfUrl = () => {
    if (!document?.id) return null;

    return `/api/proxy/documents/${document.id}`;
  };

  const handleDownload = async () => {
    if (!document?.id || downloading) return;
    
    setDownloading(true);
    try {
      await documentService.downloadDocument(document.id, document.file.fileName || 'documento.pdf');
      
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

  const fetchDocument = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await documentService.getDocumentById(documentId);

      // const response = await ApiService.get(`/documents/${documentId}`) as ApiResponse<Document>;

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
      const response = await documentService.getDocumentSignatories(+documentId);

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
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Carregando documento...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !document) {
    return (
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
    );
  }

  const getDocumentTitle = () => {
    return document.title || document.file.fileName || 'Documento sem título';
  };

  const signatureStats = calculateSignatures(signatories);
  const signingStatus = getSigningStatus();
  const pdfUrl = getPdfUrl();

  return (
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
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        {/* Coluna Principal: Visualização do PDF */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {getDocumentTitle()}
            </CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
              <User className="h-4 w-4" />
              <span>{document.owner?.name || 'Desconhecido'}</span>
              <Separator orientation="vertical" className="h-4" />
              <Calendar className="h-4 w-4" />
              <span>Criado {formatDistanceToNow(new Date(document.createdAt), { addSuffix: true, locale: ptBR })}</span>
            </div>
          </CardHeader>
          <CardContent>
            {pdfUrl ? (
              <div className="w-full h-[960px] bg-gray-100 rounded-md overflow-hidden">
                <iframe src={pdfUrl} className="w-full h-full border-none"></iframe>
              </div>
            ) : (
              <div className="flex items-center justify-center h-[600px] bg-gray-100 rounded-md text-muted-foreground">
                <p>Visualização do PDF não disponível.</p>
              </div>
            )}
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={handleDownload} disabled={downloading}>
                {downloading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                Download
              </Button>
              <Button variant="outline" onClick={handleViewPdf}>
                <Eye className="h-4 w-4 mr-2" />
                Abrir PDF
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Coluna Lateral: Detalhes do Documento e Signatários */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Detalhes do Documento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Descrição</p>
                <p className="text-base">{document.description || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tipo</p>
                <p className="text-base">{document.tipoDocumento ? documentTypeLabels[document.tipoDocumento] : 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                {getStatusBadge(document.status)}
              </div>
              {document.valor && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Valor</p>
                  <p className="text-base">{formatCurrency(Number(document.valor) * 100)}</p>
                </div>
              )}
              {document.dataVencimento && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Data de Vencimento</p>
                  <p className="text-base">{new Date(document.dataVencimento).toLocaleDateString('pt-BR')}</p>
                </div>
              )}
              {document.fornecedor && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Fornecedor</p>
                  <p className="text-base">{document.fornecedor.razaoSocial}</p>
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tamanho do Arquivo</p>
                <p className="text-base">{formatBytes(document.file.fileSize)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Hash do Arquivo</p>
                <p className="text-base break-all font-mono text-xs">{document.file.fileHash}</p>
              </div>
              {document.observacoes && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Observações</p>
                  <p className="text-base">{document.observacoes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Card de Signatários */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Signatários
              </CardTitle>
            </CardHeader>
            <CardContent>
              {signatories.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Progresso:</span>
                    <span className="font-semibold">{signatureStats.assinadas}/{signatureStats.total} ({signatureStats.progresso}%)</span>
                  </div>
                  <Progress value={signatureStats.progresso} className="w-full" />
                  
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ordem</TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {signatories.sort((a, b) => a.order - b.order).map((sig) => (
                        <TableRow key={sig.id} className={sig.user.id === currentUserId ? 'bg-blue-50' : ''}>
                          <TableCell>{sig.order}</TableCell>
                          <TableCell>{sig.user.name}</TableCell>
                          <TableCell>{renderSignatureStatusBadge(sig.status)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {signingStatus && (
                    <div className="mt-4">
                      {signingStatus.type === 'can_sign' && (
                        <Button onClick={handleSign} disabled={signing} className="w-full">
                          {signing ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <PenTool className="h-4 w-4 mr-2" />
                          )}
                          Assinar Documento
                        </Button>
                      )}
                      {signingStatus.type !== 'can_sign' && (
                        <Alert>
                          <AlertCircle className="h-4 w-4" />
                          <AlertTitle>Status de Assinatura</AlertTitle>
                          <AlertDescription>
                            {signingStatus.message}
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhum signatário encontrado para este documento.</p>
              )}
            </CardContent>
          </Card>

          {/* Card de Parcelas (se houver) */}
          {document.installments && document.installments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5" />
                  Parcelas
                </CardTitle>
              </CardHeader>
              <CardContent>
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
                        <TableCell>{getStatusInstallmentBadge(installment.isPaid)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Card de Rateio (se houver) */}
          {document.allocations && document.allocations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Rateio
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Total de Itens:</span>
                    <span className="font-semibold">{calculateAllocations(document.allocations, document.valor).totalItems}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Valor Total Alocado:</span>
                    <span className="font-semibold">{formatCurrency(calculateAllocations(document.allocations, document.valor).totalValor * 100)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>% Distribuído:</span>
                    <span className="font-semibold">{calculateAllocations(document.allocations, document.valor).percentualDistribuido}%</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Saldo Restante:</span>
                    <span className="font-semibold">{formatCurrency(calculateAllocations(document.allocations, document.valor).saldoRestante)}</span>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Filial</TableHead>
                        <TableHead>Centro de Custo</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>%</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {document.allocations.map((allocation, index) => (
                        <TableRow key={index}>
                          <TableCell>{allocation.filial}</TableCell>
                          <TableCell>{allocation.centroCusto}</TableCell>
                          <TableCell>{formatCurrency(Number(allocation.valor) * 100)}</TableCell>
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
      </motion.div>
    </div>
  );
}


