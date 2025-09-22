import { BaseService } from './baseService';
import { ApiResponse } from '../core/types';
import { Session } from 'next-auth';
import { ApiClient } from '../core/apiClient';
import { User } from '@/types/user.type';

/**
 * Interface para dados de login
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Interface para resposta de autenticação
 */
export interface AuthResponse {
  user: User
  access_token: string;
  refresh_token: string;
}

/**
 * Interface para dados de registro
 */
export interface RegistrationData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

/**
 * Interface para resposta de verificação de token
 */
export interface TokenVerificationResponse {
  valid: boolean;
  expired: boolean;
  user?: {
    id: string;
    email: string;
  };
}

/**
 * Interface para requisição de redefinição de senha
 */
export interface PasswordResetRequest {
  email: string;
}

/**
 * Interface para alteração de senha
 */
export interface PasswordChangeRequest {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface RefreshTokenResponse {
  access_token: string;
  refresh_token?: string; // O refresh token pode ser rotativo
  expires_in: number; // Tempo de expiração em segundos do novo access_token
}

/**
 * Serviço responsável por operações de autenticação
 */
export class AuthService extends BaseService {
  /**
   * Cria uma instância do serviço de autenticação
   */
  constructor() {
    // Passa '/auth' como o endpoint base para o serviço de autenticação
    // e usa a instância singleton do ApiClient
    super('/auth', ApiClient.getInstance());
  }

  /**
   * Realiza o login do usuário
   * 
   * @param credentials - Credenciais do usuário (email e senha)
   * @returns Resposta contendo dados do usuário e tokens
   */
  async login(credentials: LoginCredentials): Promise<ApiResponse<AuthResponse>> {
    return await this.post<AuthResponse>('/login', credentials);
  }

  /**
   * Realiza o login do usuário através do NextAuth
   * 
   * @param credentials - Credenciais do usuário (email e senha)
   * @returns Resposta contendo dados do usuário e tokens
   */
  async nextAuthLogin(credentials: LoginCredentials): Promise<ApiResponse<AuthResponse>> {
    return await this.post<AuthResponse>('/signin', credentials);
  }

  /**
   * Registra um novo usuário no sistema
   * 
   * @param userData - Dados para registro do novo usuário
   * @returns Resposta da API com os dados do usuário criado
   */
  async register(userData: RegistrationData): Promise<ApiResponse<AuthResponse>> {
    return await this.post<AuthResponse>('/register', userData);
  }

  /**
   * Encerra a sessão do usuário
   * 
   * @param refreshToken - Token de refresh (opcional)
   * @returns Resposta da API confirmando logout
   */
  async logout(refreshToken?: string): Promise<ApiResponse<void>> {
    return await this.post<void>('/logout', { refreshToken });
  }

  /**
   * Obtém uma nova sessão usando o refreshToken
   * 
   * @param refreshToken - Token de atualização
   * @returns Nova sessão com tokens atualizados
   */
  async refreshToken(refreshToken: string): Promise<ApiResponse<RefreshTokenResponse>> {
    return await this.post<RefreshTokenResponse>('/refresh', { refresh_token: refreshToken });
  }

  /**
   * Solicita redefinição de senha
   * 
   * @param email - Email do usuário
   * @returns Resposta confirmando envio do email de recuperação
   */
  async requestPasswordReset(email: string): Promise<ApiResponse<{ message: string }>> {
    return await this.post<{ message: string }>('/forgot-password', { email });
  }

  /**
   * Redefine a senha com o token recebido
   * 
   * @param token - Token de redefinição de senha
   * @param password - Nova senha
   * @param confirmPassword - Confirmação da nova senha
   * @returns Resposta confirmando alteração de senha
   */
  async resetPassword(token: string, password: string, confirmPassword: string): Promise<ApiResponse<{ message: string }>> {
    return await this.post<{ message: string }>('/reset-password', {
      token,
      password,
      confirmPassword
    });
  }

  /**
   * Altera a senha do usuário autenticado
   * 
   * @param passwordData - Dados para alteração de senha
   * @returns Resposta confirmando alteração de senha
   */
  async changePassword(passwordData: PasswordChangeRequest): Promise<ApiResponse<{ message: string }>> {
    return await this.post<{ message: string }>('/change-password', passwordData);
  }

  /**
   * Verifica se um token é válido
   * 
   * @param token - Token a ser verificado
   * @returns Resposta informando se o token é válido
   */
  async verifyToken(token: string): Promise<ApiResponse<TokenVerificationResponse>> {
    return await this.post<TokenVerificationResponse>('/verify-token', { token });
  }

  /**
   * Obtém o usuário atual baseado no token de autenticação
   * 
   * @returns Dados do usuário autenticado
   */
  async getCurrentUser(): Promise<ApiResponse<AuthResponse['user']>> {
    return await this.get<AuthResponse['user']>('/profile');
  }

  /**
   * Atualiza os dados do usuário autenticado
   * 
   * @param userData - Novos dados do usuário
   * @returns Dados do usuário atualizados
   */
  async updateProfile(userData: Partial<AuthResponse['user']>): Promise<ApiResponse<AuthResponse['user']>> {
    return await this.put<AuthResponse['user']>('/profile', userData);
  }

  /**
   * Envia código de verificação para o email do usuário
   * 
   * @param email - Email a receber o código de verificação
   * @returns Resposta confirmando envio do código
   */
  async sendVerificationCode(email: string): Promise<ApiResponse<{ message: string }>> {
    return await this.post<{ message: string }>('/send-verification', { email });
  }

  /**
   * Verifica o código enviado ao email
   * 
   * @param email - Email do usuário
   * @param code - Código de verificação
   * @returns Resposta confirmando verificação
   */
  async verifyEmailCode(email: string, code: string): Promise<ApiResponse<{ verified: boolean }>> {
    return await this.post<{ verified: boolean }>('/verify-email', { 
      email, 
      code 
    });
  }

  /**
   * Integração com NextAuth para verificar a sessão atual
   * 
   * @param session - Sessão do NextAuth
   * @returns Sessão verificada ou nula
   */
  async validateSession(session: Session | null): Promise<Session | null> {
    if (!session) return null;
    
    try {
      // Verifica se o token ainda é válido
      const tokenResponse = await this.verifyToken(session.accessToken as string);
      
      if (!tokenResponse.success || !tokenResponse.data?.valid) {
        // Se o token é inválido mas temos um refreshToken, tenta renovar
        if (session.refreshToken) {
          const refreshResponse = await this.refreshToken(session.refreshToken as string);
          
          if (refreshResponse.success && refreshResponse.data) {
            // Retorna sessão com tokens atualizados
            return {
              ...session,
              accessToken: refreshResponse.data.access_token,
              refreshToken: refreshResponse.data.refresh_token,
              expires: refreshResponse.data.expires_in 
                ? new Date(refreshResponse.data.expires_in).toISOString()
                : session.expires
            };
          }
        }
        
        // Se não conseguir renovar, retorna null (sessão inválida)
        return null;
      }
      
      return session;
    } catch (error) {
      console.error('Erro ao validar sessão:', error);
      return null;
    }
  }


}

// Exporta uma instância única do serviço
export const authService = new AuthService();
