import { Document } from "./document.type";
import { FileType } from "./file.type";

export interface DocumentInstallment {
  id: number; 
  installmentNumber: number;
  amount: number;
  dueDate: string;
  description: string | null;
  isPaid: boolean;
  paidDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  documentId: number;
  document: Document;
  fileId?: number;
  proofPayment?: FileType;
}