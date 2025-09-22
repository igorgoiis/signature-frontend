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
 * Interface para configurações de requisição da API
 */
export interface RequestConfig {
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
  fetchOptions?: Partial<RequestInit>;
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
 * Interface para o cliente HTTP abstrato
 */
export interface IHttpClient {
  get<T = any>(url: string, config?: RequestConfig): Promise<ApiResponse<T>>;
  post<T = any>(url: string, data?: any, config?: RequestConfig): Promise<ApiResponse<T>>;
  put<T = any>(url: string, data: any, config?: RequestConfig): Promise<ApiResponse<T>>;
  patch<T = any>(url: string, data: any, config?: RequestConfig): Promise<ApiResponse<T>>;
  delete<T = any>(url: string, config?: RequestConfig): Promise<ApiResponse<T>>;
  uploadFile<T = any>(url: string, file: File | null | undefined, config?: RequestConfig): Promise<ApiResponse<T>>;
  uploadMultipleFiles<T = any>(url: string, files: (File | FileUpload)[], additionalData?: Record<string, any>, config?: RequestConfig): Promise<ApiResponse<T>>;
  downloadFile(url: string, fileName?: string, config?: RequestConfig): Promise<Blob>;
}

/**
 * Interface para o token de cancelamento de requisição
 */
export interface CancellationToken {
  signal: AbortSignal;
  abort: () => void;
}
