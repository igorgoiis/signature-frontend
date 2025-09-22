"use client";

import { documentService } from "@/lib/data/document";
import { uploadFile } from "@/lib/data/files";
import { DocumentInstallment } from "@/types/document-installment.type";
import { Document } from "@/types/document.type";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";
import { Control, useForm, UseFormHandleSubmit } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

interface UseInstallmentsDocumentsProps {
  initialData: Document[];
}

interface UseInstallmentsDocumentsResult {
  documentsInstallments: Document[];
  loading: boolean;
  error: string | null;
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

  const [documentsInstallments, setDocumentsInstallments] = useState<Document[]>(initialData);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [installmentForPayment, setInstallmentForPayment] = useState<DocumentInstallment | null>(null);

  const { control, handleSubmit, watch, setValue, formState: { isValid } } = useForm<InstallmentPaymentFormData>({
    resolver: zodResolver(installmentPaymentFormSchema),
  });

  const form = watch();

  const refreshData = useCallback(async () => {
    if (!session?.accessToken) {
      setError("Sessão não autenticada para atualizar dados.");
      toast.error("Erro de Autenticação", {
        description: "Sua sessão expirou ou não está ativa. Por favor, faça login novamente.",
        duration: 4000,
        important: true,
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
        toast.success("Dados Atualizados", {
          description: "O dashboard foi atualizado com sucesso.",
          duration: 4000,
        });
      } else {
        // Trata o erro retornado pelo ApiResponse
        const errorMessage = "Não foi possível atualizar os dados das parcelas dos documentos.";
        setError(errorMessage);
        toast.error("Erro ao Atualizar", {
          description: errorMessage,
          duration: 4000,
        });
      }
    } catch (err) {
      console.error("Erro ao atualizar dados do dashboard (cliente):", err);
      setError((err as Error).message || "Ocorreu um erro inesperado ao atualizar o dashboard.");
      toast.error("Erro Inesperado", {
        description: (err as Error).message || "Verifique sua conexão e tente novamente.",
        duration: 4000,
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
    }
  }
  
  const handleInstallmentPaymentSubmit = async (data: InstallmentPaymentFormData) => {
    console.log({ data });
    try {
      const fileUploaded = await uploadFile(data.proof);

      if (fileUploaded.success === false || !fileUploaded.data) {
        toast.error("Erro ao fazer upload do arquivo.", {
          description: fileUploaded.message || "Não foi possível enviar o arquivo. Tente novamente.",
          duration: 4000,
        });

        return;
      }

      const body = {
        fileId: fileUploaded.data.id,
        paymentDate: format(data.date, 'yyyy-MM-dd'),
      }
      const response = await documentService.payInstallment(data.documentId, data.installmentId, body);
    } catch (error) {
      
    }
  }

  useEffect(() => {
    console.log({ form, isValid });
  }, [form]);

  return {
    error,
    loading,
    documentsInstallments,
    installmentForPayment,
    control,
    refreshData,
    setInstallmentPayment,
    handleInstallmentPaymentSubmit,
    handleSubmit,
  };
} 
