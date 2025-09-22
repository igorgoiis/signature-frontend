import { ApiClient } from '../core/apiClient';
import { ApiResponse, RequestConfig } from '../core/types';
import { IHttpClient } from '../core/types';

/**
 * Classe base para serviços de API
 * Fornece métodos comuns e funcionalidades reutilizáveis para todos os serviços
 */
export abstract class BaseService {
  protected client: IHttpClient;
  protected baseEndpoint: string;

  /**
   * Construtor do serviço base
   * 
   * @param baseEndpoint - Endpoint base do serviço
   * @param client - Cliente HTTP a ser usado (usa o padrão se não fornecido)
   */
  constructor(baseEndpoint: string, client?: IHttpClient) {
    this.baseEndpoint = baseEndpoint;
    this.client = client || ApiClient.getInstance();
  }

  /**
   * Constrói o caminho completo do endpoint
   * 
   * @param path - Caminho relativo para adicionar ao endpoint base
   * @returns Caminho completo do endpoint
   */
  protected getPath(path?: string): string {
    if (!path) return this.baseEndpoint;
    
    // Remove barras duplicadas na junção dos caminhos
    if (path.startsWith('/') || path.startsWith('?')) {
      return `${this.baseEndpoint}${path}`;
    }
    
    return `${this.baseEndpoint}/${path}`;
  }

  /**
   * Método para criar um token de cancelamento
   * 
   * @returns Token de cancelamento com signal e método abort
   */
  protected createCancellationToken() {
    return ApiClient.createCancellationToken();
  }
  
  /**
   * Extrai os dados de sucesso da resposta ou lança um erro em caso de falha
   * 
   * @param response - Resposta da API
   * @returns Dados da resposta
   * @throws Error se a resposta não for bem-sucedida
   */
  protected extractData<T>(response: ApiResponse<T>): T {
    if (!response.success) {
      throw new Error(response.message || response.error || 'Erro desconhecido');
    }
    return response.data as T;
  }

  // --- MÉTODOS HTTP ADICIONADOS ---

  /**
   * Realiza uma requisição GET.
   * @param endpoint O endpoint específico para a requisição (relativo ao baseEndpoint).
   * @param config Configurações adicionais da requisição.
   * @returns Uma Promise com a resposta da API.
   */
  protected async get<T>(endpoint: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.client.get<T>(this.getPath(endpoint), config);
  }

  /**
   * Realiza uma requisição POST.
   * @param endpoint O endpoint específico para a requisição (relativo ao baseEndpoint).
   * @param data O corpo da requisição.
   * @param config Configurações adicionais da requisição.
   * @returns Uma Promise com a resposta da API.
   */
  protected async post<T>(endpoint: string, data?: any, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.client.post<T>(this.getPath(endpoint), data, config);
  }

  /**
   * Realiza uma requisição PUT.
   * @param endpoint O endpoint específico para a requisição (relativo ao baseEndpoint).
   * @param data O corpo da requisição.
   * @param config Configurações adicionais da requisição.
   * @returns Uma Promise com a resposta da API.
   */
  protected async put<T>(endpoint: string, data?: any, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.client.put<T>(this.getPath(endpoint), data, config);
  }

  /**
   * Realiza uma requisição DELETE.
   * @param endpoint O endpoint específico para a requisição (relativo ao baseEndpoint).
   * @param config Configurações adicionais da requisição.
   * @returns Uma Promise com a resposta da API.
   */
  protected async delete<T>(endpoint: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.client.delete<T>(this.getPath(endpoint), config);
  }

  /**
   * Realiza o upload de um arquivo via POST.
   * @param endpoint O endpoint específico para o upload (relativo ao baseEndpoint).
   * @param file O arquivo a ser enviado.
   * @param config Configurações adicionais da requisição.
   * @returns Uma Promise com a resposta da API.
   */
  protected async uploadFileBase<T>(endpoint: string,
    file: File,
    config?: RequestConfig): Promise<ApiResponse<T>> {
      
    const formData = new FormData();
    formData.append('file', file);

    return this.client.post<T>(this.getPath(endpoint), formData, {
      ...config,
      headers: {
        ...config?.headers,
      },
    });
  }

  protected async downloadFile(endpoint: string, fileName?: string, config?: RequestConfig): Promise<Blob> {
    return this.client.downloadFile(this.getPath(endpoint), fileName, config);
  }
}
