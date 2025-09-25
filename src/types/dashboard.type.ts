import { Document } from "./document.type";

export enum RecentActivityActions {
  DOCUMENT_CREATED = "DOCUMENT_CREATED",
  SIGN_DOCUMENT = "SIGN_DOCUMENT",
  REJECT_DOCUMENT = "REJECT_DOCUMENT",
  CREATE_SIGNATURE = "CREATE_SIGNATURE",
}

export interface DashboardStats {
  totalDocuments: number;
  pendingDocuments: number;
  approvedDocuments: number;
  activeUsers?: number;
}

export interface RecentActivityItem {
  id: number;
  action: RecentActivityActions;
  entityType: string | null;
  entityId: number | null;
  performedBy: { name: string; email: string; } | null;
  performedAt: Date;
  details: any | null;
}

export interface DashboardData {
  stats: DashboardStats;
  recentDocuments: Document[];
  recentActivity: RecentActivityItem[];
}