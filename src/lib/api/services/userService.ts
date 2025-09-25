// src/lib/api/services/userService.ts

import { BaseService } from './baseService';
import { ApiResponse, RequestConfig } from '../core/types';
import { ApiClient } from '../core/apiClient'; // Importa o ApiClient
import { User, UserRole } from '@/types/user.type';

/**
 * Interface para filtros de busca de usuários, incluindo paginação e termo de pesquisa
 */
export interface UserFilter {
  page?: number;
  pageSize?: number;
  search?: string; // Termo de pesquisa
  role?: string;
  sectorId?: string;
  // Adicione outros filtros que sua API de usuários suporte
}

/**
 * Interface para dados de criação de usuário
 */
export interface UserCreateRequest {
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  sectorId?: number;
}

/**
 * Interface para dados de atualização de usuário
 */
export interface UserUpdateRequest {
  name?: string;
  email?: string;
  password?: string;
  role?: 'admin' | 'user';
  sectorId?: string;
}

/**
 * Serviço responsável por operações relacionadas a usuários
 */
export class UserService extends BaseService {
  /**
   * Cria uma instância do serviço de usuários
   */
  constructor() {
    // Passa '/users' como o endpoint base para o serviço de usuários
    // e usa a instância singleton do ApiClient
    super('/users', ApiClient.getInstance());
  }

  /**
   * Busca todos os usuários com paginação e filtros (incluindo pesquisa).
   * 
   * @param filters - Objeto contendo os filtros (page, pageSize, search, role, sectorId, etc.).
   * @param config - Configurações adicionais para a requisição.
   * @returns Resposta contendo a lista de usuários e dados de paginação.
   */
  async getUsers(includeDeleted: boolean, config?: RequestConfig): Promise<ApiResponse<User[]>> {
    return this.get<User[]>(`?includeDeleted=${includeDeleted}`, config);
  }

  /**
   * Busca um usuário pelo ID.
   * 
   * @param id - O ID do usuário.
   * @param config - Configurações adicionais para a requisição.
   * @returns Resposta contendo os dados do usuário.
   */
  async getUserById(id: string, config?: RequestConfig): Promise<ApiResponse<User>> {
    // O endpoint base '/users' já está configurado no construtor
    // Então, chamamos apenas o caminho relativo para o ID do usuário
    return this.get<User>(`/${id}`, config);
  }

  /**
   * Cria um novo usuário.
   * 
   * @param user - Dados para criação do novo usuário.
   * @param config - Configurações adicionais para a requisição.
   * @returns Resposta contendo os dados do usuário criado.
   */
  async createUser(user: UserCreateRequest, config?: RequestConfig): Promise<ApiResponse<User>> {
    // O endpoint base '/users' já está configurado no construtor.
    // Assumindo que a criação é no endpoint base '/'
    return this.post<User>('/', user, config);
  }

  /**
   * Atualiza um usuário existente.
   * 
   * @param id - O ID do usuário a ser atualizado.
   * @param user - Os dados a serem atualizados.
   * @param config - Configurações adicionais para a requisição.
   * @returns Resposta contendo os dados do usuário atualizado.
   */
  async updateUser(id: number, user: UserCreateRequest, config?: RequestConfig): Promise<ApiResponse<User>> {
    return this.put<User>(`/${id}`, user, config);
  }

  /**
   * Remove um usuário.
   * 
   * @param id - O ID do usuário a ser excluído.
   * @param config - Configurações adicionais para a requisição.
   * @returns Resposta confirmando a exclusão.
   */
  async deleteUser(id: number, config?: RequestConfig): Promise<ApiResponse<void>> {
    return this.delete<void>(`/${id}`, config);
  }

  /**
   * Remove um usuário.
   * 
   * @param id - O ID do usuário a ser excluído.
   * @param config - Configurações adicionais para a requisição.
   * @returns Resposta confirmando a exclusão.
   */
  async restoreUser(id: number, config?: RequestConfig): Promise<ApiResponse<User>> {
    return this.post<User>(`/${id}/restore`, config);
  }

  /**
   * Obtém o perfil do usuário atual.
   * 
   * @param config - Configurações adicionais para a requisição.
   * @returns Resposta contendo os dados do usuário atual.
   */
  async getCurrentUser(config?: RequestConfig): Promise<ApiResponse<User>> {
    return this.client.get<User>('/me', config);
  }

  async search(query: string,  config?: RequestConfig): Promise<ApiResponse<User[]>> {
    return this.get<User[]>(`search?q=${encodeURIComponent(query)}`, config);
  }
}

// Exporta uma instância única do serviço de usuários para uso simples
export const userService = new UserService();
