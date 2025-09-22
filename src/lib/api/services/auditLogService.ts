import { AuditLog } from "@/types/audit-log.type";
import { ApiClient } from "../core/apiClient";
import { ApiResponse, RequestConfig } from "../core/types";
import { BaseService } from "./baseService";

export class AuditLogService extends BaseService {
  constructor() {
    super('/audit-logs', ApiClient.getInstance());
  }

  /**
   * Busca todos os usuários com paginação e filtros (incluindo pesquisa).
   * @param config - Configurações adicionais para a requisição.
   * @returns Resposta contendo a lista de usuários e dados de paginação.
   */
  async getAuditsLogs(config?: RequestConfig): Promise<ApiResponse<AuditLog[]>> {
    return this.get<AuditLog[]>('', config);
  }
}

export const auditLogService = new AuditLogService();