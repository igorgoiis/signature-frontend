"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import SignatoriesSection from "@/components/upload/SignatoriesSection";
import SupplierSection from "@/components/upload/SupplierSection";
import InstallmentsSection from "@/components/upload/InstallmentsSection";
import { Supplier, InstallmentPlan, DocumentType } from "@/lib/types";
import RateioSection from "@/components/upload/RateioSection";
import DocumentTypeSelect from "@/components/upload/DocumentTypeSelect";
import FileUploadSection from "@/components/upload/FileUploadSection";
import { formatCurrency, unformatCurrency } from "@/lib/utils";
import { documentService } from "@/lib/data/document";
import { uploadFile } from "@/lib/data/files";
import { CreateDocumentDTO, DocumentNature } from "@/types/document.type";
import DocumentNatureSelect from "@/components/upload/DocumentNatureSelect";

// Definir o esquema de validação com Zod
const formSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  tipoDocumento: z.nativeEnum(DocumentType, {
    required_error: "O tipo de documento é obrigatório",
  }),
  natureza: z.nativeEnum(DocumentNature, {
    required_error: "A natureza do documento é obrigatória"
  }),
  valor: z.number().positive("O valor deve ser maior que zero"),
  quantidadeParcelas: z.number().int().min(1, "Informe no mínimo 1 parcela").max(12, "Máximo de 12 parcelas"),
});

type FormValues = z.infer<typeof formSchema>;

interface Signatory {
  id: string;
  userId: number;
  email: string;
  name: string;
  order: number;
}

interface RateioItem {
  id: number;
  filial: string;
  centroCusto: string;
  valor: number;
  percentual: number;
}

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [installments, setInstallments] = useState<InstallmentPlan[]>([]);
  const [rateioItems, setRateioItems] = useState<RateioItem[]>([]);
  const [signatories, setSignatories] = useState<Signatory[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const { toast } = useToast();

  // Inicializar o formulário com useForm
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      tipoDocumento: undefined,
      natureza: undefined,
      valor: 0,
      quantidadeParcelas: 1,
    },
  });

  const { watch, setValue } = form;
  const watchedValor = watch("valor");
  const watchedQuantidadeParcelas = watch("quantidadeParcelas");

  // Efeito para recalcular as parcelas quando o valor ou quantidade de parcelas mudar
  const recalculateInstallments = () => {
    const value = watchedValor / 100; // Convertendo centavos para reais
    const numberInstallments = watchedQuantidadeParcelas;
    if (value > 0 && numberInstallments > 0) {
      const baseAmount = Math.floor((value * 100) / numberInstallments) / 100;
      const remainder = Math.round((value - (baseAmount * numberInstallments)) * 100) / 100;
      
      const newInstallments: InstallmentPlan[] = Array.from({ length: numberInstallments }, (_, index) => {
        const dueDate = new Date();
        dueDate.setMonth(dueDate.getMonth() + index + 1);
        
        let amount = baseAmount;
        if (index === 0) {
          amount += remainder;
        }
        
        return {
          installmentNumber: index + 1,
          dueDate: dueDate.toISOString().split('T')[0],
          amount: Math.round(amount * 100)
        };
      });
      
      setInstallments(newInstallments);
    } else {
      setInstallments([]);
    }
  };

  // Calcula o total distribuído no rateio
  const getTotalDistribuido = (): number => {
    return rateioItems.reduce((total, item) => total + item.valor, 0);
  };

  // Validações adicionais antes de enviar o formulário
  const validateSubmission = (): boolean => {
    // Validar arquivo
    if (!file) {
      setError("Selecione um arquivo PDF.");
      return false;
    }

    // Validar signatários
    const validSignatories = signatories.filter(s => s.email && s.name);
    if (validSignatories.length === 0) {
      setError("Adicione pelo menos um signatário.");
      return false;
    }

    // Validar parcelas
    if (installments.length !== watchedQuantidadeParcelas) {
      setError("Configure todas as parcelas.");
      return false;
    }

    const totalParcelas = installments.reduce((sum, inst) => sum + (inst.amount || 0), 0);
    const diferenca = Math.abs(watchedValor - totalParcelas);
    if (diferenca > 0.01) {
      setError("O total das parcelas deve ser igual ao valor do documento.");
      return false;
    }

    const parcelasSemData = installments.filter(inst => !inst.dueDate || inst.dueDate.trim() === "");
    if (parcelasSemData.length > 0) {
      setError("Preencha todas as datas de vencimento das parcelas.");
      return false;
    }

    // Validar rateio
    if (rateioItems.length > 0) {
      const totalDistribuido = getTotalDistribuido();
      if (Math.abs(totalDistribuido - watchedValor) > 0.01) {
        setError("O valor total do rateio deve ser igual ao valor do documento.");
        return false;
      }
    }

    return true;
  };

  // Função para lidar com o envio do formulário
  const onSubmit = async (data: FormValues) => {
    if (!validateSubmission()) {
      return;
    }

    setUploading(true);
    setError("");

    try {
      if (!file) {
        setError("Selecione um arquivo PDF.");
        return false;
      }

      const fileUploaded = await uploadFile(file);

      if (fileUploaded.success === false || !fileUploaded.data) {
        toast({
          title: "Erro ao fazer upload do arquivo.",
          description: fileUploaded.message || "Não foi possível enviar o arquivo. Tente novamente.",
          variant: "destructive",
        });

        return;
      }

      const documentData = {
        fileId: fileUploaded.data.id,
        title: data.title || file?.name || "",
        description: data.description,
        fornecedorId: selectedSupplier ? +selectedSupplier.id : undefined,
        tipoDocumento: DocumentType[data.tipoDocumento],
        natureza: data.natureza,
        valor: +(data.valor / 100).toFixed(2),
        signatories: signatories
        .filter(s => s.email && s.name)
        .map(s => ({
          userId: s.userId,
          order: s.order
        })),
        installments: installments.map(inst => ({
          installmentNumber: inst.installmentNumber,
          dueDate: inst.dueDate,
          amount: +(inst.amount / 100).toFixed(2),
        })),
        rateio: rateioItems.map(item => ({
          id: item.id,
          filial: item.filial,
          centroCusto: item.centroCusto,
          valor: +(item.valor / 100).toFixed(2),
          percentual: item.percentual
        })),
      } satisfies CreateDocumentDTO;

      const documentCreated = await documentService.processDocument(documentData);

      if (!documentCreated.success) {
        toast({
          title: "Erro ao criar documento.",
          description: documentCreated.message || "Não foi possível criar o documento. Tente novamente.",
          variant: "destructive",
        });

        return;
      }

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

  useEffect(() => {
    recalculateInstallments();
  }, [watchedValor, watchedQuantidadeParcelas]);

  return (
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

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Seção de Upload de Arquivo */}
            <FileUploadSection 
              file={file} 
              setFile={setFile} 
              setError={setError} 
              disabled={uploading} 
            />

            {/* Detalhes do Documento */}
            <Card>
              <CardHeader>
                <CardTitle>Detalhes do Documento</CardTitle>
                <CardDescription>
                  Informações sobre o documento (opcionais)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Título do documento (opcional)"
                          disabled={uploading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Descrição ou instruções (opcional)"
                          disabled={uploading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Seção de Fornecedor */}
            <SupplierSection
              selectedSupplier={selectedSupplier}
              onSupplierChange={setSelectedSupplier}
              disabled={uploading}
            />

            {/* Informações Financeiras */}
            <Card>
              <CardHeader>
                <CardTitle>Informações Financeiras</CardTitle>
                <CardDescription>
                  Dados financeiros e de classificação do documento
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="tipoDocumento"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Documento *</FormLabel>
                        <FormControl>
                          <DocumentTypeSelect 
                            value={field.value}
                            onValueChange={field.onChange}
                            disabled={uploading}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="natureza"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Natureza *</FormLabel>
                        <FormControl>
                          <DocumentNatureSelect
                            value={field.value}
                            onValueChange={field.onChange}
                            disabled={uploading}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="valor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valor Total (R$) *</FormLabel>
                        <FormControl>
                          <Input
                            type="text"
                            {...field}
                            value={formatCurrency(field.value || 0)}
                            onChange={(e) => {
                              const newValue = unformatCurrency(e.target.value);
                              field.onChange(newValue);
                              setValue("valor", newValue);
                            }}
                            placeholder="0,00"
                            disabled={uploading}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="quantidadeParcelas"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantidade de Parcelas *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            max="12"
                            {...field}
                            onChange={(e) => {
                              const newValue = Number(e.target.value);
                              field.onChange(newValue);
                              setValue("quantidadeParcelas", newValue);
                              // Recalcular parcelas quando a quantidade mudar
                              // setTimeout(recalculateInstallments, 1000);
                            }}
                            disabled={uploading}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Seção de Parcelas */}
            <InstallmentsSection
              totalAmount={watchedValor}
              installments={installments}
              onInstallmentsChange={setInstallments}
              disabled={uploading}
            />

            {/* Seção de Rateio */}
            <RateioSection
              totalValue={watchedValor}
              rateioItems={rateioItems}
              setRateioItems={setRateioItems}
              getTotalDistribuido={getTotalDistribuido}
              disabled={uploading}
            />

            {/* Seção de Signatários */}
            <SignatoriesSection
              signatories={signatories}
              onSignatoriesChange={setSignatories}
              disabled={uploading}
            />

            {/* Botões de Ação */}
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
        </Form>
      </motion.div>
    </div>
  );
}
