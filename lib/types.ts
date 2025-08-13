
// Types and interfaces for the signature platform

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  status: 'active' | 'inactive';
  sector?: Sector;
  sectorId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Sector {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Document {
  id: number;
  title: string;
  description: string;
  originalFilename: string;
  storagePath: string;
  mimeType: string;
  size: number;
  status: 'DRAFT' | 'PENDING' | 'SIGNING' | 'COMPLETED' | 'REJECTED' | 'CANCELLED';
  tipoDocumento: string | null;
  natureza: string | null;
  valor: number | null;
  quantidadeParcelas: number;
  datasVencimento: string[] | null;
  observacoes: string | null;
  owner: {
    id: number;
    name: string;
    email: string;
    role: string;
  };
  signatories: DocumentSignatory[];
  allocations: DocumentAllocation[];
  createdAt: string;
  updatedAt: string;
}

export interface DocumentAllocation {
  id: number;
  filial: string;
  centroCusto: string;
  valor: number;
  percentual: number;
}

export interface DocumentSignatory {
  id: number;
  userId: number;
  documentId: number;
  order: number;
  status: 'PENDING' | 'SIGNED' | 'REJECTED';
  signedAt?: string | null;
  rejectionReason?: string | null;
  user: {
    id: number;
    name: string;
    email: string;
  };
}

export interface SignatureData {
  userId: number | null;
  timestamp: Date;
}

export interface AuditLog {
  id: number;
  entityType: string;
  entityId: number;
  action: string;
  performedBy: number;
  performedAt: Date;
  details?: any;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}

export interface DashboardStats {
  totalDocuments: number;
  pendingDocuments: number;
  approvedDocuments: number;
  activeUsers: number;
}

export interface Supplier {
  id: string;
  code: string;
  cnpj: string;
  companyName: string; // Razão Social
  tradeName?: string; // Nome Fantasia
  createdAt: string;
  updatedAt: string;
}

export interface InstallmentPlan {
  installmentNumber: number;
  dueDate: string;
  amount: number;
}
