import { BaseService } from './baseService';
import { ApiResponse, RequestConfig } from '../core/types';
import { ApiClient } from '../core/apiClient';
import { DashboardData, DashboardStats, RecentActivityItem } from '@/types/dashboard.type';

/**
 * Serviço responsável por operações relacionadas ao dashboard.
 */
export class DashboardService extends BaseService {
   /**
   * Cria uma instância do serviço de dashboard.
   */
  constructor() {
    super('/dashboard', ApiClient.getInstance());
  }

  /**
   * Busca os dados completos do dashboard a partir da API.
   *
   * @param config - Configurações adicionais para a requisição (ex: headers de autenticação).
   * @returns Resposta contendo os dados do dashboard.
   */
  async getDashboardData(config?: RequestConfig): Promise<ApiResponse<DashboardData>> {
    return this.get<DashboardData>('/', config);
  }

  /**
   * Busca as estatísticas do dashboard.
   * Corresponde a um endpoint como GET /api/dashboard/stats
   *
   * @param config - Configurações adicionais para a requisição.
   * @returns Resposta contendo os dados estatísticos.
   */
  async getStats(config?: RequestConfig): Promise<ApiResponse<DashboardStats>> {
    return this.get<DashboardStats>('/stats', config);
  }

  /**
   * Busca as atividades recentes do dashboard.
   * Corresponde a um endpoint como GET /api/dashboard/recent-activity
   *
   * @param config - Configurações adicionais para a requisição.
   * @returns Resposta contendo a lista de atividades recentes.
   */
  async getRecentActivity(config?: RequestConfig): Promise<ApiResponse<RecentActivityItem[]>> {
    return this.get<RecentActivityItem[]>('/recent-activity', config);
  }
}

export const dashboardService = new DashboardService();