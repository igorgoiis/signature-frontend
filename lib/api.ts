import { getSession } from "next-auth/react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

interface ApiConfig {
  headers?: HeadersInit;
  responseType?: 'json' | 'blob' | 'text';
}

export class ApiService {
  private static async getHeaders(contentType = 'application/json'): Promise<HeadersInit> {
    const session = await getSession();
    const headers: HeadersInit = {
      "Content-Type": contentType,
    };
    
    if (session?.accessToken) {
      headers.Authorization = `Bearer ${session.accessToken}`;
    }
    
    return headers;
  }

  private static async handleResponse<T>(response: Response, config?: ApiConfig): Promise<ApiResponse<T>> {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        message: errorData.message || `API Error: ${response.statusText}`,
        error: errorData.error || `Status: ${response.status}`,
      };
    }

    let data: T;
    if (config?.responseType === 'blob') {
      data = await response.blob() as T;
    } else if (config?.responseType === 'text') {
      data = await response.text() as T;
    } else {
      data = await response.json();
    }

    // O backend já retorna no formato ApiResponse, então apenas retornamos
    return data as ApiResponse<T>;
  }

  static async get<T = any>(endpoint: string, config?: ApiConfig): Promise<ApiResponse<T>> {
    const headers = await this.getHeaders();
    const response = await fetch(`${API_URL}${endpoint}`, {
      headers: {
        ...headers,
        ...config?.headers,
      },
    });
    
    return this.handleResponse<T>(response, config);
  }

  static async post<T = any>(endpoint: string, data?: any, config?: ApiConfig): Promise<ApiResponse<T>> {
    const headers = await this.getHeaders();
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: "POST",
      headers: {
        ...headers,
        ...config?.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
    });
    
    return this.handleResponse<T>(response, config);
  }

  static async put<T = any>(endpoint: string, data: any, config?: ApiConfig): Promise<ApiResponse<T>> {
    const headers = await this.getHeaders();
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: "PUT",
      headers: {
        ...headers,
        ...config?.headers,
      },
      body: JSON.stringify(data),
    });
    
    return this.handleResponse<T>(response, config);
  }

  static async delete<T = any>(endpoint: string, config?: ApiConfig): Promise<ApiResponse<T>> {
    const headers = await this.getHeaders();
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: "DELETE",
      headers: {
        ...headers,
        ...config?.headers,
      },
    });
    
    return this.handleResponse<T>(response, config);
  }

  static async uploadFile<T = any>(
    endpoint: string, 
    file: File, 
    additionalData?: any,
    config?: ApiConfig
  ): Promise<ApiResponse<T>> {
    const session = await getSession();
    const formData = new FormData();
    formData.append("file", file);
    
    if (additionalData) {
      Object.keys(additionalData).forEach(key => {
        formData.append(key, JSON.stringify(additionalData[key]));
      });
    }

    const headers: HeadersInit = {};
    if (session?.accessToken) {
      headers.Authorization = `Bearer ${session.accessToken}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      method: "POST",
      headers: {
        ...headers,
        ...config?.headers,
      },
      body: formData,
    });
    
    return this.handleResponse<T>(response, config);
  }
}

