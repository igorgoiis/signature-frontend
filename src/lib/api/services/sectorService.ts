import { Sector } from "@/types/sector.type";
import { ApiClient } from "../core/apiClient";
import { ApiResponse, RequestConfig } from "../core/types";
import { BaseService } from "./baseService";

export class SectorService extends BaseService {
  constructor() {
    super('/sectors', ApiClient.getInstance());
  }

  /**
   * Busca todos os usuários com paginação e filtros (incluindo pesquisa).
   * @param config - Configurações adicionais para a requisição.
   * @returns Resposta contendo a lista de usuários e dados de paginação.
   */
  async getSectors(includeDeleted: boolean, config?: RequestConfig): Promise<ApiResponse<Sector[]>> {
    return this.get<Sector[]>(`?includeDeleted=${includeDeleted}`, config);
  }

  /**
   * Busca todos os usuários com paginação e filtros (incluindo pesquisa).
   * @param data - Dados do setor a ser criado.
   * @param config - Configurações adicionais para a requisição.
   * @returns Resposta contendo a lista de usuários e dados de paginação.
   */
  async createSector(data: Partial<Sector>, config?: RequestConfig): Promise<ApiResponse<Sector>> {
    return this.post<Sector>('', { name: data.name, description: data.description }, config);
  }

  /**
   * Busca todos os usuários com paginação e filtros (incluindo pesquisa).
   * @param id - ID do setor editado.
   * @param data - Dados do setor a ser editado.
   * @param config - Configurações adicionais para a requisição.
   * @returns Resposta contendo a lista de usuários e dados de paginação.
   */
  async updateSector(id: number, data: Partial<Sector>, config?: RequestConfig): Promise<ApiResponse<Sector>> {
    return this.put<Sector>(`/${id}`, { name: data.name, description: data.description }, config);
  }

  /**
   * Busca todos os usuários com paginação e filtros (incluindo pesquisa).
   * @param id - ID do setor.
   * @param config - Configurações adicionais para a requisição.
   * @returns Resposta contendo a lista de usuários e dados de paginação.
   */
  async deleteSector(id: number, config?: RequestConfig): Promise<ApiResponse<void>> {
    return this.delete<void>(`${id}`, config);
  }

  /**
   * Busca todos os usuários com paginação e filtros (incluindo pesquisa).
   * @param id - ID do setor.
   * @param config - Configurações adicionais para a requisição.
   * @returns Resposta contendo a lista de usuários e dados de paginação.
   */
  async restoreSector(id: number, config?: RequestConfig): Promise<ApiResponse<Sector>> {
    return this.post<Sector>(`${id}/restore`, config);
  }
}

export const sectorService = new SectorService();