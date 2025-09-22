import { getSession } from "next-auth/react";

/**
 * URL base da API
 */
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

/**
 * Tempo limite padrão para requisições (em milissegundos)
 */
const DEFAULT_TIMEOUT = 30000; // 30 segundos

/**
 * Interface para resposta padrão da API
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  statusCode?: number;
}

/**
 * Enum para métodos HTTP suportados
 */
export enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  PATCH = 'PATCH',
  DELETE = 'DELETE'
}

/**
 * Interface para configurações de requisição da API
 */
export interface ApiConfig {
  /** Headers customizados para a requisição */
  headers?: HeadersInit;
  /** Tipo de resposta esperado */
  responseType?: 'json' | 'blob' | 'text';
  /** Timeout para a requisição em milissegundos */
  timeout?: number;
  /** Sinal para cancelar a requisição */
  signal?: AbortSignal;
  /** Número máximo de tentativas em caso de falha */
  retryAttempts?: number;
  /** Intervalo entre tentativas em milissegundos */
  retryInterval?: number;
  /** Opções adicionais para o fetch */
  fetchOptions?: Omit<RequestInit, 'headers' | 'method' | 'body' | 'signal'>;
  /** Se verdadeiro, desativa o tratamento automático de erros */
  disableErrorHandling?: boolean;
  /** Se verdadeiro, não inclui automaticamente o token de autenticação */
  skipAuth?: boolean;
}

/**
 * Interface para arquivos a serem enviados para API
 */
export interface FileUpload {
  /** Arquivo a ser enviado */
  file: File;
  /** Campo onde o arquivo será enviado */
  field?: string;
}

/**
 * Classe para gerenciar requisições à API
 */
export class ApiService {
  /**
   * Obtém os headers padrão incluindo autenticação se disponível
   * 
   * @param contentType - Tipo de conteúdo para o header
   * @param skipAuth - Se verdadeiro, não inclui o token de autenticação
   * @returns Headers para a requisição
   */
  private static async getHeaders(contentType = 'application/json', skipAuth = false): Promise<HeadersInit> {
    const headers: HeadersInit = {};
    
    if (contentType) {
      headers["Content-Type"] = contentType;
      headers["Accept"] = "application/json";
    }
    
    if (!skipAuth) {
      const session = await getSession();
      if (session?.accessToken) {
        headers.Authorization = `Bearer ${session.accessToken}`;
      }
    }
    
    return headers;
  }

  /**
   * Processa a resposta da API e converte para o formato esperado
   * 
   * @param response - Resposta da requisição
   * @param config - Configurações da requisição
   * @returns Objeto formatado com a resposta da API
   * @throws Error se a resposta não puder ser processada
   */
  private static async handleResponse<T>(
    response: Response, 
    config?: ApiConfig
  ): Promise<ApiResponse<T>> {
    // Se a resposta não foi bem-sucedida, tratar como erro
    if (!response.ok && !config?.disableErrorHandling) {
      let errorMessage = `API Error: ${response.statusText}`;
      let errorDetail = `Status: ${response.status}`;
      
      try {
        // Tenta extrair detalhes do erro da resposta
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
          errorDetail = errorData.error || errorData.details || errorDetail;
        }
      } catch (e) {
        // Se não conseguir processar o JSON do erro, usa mensagem padrão
        console.error('Erro ao processar detalhes do erro da API:', e);
      }
      
      return {
        success: false,
        message: errorMessage,
        error: errorDetail,
        statusCode: response.status
      };
    }

    try {
      // Processa o corpo da resposta de acordo com o tipo especificado
      let data: any;
      
      if (config?.responseType === 'blob') {
        data = await response.blob();
      } else if (config?.responseType === 'text') {
        data = await response.text();
      } else {
        // Tenta processar como JSON, mas lida com respostas vazias
        const text = await response.text();
        data = text ? JSON.parse(text) : {};
      }

      // Se a resposta já estiver no formato ApiResponse, retorna diretamente
      if (typeof data === 'object' && 'success' in data) {
        return {
          ...data,
          statusCode: response.status
        } as ApiResponse<T>;
      }

      // Caso contrário, formata a resposta
      return {
        success: true,
        data: data as T,
        statusCode: response.status
      };
      
    } catch (error) {
      console.error('Erro ao processar resposta da API:', error);
      return {
        success: false,
        message: 'Erro ao processar resposta da API',
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        statusCode: response.status
      };
    }
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
  private static async fetchWithTimeout<T>(
    url: string, 
    method: HttpMethod, 
    options: RequestInit, 
    config?: ApiConfig
  ): Promise<Response> {
    const { timeout = DEFAULT_TIMEOUT, retryAttempts = 0, retryInterval = 1000 } = config || {};
    
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
   * Cria um controller para cancelar requisições
   * 
   * @returns Um objeto com o signal e um método para cancelar a requisição
   */
  static createAbortController() {
    const controller = new AbortController();
    return {
      signal: controller.signal,
      abort: () => controller.abort()
    };
  }

  /**
   * Executa uma requisição HTTP
   * 
   * @param method - Método HTTP (GET, POST, etc.)
   * @param endpoint - Endpoint da API (sem a URL base)
   * @param data - Dados a serem enviados no corpo da requisição
   * @param config - Configurações adicionais
   * @returns Promessa com a resposta da API
   */
  private static async request<T = any>(
    method: HttpMethod,
    endpoint: string,
    data?: any,
    config?: ApiConfig
  ): Promise<ApiResponse<T>> {
    try {
      const headers = await this.getHeaders(
        'application/json',
        config?.skipAuth
      );
      
      const url = `${API_URL}${endpoint}`;
      
      // Preparamos as opções básicas da requisição
      const options: RequestInit = {
        method,
        headers: {
          ...headers,
          ...config?.headers
        }
      };
      
      // Adicionamos outras opções de configuração se existirem
      if (config?.fetchOptions) {
        Object.assign(options, config.fetchOptions);
      }
      
      // Adiciona corpo à requisição se necessário
      if (data !== undefined && method !== HttpMethod.GET) {
        options.body = JSON.stringify(data);
      }
      
      const response = await this.fetchWithTimeout<T>(url, method, options, config);
      return this.handleResponse<T>(response, config);
      
    } catch (error) {
      console.error(`Erro na requisição ${method} ${endpoint}:`, error);
      
      return {
        success: false,
        message: 'Erro ao comunicar com o servidor',
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      };
    }
  }

  /**
   * Executa uma requisição GET
   * 
   * @param endpoint - Endpoint da API
   * @param config - Configurações da requisição
   * @returns Promessa com a resposta da API
   */
  static async get<T = any>(
    endpoint: string, 
    config?: ApiConfig
  ): Promise<ApiResponse<T>> {
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
  static async post<T = any>(
    endpoint: string, 
    data?: any, 
    config?: ApiConfig
  ): Promise<ApiResponse<T>> {
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
  static async put<T = any>(
    endpoint: string, 
    data: any, 
    config?: ApiConfig
  ): Promise<ApiResponse<T>> {
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
  static async patch<T = any>(
    endpoint: string, 
    data: any, 
    config?: ApiConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>(HttpMethod.PATCH, endpoint, data, config);
  }

  /**
   * Executa uma requisição DELETE
   * 
   * @param endpoint - Endpoint da API
   * @param config - Configurações da requisição
   * @returns Promessa com a resposta da API
   */
  static async delete<T = any>(
    endpoint: string, 
    config?: ApiConfig
  ): Promise<ApiResponse<T>> {
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
  static async uploadFile<T = any>(
    endpoint: string,
    file: File | null | undefined,
    additionalData?: Record<string, any>,
    config?: ApiConfig
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
      // Prepara FormData com o arquivo
      const formData = new FormData();
      formData.append("file", file);
      
      // Adiciona dados adicionais ao FormData
      if (additionalData && typeof additionalData === 'object') {
        Object.entries(additionalData).forEach(([key, value]) => {
          // Tratamento especial baseado no tipo de dados
          if (value === null || value === undefined) {
            // Não envie valores nulos
            return;
          } else if (value instanceof File) {
            // Se for um arquivo adicional
            formData.append(key, value);
          } else if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
            // Para tipos primitivos simples, envie como string diretamente
            formData.append(key, String(value));
          } else {
            // Para objetos e arrays, converta para JSON
            try {
              formData.append(key, JSON.stringify(value));
            } catch (error) {
              console.error(`Erro ao serializar valor para o campo ${key}:`, error);
              throw new Error(`Não foi possível processar o dado para o campo ${key}`);
            }
          }
        });
      }

      // Obtém headers sem o content-type para que o browser defina automaticamente
      // com o boundary correto para o FormData
      const headers = await this.getHeaders('', config?.skipAuth);
      
      const url = `${API_URL}${endpoint}`;
      const options: RequestInit = {
        method: HttpMethod.POST,
        headers: {
          ...headers,
          ...config?.headers
        },
        body: formData
      };
      
      // Adiciona outras opções de configuração se existirem
      if (config?.fetchOptions) {
        Object.assign(options, config.fetchOptions);
      }
      
      const response = await this.fetchWithTimeout<T>(url, HttpMethod.POST, options, config);
      return this.handleResponse<T>(response, config);
      
    } catch (error) {
      // Log detalhado do erro
      console.error('Erro ao enviar arquivo:', {
        endpoint,
        fileName: file?.name,
        fileSize: file?.size,
        fileType: file?.type,
        error
      });
      
      return {
        success: false,
        message: error instanceof Error ? `Erro ao enviar arquivo: ${error.message}` : "Ocorreu um erro inesperado ao enviar o arquivo",
        error: error instanceof Error ? error.message : "UNKNOWN_ERROR"
      };
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
  static async uploadMultipleFiles<T = any>(
    endpoint: string,
    files: (File | FileUpload)[],
    additionalData?: Record<string, any>,
    config?: ApiConfig
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
      
      // Adiciona dados adicionais ao FormData (mesmo processo do uploadFile)
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

      // Obtém headers sem o content-type
      const headers = await this.getHeaders('', config?.skipAuth);
      
      const url = `${API_URL}${endpoint}`;
      const options: RequestInit = {
        method: HttpMethod.POST,
        headers: {
          ...headers,
          ...config?.headers
        },
        body: formData
      };
      
      // Adiciona outras opções de configuração se existirem
      if (config?.fetchOptions) {
        Object.assign(options, config.fetchOptions);
      }
      
      const response = await this.fetchWithTimeout<T>(url, HttpMethod.POST, options, config);
      return this.handleResponse<T>(response, config);
      
    } catch (error) {
      console.error('Erro ao enviar múltiplos arquivos:', {
        endpoint,
        fileCount: files.length,
        error
      });
      
      return {
        success: false,
        message: error instanceof Error ? `Erro ao enviar arquivos: ${error.message}` : "Ocorreu um erro inesperado ao enviar os arquivos",
        error: error instanceof Error ? error.message : "UNKNOWN_ERROR"
      };
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
  static async downloadFile(
    endpoint: string,
    fileName?: string,
    config?: ApiConfig
  ): Promise<Blob> {
    const headers = await this.getHeaders('', config?.skipAuth);
    
    try {
      const url = `${API_URL}${endpoint}`;
      const options: RequestInit = {
        method: HttpMethod.GET,
        headers: {
          ...headers,
          ...config?.headers
        }
      };
      
      // Adiciona outras opções de configuração se existirem
      if (config?.fetchOptions) {
        Object.assign(options, config.fetchOptions);
      }
      
      const response = await this.fetchWithTimeout(
        url,
        HttpMethod.GET,
        options,
        config
      );
      
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
