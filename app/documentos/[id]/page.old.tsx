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
  PieChart
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

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Informações Básicas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {document.description && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Descrição</label>
                      <p className="mt-1">{document.description}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Nome do Arquivo</label>
                      <p className="mt-1">{document.fileName}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Tamanho do Arquivo</label>
                      <p className="mt-1">{formatBytes(document.fileSize)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Tipo MIME</label>
                      <p className="mt-1">{document.mimeType}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Proprietário</label>
                      <p className="mt-1 flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {document.owner.name} ({document.owner.email})
                      </p>
                    </div>
                    {document.fornecedor && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Fornecedor</label>
                        <p className="mt-1 flex items-center gap-2">
                          <Building className="h-4 w-4" />
                          {document.fornecedor.name} ({document.fornecedor.email})
                        </p>
                      </div>
                    )}
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Hash do Arquivo</label>
                      <p className="mt-1 font-mono text-xs">{document.fileHash}</p>
                    </div>
                  </div>
                  {document.observacoes && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Observações</label>
                      <p className="mt-1">{document.observacoes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {(document.tipoDocumento || document.valor) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5" />
                      Dados Financeiros
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {document.tipoDocumento && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Tipo de Documento</label>
                          <p className="mt-1">{document.tipoDocumento}</p>
                        </div>
                      )}
                      {document.valor && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Valor Total</label>
                          <p className="mt-1 text-lg font-semibold text-green-600">
                            {formatCurrency(document.valor)}
                          </p>
                        </div>
                      )}
                      {document.dataVencimento && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Data de Vencimento</label>
                          <p className="mt-1 flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(document.dataVencimento).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    {document.installments && document.installments.length > 0 && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Parcelas ({document.installments.length})
                        </label>
                        <div className="mt-2 space-y-2">
                          {formatInstallments(document.installments).map((installment) => (
                            <div key={installment.id} className="flex items-center justify-between p-2 rounded border">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">
                                  {installment.installmentNumber}ª parcela
                                </Badge>
                                <span className="text-sm">
                                  Vencimento: {installment.formattedDueDate}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold">{installment.formattedAmount}</span>
                                {getStatusBadge(installment.status)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {document.allocations && document.allocations.length > 0 && (() => {
              const allocationSummary = calculateAllocations(document.allocations, document.valor);
              return (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          <PieChart className="h-5 w-5" />
                          Rateio ({allocationSummary.totalItems} {allocationSummary.totalItems === 1 ? 'item' : 'itens'})
                        </CardTitle>
                        <Badge variant="outline">
                          {allocationSummary.percentualDistribuido.toFixed(1)}% Distribuído
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Filial</TableHead>
                              <TableHead>Centro de Custo</TableHead>
                              <TableHead className="text-right">Valor</TableHead>
                              <TableHead className="text-right">%</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {document.allocations.map((allocation) => (
                              <TableRow key={allocation.id}>
                                <TableCell className="font-medium">{allocation.filial}</TableCell>
                                <TableCell>{allocation.centroCusto}</TableCell>
                                <TableCell className="text-right font-mono">
                                  {formatCurrency(allocation.valor)}
                                </TableCell>
                                <TableCell className="text-right font-mono">
                                  {allocation.percentual.toFixed(1)}%
                                </TableCell>
                              </TableRow>
                            ))}
                            <TableRow className="border-t-2">
                              <TableCell colSpan={2} className="font-semibold">
                                Total Distribuído
                              </TableCell>
                              <TableCell className="text-right font-semibold">
                                {formatCurrency(allocationSummary.totalValor)}
                              </TableCell>
                              <TableCell className="text-right font-semibold">
                                {allocationSummary.percentualDistribuido.toFixed(1)}%
                              </TableCell>
                            </TableRow>
                            {allocationSummary.saldoRestante > 0 && (
                              <TableRow>
                                <TableCell colSpan={2} className="text-muted-foreground">
                                  Saldo Restante
                                </TableCell>
                                <TableCell className="text-right text-amber-600 font-semibold">
                                  {formatCurrency(allocationSummary.saldoRestante)}
                                </TableCell>
                                <TableCell className="text-right text-muted-foreground">
                                  {(100 - allocationSummary.percentualDistribuido).toFixed(1)}%
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })()}
          </div>

          <div className="space-y-6">
            {document.signatories && document.signatories.length > 0 && (() => {
              const signatureSummary = calculateSignatures(document.signatories);
              return (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Signatários ({signatureSummary.total})
                      </CardTitle>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progresso</span>
                          <span>{signatureSummary.progresso.toFixed(0)}%</span>
                        </div>
                        <Progress value={signatureSummary.progresso} className="h-2" />
                        <div className="flex gap-4 text-xs text-muted-foreground">
                          <span>✓ {signatureSummary.assinadas} assinadas</span>
                          <span>⏳ {signatureSummary.pendentes} pendentes</span>
                          {signatureSummary.rejeitadas > 0 && (
                            <span>✗ {signatureSummary.rejeitadas} rejeitadas</span>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {document.signatories
                        ?.sort((a, b) => a.order - b.order)
                        .map((signatory) => (
                          <div 
                            key={signatory.id} 
                            className="flex items-center gap-3 p-3 rounded-lg border bg-card/50"
                          >
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                              {signatory.order}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{signatory.user.name}</p>
                              <p className="text-sm text-muted-foreground truncate">
                                {signatory.user.email}
                              </p>
                              {signatory.signedAt && (
                                <p className="text-xs text-muted-foreground">
                                  Assinado em {formatDistanceToNow(new Date(signatory.signedAt), { 
                                    addSuffix: true, 
                                    locale: ptBR 
                                  })}
                                </p>
                              )}
                            </div>
                            <div className="flex-shrink-0">
                              {getSignatureStatusBadge(signatory.status)}
                            </div>
                          </div>
                        ))}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })()}

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Receipt className="h-5 w-5" />
                    Resumo
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <span>{getStatusBadge(document.status)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Criado:</span>
                    <span className="text-sm">
                      {new Date(document.createdAt).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Atualizado:</span>
                    <span className="text-sm">
                      {new Date(document.updatedAt).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  {document.valor && (
                    <>
                      <Separator />
                      <div className="flex justify-between font-semibold">
                        <span>Valor Total:</span>
                        <span className="text-green-600">
                          {formatCurrency(document.valor)}
                        </span>
                      </div>
                    </>
                  )}
                  {document.installments && document.installments.length > 1 && (
                    <>
                      <Separator />
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Parcelas:</span>
                        <span className="text-sm">{document.installments.length}x</span>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}