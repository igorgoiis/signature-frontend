
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
  id: number;
  code: string;
  cpfCnpj: string;
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

export enum DocumentType {
  ADVANCE_PAYMENT = "ADVANCE_PAYMENT",          // ADIANTAMENTOS
  BANK_SLIP = "BANK_SLIP",                      // BOLETO
  CHECK = "CHECK",                              // CHEQUE
  CREDIT_CARD = "CREDIT_CARD",                  // CARTÃO DE CRÉDITO
  POST_DATED_CHECK = "POST_DATED_CHECK",        // CHEQUE PRÉ DATADO
  TRADE_BILL = "TRADE_BILL",                    // DUPLICATA
  LOAN = "LOAN",                                // EMPRÉSTIMO
  PETTY_CASH = "PETTY_CASH",                    // FUNDO DE CAIXA
  VACATION_PAY = "VACATION_PAY",                // FÉRIAS
  SEVERANCE_FUND = "SEVERANCE_FUND",            // FGTS
  PAYROLL = "PAYROLL",                          // FOLHA
  SOCIAL_SECURITY = "SOCIAL_SECURITY",          // INSS
  TAXES = "TAXES",                              // IMPOSTOS
  CREDIT_NOTE = "CREDIT_NOTE",                  // NOTA DE CRÉDITO
  SUPPLIER_RETURN_NOTE = "SUPPLIER_RETURN_NOTE", // NOTA DE DEVOLUÇÃO FORNECEDOR
  ADVANCE_PAYMENT_TO_SUPPLIER = "ADVANCE_PAYMENT_TO_SUPPLIER", // PAGAMENTO ANTECIPADO
  BRADESCO_HEALTH_PLAN = "BRADESCO_HEALTH_PLAN", // PLANO DE SAÚDE BRADESCO
  FORECAST = "FORECAST",                        // PREVISÃO
  ADVANCE_RECEIPT = "ADVANCE_RECEIPT",          // RECEBIMENTO ANTECIPADO
  RECEIPT = "RECEIPT",                          // RECIBO
  TERMINATION = "TERMINATION",                  // RESCISÃO
  HEALTH_PLAN = "HEALTH_PLAN",                  // PLANO DE SAÚDE
  TRIBUTES = "TRIBUTES",                        // TRIBUTOS
  FEES = "FEES",                                // TAXAS
  GENERAL = "GENERAL"                           // GERAL
}

export enum DocumentStatus {
  PENDING = "PENDING",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
  EXPIRED = "EXPIRED",
}

export const documentTypeLabels: Record<DocumentType, string> = {
  [DocumentType.ADVANCE_PAYMENT]: "Adiantamentos",
  [DocumentType.BANK_SLIP]: "Boleto",
  [DocumentType.CHECK]: "Cheque",
  [DocumentType.CREDIT_CARD]: "Cartão de Crédito",
  [DocumentType.POST_DATED_CHECK]: "Cheque Pré Datado",
  [DocumentType.TRADE_BILL]: "Duplicata",
  [DocumentType.LOAN]: "Empréstimo",
  [DocumentType.PETTY_CASH]: "Fundo de Caixa",
  [DocumentType.VACATION_PAY]: "Férias",
  [DocumentType.SEVERANCE_FUND]: "FGTS",
  [DocumentType.PAYROLL]: "Folha",
  [DocumentType.SOCIAL_SECURITY]: "INSS",
  [DocumentType.TAXES]: "Impostos",
  [DocumentType.CREDIT_NOTE]: "Nota de Crédito",
  [DocumentType.SUPPLIER_RETURN_NOTE]: "Nota de Devolução Fornecedor",
  [DocumentType.ADVANCE_PAYMENT_TO_SUPPLIER]: "Pagamento Antecipado",
  [DocumentType.BRADESCO_HEALTH_PLAN]: "Plano de Saúde Bradesco",
  [DocumentType.FORECAST]: "Previsão",
  [DocumentType.ADVANCE_RECEIPT]: "Recebimento Antecipado",
  [DocumentType.RECEIPT]: "Recibo",
  [DocumentType.TERMINATION]: "Rescisão",
  [DocumentType.HEALTH_PLAN]: "Plano de Saúde",
  [DocumentType.TRIBUTES]: "Tributos",
  [DocumentType.FEES]: "Taxas",
  [DocumentType.GENERAL]: "Geral"
};
