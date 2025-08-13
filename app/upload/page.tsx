"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, FileText, X, Plus, Loader2, Trash2, Calendar } from "lucide-react";
import { ApiService } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import SignatoriesSection from "@/components/upload/SignatoriesSection";
import SupplierSection from "@/components/upload/SupplierSection";
import InstallmentsSection from "@/components/upload/InstallmentsSection";
import { Supplier, InstallmentPlan } from "@/lib/types";

interface Signatory {
  id: string;
  userId: string;
  email: string;
  name: string;
  order: number;
}

interface RateioItem {
  id: string;
  filial: string;
  centroCusto: string;
  valor: number;
  percentual: number;
}

// Enum alinhado com o backend
const DocumentType = {
  CONTRATO: 'CONTRACT',
  FATURA: 'INVOICE',
  ORDEM_SERVICO: 'SERVICE_ORDER',
  ORDEM_COMPRA: 'PURCHASE_ORDER',
  NOTA_FISCAL: 'INVOICE',
  RECIBO: 'RECEIPT',
  RELATORIO: 'REPORT',
  OUTRO: 'OTHER'
} as const;

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tipoDocumento, setTipoDocumento] = useState<keyof typeof DocumentType>("FATURA");
  const [natureza, setNatureza] = useState("");
  const [valor, setValor] = useState<number>(0);
  const [quantidadeParcelas, setQuantidadeParcelas] = useState<number>(1);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [installments, setInstallments] = useState<InstallmentPlan[]>([]);
  const [rateioItems, setRateioItems] = useState<RateioItem[]>([]);
  const [rateioForm, setRateioForm] = useState({
    filial: "",
    centroCusto: "",
    valor: 0
  });
  const [signatories, setSignatories] = useState<Signatory[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const { toast } = useToast();

  // Opções para os selects
  const tiposDocumento = [
    { label: "Fatura", value: "FATURA", backendValue: DocumentType.FATURA },
    { label: "Nota Fiscal", value: "NOTA_FISCAL", backendValue: DocumentType.NOTA_FISCAL },
    { label: "Contrato", value: "CONTRATO", backendValue: DocumentType.CONTRATO },
    { label: "Recibo", value: "RECIBO", backendValue: DocumentType.RECIBO },
    { label: "Ordem de Serviço", value: "ORDEM_SERVICO", backendValue: DocumentType.ORDEM_SERVICO },
    { label: "Ordem de Compra", value: "ORDEM_COMPRA", backendValue: DocumentType.ORDEM_COMPRA },
    { label: "Relatório", value: "RELATORIO", backendValue: DocumentType.RELATORIO },
    { label: "Outro", value: "OUTRO", backendValue: DocumentType.OUTRO }
  ];

  const filiais = [
    "Matriz Juazeiro",
    "Filial Petrolina Maquinas", 
    "Filial Petrolina Insumos",
    "Filial Irece",
    "Filial Itabaiana"
  ];

  const centrosCusto = [
    "Administrativo",
    "Vendas",
    "Operações",
    "TI",
    "Financeiro",
    "OFICINA"
  ];

  useEffect(() => {
    if (valor > 0 && quantidadeParcelas > 0) {
      const baseAmount = Math.floor((valor * 100) / quantidadeParcelas) / 100;
      const remainder = Math.round((valor - (baseAmount * quantidadeParcelas)) * 100) / 100;
      
      const newInstallments: InstallmentPlan[] = Array.from({ length: quantidadeParcelas }, (_, index) => {
        const dueDate = new Date();
        dueDate.setMonth(dueDate.getMonth() + index + 1);
        
        let amount = baseAmount;
        if (index === 0) {
          amount += remainder;
        }
        
        return {
          installmentNumber: index + 1,
          dueDate: dueDate.toISOString().split('T')[0],
          amount: Math.round(amount * 100) / 100
        };
      });
      
      if (installments.length !== quantidadeParcelas) {
        setInstallments(newInstallments);
      }
    } else {
      setInstallments([]);
    }
  }, [valor, quantidadeParcelas]);

  const calcularPercentual = (valorItem: number): number => {
    if (valor === 0) return 0;
    return (valorItem / valor) * 100;
  };

  const getTotalDistribuido = (): number => {
    return rateioItems.reduce((total, item) => total + item.valor, 0);
  };

  const adicionarRateio = () => {
    if (!rateioForm.filial || !rateioForm.centroCusto || rateioForm.valor <= 0) {
      setError("Preencha todos os campos do rateio.");
      return;
    }

    const totalAtual = getTotalDistribuido();
    if (totalAtual + rateioForm.valor > valor) {
      setError("O valor do rateio excede o valor total do documento.");
      return;
    }

    const novoItem: RateioItem = {
      id: Date.now().toString(),
      filial: rateioForm.filial,
      centroCusto: rateioForm.centroCusto,
      valor: rateioForm.valor,
      percentual: calcularPercentual(rateioForm.valor)
    };

    setRateioItems([...rateioItems, novoItem]);
    setRateioForm({ filial: "", centroCusto: "", valor: 0 });
    setError("");
  };

  const removerRateio = (id: string) => {
    setRateioItems(rateioItems.filter(item => item.id !== id));
  };

  const editarValorRateio = (id: string, novoValor: number) => {
    setRateioItems(items => 
      items.map(item => 
        item.id === id 
          ? { ...item, valor: novoValor, percentual: calcularPercentual(novoValor) }
          : item
      )
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== "application/pdf") {
        setError("Apenas arquivos PDF são permitidos.");
        return;
      }
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError("O arquivo deve ter no máximo 10MB.");
        return;
      }
      setFile(selectedFile);
      setError("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      setError("Selecione um arquivo PDF.");
      return;
    }

    if (!tipoDocumento || !natureza || valor <= 0) {
      setError("Preencha todos os campos obrigatórios.");
      return;
    }

    const validSignatories = signatories.filter(s => s.email && s.name);
    if (validSignatories.length === 0) {
      setError("Adicione pelo menos um signatário.");
      return;
    }

    if (installments.length !== quantidadeParcelas) {
      setError("Configure todas as parcelas.");
      return;
    }

    const totalParcelas = installments.reduce((sum, inst) => sum + (inst.amount || 0), 0);
    const diferenca = Math.abs(valor - totalParcelas);
    if (diferenca > 0.01) {
      setError("O total das parcelas deve ser igual ao valor do documento.");
      return;
    }

    const parcelasSemData = installments.filter(inst => !inst.dueDate || inst.dueDate.trim() === "");
    if (parcelasSemData.length > 0) {
      setError("Preencha todas as datas de vencimento das parcelas.");
      return;
    }

    if (rateioItems.length > 0) {
      const totalDistribuido = getTotalDistribuido();
      if (totalDistribuido !== valor) {
        setError("O valor total do rateio deve ser igual ao valor do documento.");
        return;
      }
    }

    setUploading(true);
    setError("");

    try {
      const signatoriesData = validSignatories.map(s => ({
        userId: null,
        email: s.email,
        name: s.name,
        order: s.order
      }));

      const documentData = {
        title: title || file.name,
        description,
        tipoDocumento: DocumentType[tipoDocumento],
        natureza,
        valor,
        quantidadeParcelas,
        supplier: selectedSupplier ? {
          id: selectedSupplier.id,
          code: selectedSupplier.code,
          cnpj: selectedSupplier.cnpj,
          companyName: selectedSupplier.companyName,
          tradeName: selectedSupplier.tradeName
        } : null,
        installments: installments.map(inst => ({
          installmentNumber: inst.installmentNumber,
          dueDate: inst.dueDate,
          amount: inst.amount
        })),
        rateio: rateioItems,
        signatories: signatoriesData
      };
 console.log('Dados sendo enviados:', JSON.stringify(documentData, null, 2));
      await ApiService.uploadFile("/documents/upload", file, documentData);

      toast({
        title: "Documento enviado com sucesso",
        description: "O documento foi enviado e os signatários serão notificados.",
      });

      router.push("/documentos");
    } catch (err: any) {
      setError(err.message || "Erro ao enviar documento. Tente novamente.");
      toast({
        title: "Erro no upload",
        description: "Não foi possível enviar o documento. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Upload de Documento</h1>
            <p className="text-gray-600">
              Envie um documento PDF para coleta de assinaturas
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Arquivo</CardTitle>
                <CardDescription>
                  Selecione o arquivo PDF que precisa ser assinado
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-8 h-8 mb-4 text-gray-500" />
                        <p className="mb-2 text-sm text-gray-500">
                          <span className="font-semibold">Clique para enviar</span> ou arraste e solte
                        </p>
                        <p className="text-xs text-gray-500">PDF (MAX. 10MB)</p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf"
                        onChange={handleFileChange}
                        disabled={uploading}
                      />
                    </label>
                  </div>
                  
                  {file && (
                    <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                      <FileText className="h-5 w-5 text-blue-600" />
                      <span className="text-sm text-blue-800">{file.name}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setFile(null)}
                        disabled={uploading}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Detalhes do Documento</CardTitle>
                <CardDescription>
                  Informações sobre o documento (opcionais)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">Título</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Título do documento (opcional)"
                    disabled={uploading}
                  />
                </div>
                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Descrição ou instruções (opcional)"
                    disabled={uploading}
                  />
                </div>
              </CardContent>
            </Card>

            <SupplierSection
              selectedSupplier={selectedSupplier}
              onSupplierChange={setSelectedSupplier}
              disabled={uploading}
            />

            <Card>
              <CardHeader>
                <CardTitle>Informações Financeiras</CardTitle>
                <CardDescription>
                  Dados financeiros e de classificação do documento
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="tipoDocumento">Tipo de Documento *</Label>
                    <Select 
                      value={tipoDocumento}
                      onValueChange={(value) => setTipoDocumento(value as keyof typeof DocumentType)}
                      disabled={uploading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        {tiposDocumento.map((tipo) => (
                          <SelectItem key={tipo.value} value={tipo.value}>
                            {tipo.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="natureza">Natureza *</Label>
                    <Input
                      id="natureza"
                      value={natureza}
                      onChange={(e) => setNatureza(e.target.value)}
                      placeholder="Ex: Despesa operacional"
                      disabled={uploading}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="valor">Valor Total (R$) *</Label>
                    <Input
                      id="valor"
                      type="number"
                      step="0.01"
                      min="0"
                      value={valor}
                      onChange={(e) => setValor(Number(e.target.value))}
                      placeholder="0,00"
                      disabled={uploading}
                    />
                  </div>
                  <div>
                    <Label htmlFor="parcelas">Quantidade de Parcelas *</Label>
                    <Input
                      id="parcelas"
                      type="number"
                      min="1"
                      max="12"
                      value={quantidadeParcelas}
                      onChange={(e) => setQuantidadeParcelas(Number(e.target.value))}
                      disabled={uploading}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <InstallmentsSection
              totalAmount={valor}
              installments={installments}
              onInstallmentsChange={setInstallments}
              disabled={uploading}
            />

            <Card>
              <CardHeader>
                <CardTitle>Rateio</CardTitle>
                <CardDescription>
                  Distribua o valor do documento entre filiais e centros de custo
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Total do Documento:</span>
                      <span className="ml-2 text-blue-600 font-semibold">
                        R$ {valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">Total Distribuído:</span>
                      <span className="ml-2 text-green-600 font-semibold">
                        R$ {getTotalDistribuido().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4 items-end p-4 border rounded-lg bg-gray-50">
                  <div>
                    <Label>Filial</Label>
                    <Select 
                      value={rateioForm.filial || ""} 
                      onValueChange={(value) => setRateioForm({...rateioForm, filial: value})}
                      disabled={uploading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione Filial" />
                      </SelectTrigger>
                      <SelectContent>
                        {filiais.map((filial) => (
                          <SelectItem key={filial} value={filial}>
                            {filial}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>Centro de Custo</Label>
                    <Select 
                      value={rateioForm.centroCusto || ""} 
                      onValueChange={(value) => setRateioForm({...rateioForm, centroCusto: value})}
                      disabled={uploading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Centro de Custo" />
                      </SelectTrigger>
                      <SelectContent>
                        {centrosCusto.map((centro) => (
                          <SelectItem key={centro} value={centro}>
                            {centro}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>Valor (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={rateioForm.valor}
                      onChange={(e) => setRateioForm({...rateioForm, valor: Number(e.target.value)})}
                      placeholder="0,00"
                      disabled={uploading}
                    />
                  </div>
                  
                  <Button
                    type="button"
                    onClick={adicionarRateio}
                    disabled={uploading}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {rateioItems.length > 0 && (
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Filial
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Centro de Custo
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Percentual
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Valor Lançamento
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Ações
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {rateioItems.map((item) => (
                          <tr key={item.id}>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                              {item.filial}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                              {item.centroCusto}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                              {item.percentual.toFixed(2)}%
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={item.valor}
                                onChange={(e) => editarValorRateio(item.id, Number(e.target.value))}
                                disabled={uploading}
                                className="w-32 text-right"
                              />
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removerRateio(item.id)}
                                disabled={uploading}
                                className="text-red-600 hover:text-red-800"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                        {rateioItems.length > 0 && (
                          <tr className="bg-gray-50 font-semibold">
                            <td className="px-4 py-4 text-sm text-gray-900" colSpan={2}>
                              TOTAIS
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-900">
                              {valor > 0 ? ((getTotalDistribuido() / valor) * 100).toFixed(2) : 0}%
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-900">
                              R$ {getTotalDistribuido().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-900">
                              -
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            <SignatoriesSection
              signatories={signatories}
              onSignatoriesChange={setSignatories}
              disabled={uploading}
            />

            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={uploading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={uploading} className="flex-1">
                {uploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Enviar Documento
                  </>
                )}
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </MainLayout>
  );
}