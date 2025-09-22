import { ApiResponse, HttpMethod, IHttpClient, RequestConfig, FileUpload, CancellationToken } from './types';
import { interceptors } from './interceptors';
import apiConfig from '../config/apiConfig';

/**
 * Implementação do cliente HTTP usando fetch
 */
export class FetchHttpClient implements IHttpClient {
  private baseURL: string;

  constructor(baseURL: string = apiConfig.baseURL) {
    this.baseURL = baseURL;
  }

  /**
   * Cria um controller para cancelar requisições
   * 
   * @returns Um objeto com o signal e um método para cancelar a requisição
   */
  static createCancellationToken(): CancellationToken {
    const controller = new AbortController();
    return {
      signal: controller.signal,
      abort: () => controller.abort()
    };
  }

  /**
   * Executa uma requisição com suporte a timeout e retry
   * 
   * @param url - URL completa para a requisição
   * @param method - Método HTTP
   * @param options - Opções para a requisição fetch
   * @param config - Configurações adicionais
   * @returns Promise com a resposta da requisição
   */
  private async fetchWithTimeout(
    url: string, 
    method: HttpMethod, 
    options: RequestInit, 
    config?: RequestConfig
  ): Promise<Response> {
    const { timeout = apiConfig.timeout, retryAttempts = apiConfig.retryAttempts, retryInterval = apiConfig.retryInterval } = config || {};
    
    // Função para executar uma única tentativa com timeout
    const executeFetch = async (): Promise<Response> => {
      // Cria um controller para poder cancelar a requisição
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      // Cria um novo objeto de opções com signal
      const fetchOptions: RequestInit = {
        ...options,
        signal: config?.signal || controller.signal
      };
      
      try {
        const response = await fetch(url, fetchOptions);
        clearTimeout(timeoutId);
        return response;
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    };
    
    // Implementa a lógica de retry
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= retryAttempts; attempt++) {
      try {
        // Adiciona um delay antes de retry (exceto na primeira tentativa)
        if (attempt > 0) {
          await new Promise(resolve => setTimeout(resolve, retryInterval));
          console.log(`Tentativa ${attempt}/${retryAttempts} para ${method} ${url}`);
        }
        
        return await executeFetch();
      } catch (error) {
        lastError = error as Error;
        
        // Se foi cancelado pelo usuário, não tenta novamente
        if (error instanceof DOMException && error.name === 'AbortError' && config?.signal?.aborted) {
          throw new Error('Requisição cancelada pelo usuário');
        }
      }
    }
    
    // Se todas as tentativas falharem, lança o último erro
    throw lastError || new Error('Falha na requisição após várias tentativas');
  }

  /**
   * Método base para realizar requisições HTTP
   * 
   * @param method - Método HTTP (GET, POST, etc)
   * @param endpoint - Caminho relativo do endpoint
   * @param data - Dados a serem enviados no corpo da requisição
   * @param config - Configurações adicionais
   * @returns Resposta da requisição
   */
  private async request<T = any>(
    method: HttpMethod,
    endpoint: string,
    data?: any,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseURL}${endpoint}`;

      // Aplicar interceptadores de requisição
      const interceptedConfig = await interceptors.request({ ...config, url });
      
      // Preparar opções da requisição
      const options: RequestInit = {
        method,
        headers: {
          ...apiConfig.defaultHeaders,
          ...interceptedConfig.headers
        }
      };
      
      // Adicionar corpo à requisição se necessário
      if (data !== undefined && method !== HttpMethod.GET) {
        options.body = JSON.stringify(data);
      }
      
      // Adicionar outras opções de configuração
      if (interceptedConfig.fetchOptions) {
        Object.assign(options, interceptedConfig.fetchOptions);
      }
      
      // Executar a requisição
      const response = await this.fetchWithTimeout(url, method, options, interceptedConfig);
      
      // Aplicar interceptadores de resposta
      return await interceptors.response<T>(response, interceptedConfig);
    } catch (error) {
      // Aplicar interceptadores de erro
      return interceptors.error(error, endpoint);
    }
  }

  /**
   * Executa uma requisição GET
   * 
   * @param endpoint - Endpoint da API
   * @param config - Configurações da requisição
   * @returns Promessa com a resposta da API
   */
  async get<T = any>(endpoint: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>(HttpMethod.GET, endpoint, undefined, config);
  }

  /**
   * Executa uma requisição POST
   * 
   * @param endpoint - Endpoint da API
   * @param data - Dados a serem enviados
   * @param config - Configurações da requisição
   * @returns Promessa com a resposta da API
   */
  async post<T = any>(endpoint: string, data?: any, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>(HttpMethod.POST, endpoint, data, config);
  }

  /**
   * Executa uma requisição PUT
   * 
   * @param endpoint - Endpoint da API
   * @param data - Dados a serem enviados
   * @param config - Configurações da requisição
   * @returns Promessa com a resposta da API
   */
  async put<T = any>(endpoint: string, data: any, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>(HttpMethod.PUT, endpoint, data, config);
  }

  /**
   * Executa uma requisição PATCH
   * 
   * @param endpoint - Endpoint da API
   * @param data - Dados a serem enviados
   * @param config - Configurações da requisição
   * @returns Promessa com a resposta da API
   */
  async patch<T = any>(endpoint: string, data: any, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>(HttpMethod.PATCH, endpoint, data, config);
  }

  /**
   * Executa uma requisição DELETE
   * 
   * @param endpoint - Endpoint da API
   * @param config - Configurações da requisição
   * @returns Promessa com a resposta da API
   */
  async delete<T = any>(endpoint: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>(HttpMethod.DELETE, endpoint, undefined, config);
  }

  /**
   * Faz upload de arquivo para o servidor com dados adicionais
   * 
   * @param endpoint - Endpoint da API para onde o arquivo será enviado
   * @param file - Arquivo a ser enviado
   * @param additionalData - Dados adicionais a serem enviados junto com o arquivo
   * @param config - Configurações adicionais para a requisição
   * @returns Promessa que resolve com a resposta da API
   */
  async uploadFile<T = any>(
    endpoint: string,
    file: File | null | undefined,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    // Validação inicial
    if (!endpoint) {
      return {
        success: false,
        message: "Endpoint não fornecido para upload de arquivo",
        error: "INVALID_ENDPOINT"
      };
    }

    if (!file || !(file instanceof File)) {
      return {
        success: false,
        message: "Arquivo inválido ou não fornecido",
        error: "INVALID_FILE"
      };
    }

    try {
      const url = `${this.baseURL}${endpoint}`;

      // Prepara FormData com o arquivo
      const formData = new FormData();
      formData.append("file", file);

       if (file) { // Adicionado verificação para 'file'
        formData.append("file", file);
      } else {
        console.warn("uploadFile: 'file' é nulo ou indefinido.");
      }
      
      // LOG 1: Conteúdo do FormData
      for (const pair of formData.entries()) {
          console.log(`FormData entry: ${pair[0]}, ${pair[1]}`);
      }
      console.log("FormData object created.");

      // Aplicar interceptadores de requisição (sem content-type para upload)
      const interceptedConfig = await interceptors.request({ 
        ...config, 
        url,
        headers: { ...config?.headers }
      });

      const finalHeaders: HeadersInit = {
        ...apiConfig.defaultHeaders, // Inclui os cabeçalhos padrão (ex: Authorization)
        ...interceptedConfig.headers, // Inclui os cabeçalhos modificados pelo interceptor
      };

      // LOG 2: Cabeçalhos ANTES da remoção do Content-Type
      console.log("Headers BEFORE Content-Type deletion:", { ...finalHeaders });

      if ((finalHeaders as any)['Content-Type']) {
        delete (finalHeaders as any)['Content-Type'];
      }
      
      const options: RequestInit = {
        method: HttpMethod.POST,
        headers: finalHeaders, // Usa os cabeçalhos finais construídos
        body: formData // O FormData é o corpo da requisição
      };

      // LOG 3: Cabeçalhos FINAIS que serão passados para fetch
      console.log("Final headers passed to fetch:", { ...options.headers });
      // LOG 4: Tipo do corpo da requisição
      console.log("Body type passed to fetch:", typeof options.body, options.body instanceof FormData ? 'is FormData' : 'is NOT FormData');
      
      // Adicionar outras opções de configuração
      if (interceptedConfig.fetchOptions) {
        Object.assign(options, interceptedConfig.fetchOptions);
      }
      
      // Executar a requisição
      const response = await this.fetchWithTimeout(url, HttpMethod.POST, options, interceptedConfig);
      
      // Aplicar interceptadores de resposta
      return await interceptors.response<T>(response, interceptedConfig);
    } catch (error) {
      // Log detalhado do erro
      console.error('Erro ao enviar arquivo:', {
        endpoint,
        fileName: file?.name,
        fileSize: file?.size,
        fileType: file?.type,
        error
      });
      
      // Aplicar interceptadores de erro
      return interceptors.error(error, endpoint);
    }
  }

  /**
   * Faz upload de múltiplos arquivos para o servidor
   * 
   * @param endpoint - Endpoint da API
   * @param files - Array de arquivos a serem enviados
   * @param additionalData - Dados adicionais para enviar junto
   * @param config - Configurações da requisição
   * @returns Promessa com a resposta da API
   */
  async uploadMultipleFiles<T = any>(
    endpoint: string,
    files: (File | FileUpload)[],
    additionalData?: Record<string, any>,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    if (!endpoint) {
      return {
        success: false,
        message: "Endpoint não fornecido para upload de arquivos",
        error: "INVALID_ENDPOINT"
      };
    }

    if (!files || !Array.isArray(files) || files.length === 0) {
      return {
        success: false,
        message: "Nenhum arquivo fornecido para upload",
        error: "NO_FILES_PROVIDED"
      };
    }

    try {
      const url = `${this.baseURL}${endpoint}`;
      const formData = new FormData();
      
      // Adiciona os arquivos ao FormData
      files.forEach((fileItem, index) => {
        if (fileItem instanceof File) {
          // Se for apenas um arquivo, usa o índice como campo
          formData.append(`files[${index}]`, fileItem);
        } else if (fileItem && fileItem.file instanceof File) {
          // Se for um objeto FileUpload, usa o campo especificado ou o índice
          const fieldName = fileItem.field || `files[${index}]`;
          formData.append(fieldName, fileItem.file);
        }
      });
      
      // Adiciona dados adicionais ao FormData
      if (additionalData && typeof additionalData === 'object') {
        Object.entries(additionalData).forEach(([key, value]) => {
          if (value === null || value === undefined) return;
          
          if (value instanceof File) {
            formData.append(key, value);
          } else if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
            formData.append(key, String(value));
          } else {
            formData.append(key, JSON.stringify(value));
          }
        });
      }

      // Aplicar interceptadores de requisição (sem content-type para upload)
      const interceptedConfig = await interceptors.request({ 
        ...config, 
        url,
        headers: { ...config?.headers }
      });
      
      // Remove o Content-Type para permitir que o navegador defina o boundary correto
      if (interceptedConfig.headers) {
        delete (interceptedConfig.headers as any)['Content-Type'];
      }
      
      const options: RequestInit = {
        method: HttpMethod.POST,
        headers: interceptedConfig.headers,
        body: formData
      };
      
      // Adicionar outras opções de configuração
      if (interceptedConfig.fetchOptions) {
        Object.assign(options, interceptedConfig.fetchOptions);
      }
      
      // Executar a requisição
      const response = await this.fetchWithTimeout(url, HttpMethod.POST, options, interceptedConfig);
      
      // Aplicar interceptadores de resposta
      return await interceptors.response<T>(response, interceptedConfig);
    } catch (error) {
      console.error('Erro ao enviar múltiplos arquivos:', {
        endpoint,
        fileCount: files.length,
        error
      });
      
      // Aplicar interceptadores de erro
      return interceptors.error(error, endpoint);
    }
  }

  /**
   * Faz download de um arquivo do servidor
   * 
   * @param endpoint - Endpoint da API
   * @param fileName - Nome do arquivo a ser baixado (opcional)
   * @param config - Configurações da requisição
   * @returns Promessa com o blob do arquivo
   */
  async downloadFile(
    endpoint: string,
    fileName?: string,
    config?: RequestConfig
  ): Promise<Blob> {
    const url = `${this.baseURL}${endpoint}`;

    try {
      // Aplicar interceptadores de requisição
      const interceptedConfig = await interceptors.request({ 
        ...config, 
        url,
        responseType: 'blob' 
      });
      
      const options: RequestInit = {
        method: HttpMethod.GET,
        headers: interceptedConfig.headers,
      };
      
      // Adicionar outras opções de configuração
      if (interceptedConfig.fetchOptions) {
        Object.assign(options, interceptedConfig.fetchOptions);
      }
      
      // Executar a requisição
      const response = await this.fetchWithTimeout(url, HttpMethod.GET, options, interceptedConfig);
      
      if (!response.ok) {
        throw new Error(`Erro ao baixar arquivo: ${response.statusText}`);
      }
      
      const blob = await response.blob();
      
      // Se fornecido um nome de arquivo, inicia o download
      if (fileName && typeof window !== 'undefined') {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      }
      
      return blob;
    } catch (error) {
      console.error('Erro ao baixar arquivo:', error);
      throw error;
    }
  }
}
