"use client";

import { documentService } from "@/lib/data/document";
import { uploadFile } from "@/lib/data/files";
import { DocumentInstallment } from "@/types/document-installment.type";
import { Document } from "@/types/document.type";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { useSession } from "next-auth/react";
import { useCallback, useState } from "react";
import { Control, useForm, UseFormHandleSubmit } from "react-hook-form";
import { z } from "zod";
import { useToast } from "./use-toast";

interface UseInstallmentsDocumentsProps {
  initialData: Document[];
}

interface UseInstallmentsDocumentsResult {
  documentsInstallments: Document[];
  loading: boolean;
  error: string | null;
  formIsSubmitting: boolean
  installmentForPayment: DocumentInstallment | null;
  control: Control<{
    installmentId: number;
    documentId: number;
    date: Date;
    proof: File;
}, any>
  handleSubmit: UseFormHandleSubmit<{
    installmentId: number;
    documentId: number;
    date: Date;
    proof: File;
}, undefined>
  setInstallmentPayment: (installment: DocumentInstallment | null) => void;
  handleInstallmentPaymentSubmit: (data: InstallmentPaymentFormData) => void;
  refreshData: () => Promise<void>;
}

const installmentPaymentFormSchema = z.object({
  installmentId: z.number({ message: "O ID da parcela precisa ser um número" }),
  documentId: z.number({ message: "O ID do documento precisa ser um número" }),
  date: z.date({ message: "A data precisa ser do tipo Date" }),
  proof: z.instanceof(File).refine((file) => [
    "application/pdf",
    "image/png",
    "image/jpeg",
    "image/jpg",
  ].includes(file.type),
  { message: 'Comprovante com tipo de arquivo inválido' }
)
});

export type InstallmentPaymentFormData = z.infer<typeof installmentPaymentFormSchema>

export function useInstallmentsDocuments({ initialData }: UseInstallmentsDocumentsProps): UseInstallmentsDocumentsResult {
  const { data: session } = useSession();
  const { toast } = useToast();

  const [documentsInstallments, setDocumentsInstallments] = useState<Document[]>(initialData);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [installmentForPayment, setInstallmentForPayment] = useState<DocumentInstallment | null>(null);

  const { control, handleSubmit, watch, setValue, formState: { isSubmitting }, reset } = useForm<InstallmentPaymentFormData>({
    resolver: zodResolver(installmentPaymentFormSchema),
  });

  const refreshData = useCallback(async () => {
    if (!session?.accessToken) {
      setError("Sessão não autenticada para atualizar dados.");
      toast({
        title: "Erro de Autenticação",
        description: "Sua sessão expirou ou não está ativa. Por favor, faça login novamente.",
        duration: 4000,
        variant: "destructive",
      });

      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { success, data } = await documentService.getInstallmentsForExpiredAndUpcomingDocuments({
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
        },
      });
  
      if (success && data) {
        setDocumentsInstallments(data);
        toast({
          title: "Dados Atualizados",
          description: "O dashboard foi atualizado com sucesso.",
          duration: 4000,
          variant: "default",
        });
      } else {
        // Trata o erro retornado pelo ApiResponse
        const errorMessage = "Não foi possível atualizar os dados das parcelas dos documentos.";
        setError(errorMessage);
        toast({
          title: "Erro ao Atualizar",
          description: errorMessage,
          duration: 4000,
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Erro ao atualizar dados do dashboard (cliente):", err);
      setError((err as Error).message || "Ocorreu um erro inesperado ao atualizar o dashboard.");
      toast({
        title: "Erro Inesperado",
        description: (err as Error).message || "Verifique sua conexão e tente novamente.",
        duration: 4000,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
    }, [session, toast]);

  const setInstallmentPayment = (installment: DocumentInstallment | null) => {
    setInstallmentForPayment(installment);
    if (installment) {
      setValue('installmentId', installment?.id);
      setValue('documentId', installment?.documentId);
    } else {
      reset();
    } 
  }
  
  const handleInstallmentPaymentSubmit = async (data: InstallmentPaymentFormData) => {
    try {
      const fileUploaded = await uploadFile(data.proof);

      if (fileUploaded.success === false || !fileUploaded.data) {
        toast({
          title: "Erro ao fazer upload do arquivo.",
          description: fileUploaded.message || "Não foi possível enviar o arquivo. Tente novamente.",
          duration: 4000,
          variant: "destructive",
        });

        return;
      }

      const body = {
        fileId: fileUploaded.data.id,
        paymentDate: format(data.date, 'yyyy-MM-dd'),
      }
      const response = await documentService.payInstallment(data.documentId, data.installmentId, body);

      if (response.success) {
        toast({
          title: response.data?.message,
          duration: 4000
        });

        setInstallmentForPayment(null);
        await refreshData();
      }
    } catch (error) {
      toast({
        title: "Erro ao processar pagamento da parcela.",
        description: (error as Error).message || "Ocorreu um erro inesperado. Tente novamente.",
        duration: 4000,
        variant: "destructive",
      });
      console.error("Erro ao processar pagamento da parcela:", error);
    }
  }

  return {
    error,
    loading,
    formIsSubmitting: isSubmitting,
    documentsInstallments,
    installmentForPayment,
    control,
    refreshData,
    setInstallmentPayment,
    handleInstallmentPaymentSubmit,
    handleSubmit,
  };
} 
