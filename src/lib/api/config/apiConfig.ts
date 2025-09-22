/**
 * Configurações gerais da API
 */
const API_CONFIG = {
  /**
   * URL base da API
   */
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api",

  /**
   * Tempo limite padrão para requisições (em milissegundos)
   */
  timeout: 30000, // 30 segundos

  /**
   * Número máximo de tentativas em caso de falha
   */
  retryAttempts: 1,

  /**
   * Intervalo entre tentativas em milissegundos
   */
  retryInterval: 1000,

  /**
   * Headers padrão para todas as requisições
   */
  defaultHeaders: {
    "Accept": "application/json",
    "Content-Type": "application/json",
  }
};

export default API_CONFIG;
