import { Document } from "./document.type";

export interface DocumentAllocation {
  id: number;
  documentId: number;
  filial: string;
  centroCusto: string;
  valor: number;
  percentual: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  document: Document; 
}