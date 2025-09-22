import { Document } from "./document.type";

export interface FileType {
  id: number;
  filePath: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  fileHash: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date;
  document: Document;
}