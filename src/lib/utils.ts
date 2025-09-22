import { SignatoryStatus } from "@/types/document-signatory.type"
import { type ClassValue, clsx } from "clsx"
import { CheckCircle, Clock, XCircle } from "lucide-react"
import { twMerge } from "tailwind-merge"
 
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainingSeconds = seconds % 60

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
}

export const formatCurrency = (value: number): string => {
  return (value / 100).toLocaleString('pt-BR', { 
    style: 'currency', 
    currency: 'BRL',
    minimumFractionDigits: 2
  });
};

export const unformatCurrency = (value: string): number => {
  const cleaned = value.replace(/[^\d]/g, '');
  // Retorna inteiro em centavos
  return Number(cleaned);
};

export const getSignatureStatusBadge = (status: SignatoryStatus) => {
  const statusConfig = {
    [SignatoryStatus.PENDING]: { label: 'Pendente', variant: 'secondary' as const, Icon: Clock },
    [SignatoryStatus.SIGNED]: { label: 'Assinado', variant: 'default' as const, Icon: CheckCircle },
    [SignatoryStatus.REJECTED]: { label: 'Rejeitado', variant: 'destructive' as const, Icon: XCircle },
  };

  const config = statusConfig[status] || statusConfig.PENDING;
  
  return { config, Icon: config.Icon };
};