import { User } from "./user.type";

export enum AuditAction {
  // Document actions
  CREATE_DOCUMENT = "CREATE_DOCUMENT",
  VIEW_DOCUMENT = "VIEW_DOCUMENT",
  UPDATE_DOCUMENT = "UPDATE_DOCUMENT",
  DELETE_DOCUMENT = "DELETE_DOCUMENT",
  SIGN_DOCUMENT = "SIGN_DOCUMENT",
  REJECT_DOCUMENT = "REJECT_DOCUMENT",
  APPROVED_DOCUMENT = "APPROVED_DOCUMENT",

  // Auth actions
  LOGIN_SUCCESS = "LOGIN_SUCCESS",
  LOGIN_FAILURE = "LOGIN_FAILURE",
  LOGOUT = "LOGOUT",

  // User actions
  USER_CREATED = "USER_CREATED",
  USER_UPDATED = "USER_UPDATED",
  USER_DELETED = "USER_DELETED",
  PASSWORD_CHANGED = "PASSWORD_CHANGED",
  PASSWORD_RESET = "PASSWORD_RESET",

  // System actions
  SYSTEM_ERROR = "SYSTEM_ERROR",
}

export interface AuditLog {
  id: number;
  timestamp: Date;
  user: User | null;
  action: AuditAction;
  entityType: string | null;
  entityId: number | null;
  details: Record<string, any> | null;
}