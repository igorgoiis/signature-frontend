import { FetchHttpClient } from './httpClient';
import { IHttpClient } from './types';
import apiConfig from '../config/apiConfig';

/**
 * Classe responsável por fornecer uma instância do cliente HTTP
 * Implementa o padrão Singleton para garantir uma única instância do cliente
 */
export class ApiClient {
  private static instance: IHttpClient;

  /**
   * Retorna a instância única do cliente HTTP
   * 
   * @returns Cliente HTTP
   */
  public static getInstance(): IHttpClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new FetchHttpClient(apiConfig.baseURL);
    }
    return ApiClient.instance;
  }

  /**
   * Configura um cliente HTTP personalizado
   * 
   * @param client - Implementação do cliente HTTP
   */
  public static setClient(client: IHttpClient): void {
    ApiClient.instance = client;
  }
  
  /**
   * Método auxiliar para criar um token de cancelamento
   * 
   * @returns Token de cancelamento com signal e método abort
   */
  public static createCancellationToken() {
    return FetchHttpClient.createCancellationToken();
  }
}
