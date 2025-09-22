import { getSession } from "next-auth/react";
import { ApiResponse, RequestConfig } from "./types";

/**
 * Interceptadores para requisições HTTP
 */
export const interceptors = {
  /**w
   * Interceptador de requisição para adicionar headers e configurações padrão
   * 
   * @param config - Configuração atual da requisição
   * @returns Configuração modificada
   */
  async request(config: RequestConfig & { url: string }): Promise<RequestConfig & { url: string }> {
    // Clone as configurações para não modificar o objeto original
    const newConfig = { ...config };
    newConfig.headers = { ...newConfig.headers };

    // Adicionar token de autenticação se necessário
    if (!newConfig.skipAuth) {
      try {
        const session = await getSession();
        if (session?.accessToken) {
          newConfig.headers = {
            ...newConfig.headers,
            Authorization: `Bearer ${session.accessToken}`,
          };
        }
      } catch (error) {
        console.error("Erro ao obter sessão para autenticação:", error);
      }
    }

    console.log(`[HTTP Request] ${config.url}`, { method: config.fetchOptions?.method, headers: config.headers });


    return newConfig;
  },

  /**
   * Interceptador de resposta para tratamento padrão de respostas
   * 
   * @param response - Resposta da requisição
   * @param config - Configuração da requisição
   * @returns Resposta processada
   */
  async response<T>(response: Response, config?: RequestConfig): Promise<any> {
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
        };
      }

      // Caso contrário, formata a resposta
      return {
        success: true,
        data,
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
  },

  /**
   * Interceptador de erro: Lida com erros de rede, timeouts, cancelamentos, etc.
   * @param error - Objeto de erro
   * @param endpoint - Endpoint da requisição que falhou
   * @returns Resposta de erro padronizada
   */
  error: async (error: any, endpoint: string): Promise<ApiResponse<any>> => {
    console.error(`[HTTP Error] Requisição para ${endpoint} falhou:`, error);

    let errorMessage = 'Erro desconhecido na requisição.';
    let errorCode = 'UNKNOWN_ERROR';

    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      errorMessage = 'Erro de rede. Verifique sua conexão ou a disponibilidade do servidor.';
      errorCode = 'NETWORK_ERROR';
    } else if (error instanceof DOMException && error.name === 'AbortError') {
      errorMessage = 'Requisição cancelada.';
      errorCode = 'REQUEST_CANCELLED';
    } else if (error instanceof Error) {
      errorMessage = error.message;
      errorCode = error.name || 'GENERIC_ERROR';
    }

    return {
      success: false,
      message: errorMessage,
      error: errorCode,
      statusCode: 0,
    };
  },
};
