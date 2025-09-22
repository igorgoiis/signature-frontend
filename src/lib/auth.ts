import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { JWT } from "next-auth/jwt";
import { authService } from "./api/services/authService";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const response = await authService.login({
            email: credentials.email,
            password: credentials.password,
          })

          if (!response.success || !response.data) {
            // Se a API retornar um erro ou dados vazios
            console.error("Login failed:", response.message);
            return null;
          }

          const { access_token, refresh_token, user } = response.data;

          
          return {
            id: user.id.toString(),
            email: user.email,
            name: user.name,
            role: user.role,
            sector: user.sector,
            accessToken: access_token,
            refreshToken: refresh_token,
            accessTokenExpires: Date.now() + 3600 * 1000, // 1 hour
          };
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      // Inicial signin
      if (account && user) {
        return {
          ...token,
          accessToken: user.accessToken,
          refreshToken: user.refreshToken,
          accessTokenExpires: user.accessTokenExpires,
          role: user.role,
          sector: user.sector,
          error: undefined,
        };
      }

      // Se o token ainda não expirou, retorne-o
      // Adicione uma margem de segurança (ex: 5 segundos) antes de considerar expirado
      const safetyMargin = 5 * 1000; // 5 segundos
      if (token.accessTokenExpires && Date.now() < (token.accessTokenExpires - safetyMargin)) {
        return token;
      }

      // Token expirado, tenta renovar
      return refreshAccessToken(token);
    },
    async session({ session, token }) {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.sub,
          role: token.role,
          sector: token.sector,
        },
        accessToken: token.accessToken,
        refreshToken: token.refreshToken,
        error: token.error,
      };
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
};

/**
 * Função auxiliar para renovar o token de acesso usando o refresh token.
 * @param token O JWT atual.
 * @returns O JWT atualizado ou um JWT com erro.
 */
async function refreshAccessToken(token: JWT): Promise<JWT> {
  try {
    if (!token.refreshToken) {
      console.error("No refresh token available to renew access token.");
      return { ...token, error: "RefreshAccessTokenError" };
    }

    // Usa o authService para fazer o refresh do token
    const response = await authService.refreshToken(token.refreshToken);

    if (!response.success || !response.data) {
      console.error("Failed to refresh access token:", response.message);
      throw new Error(response.message || "Failed to refresh token.");
    }

    const { access_token, refresh_token, expires_in } = response.data;

    return {
      ...token,
      accessToken: access_token,
      // Use o novo refresh token se a API o fornecer, caso contrário, mantenha o antigo
      refreshToken: refresh_token || token.refreshToken,
      // Calcula a nova expiração do access token
      accessTokenExpires: Date.now() + expires_in * 1000,
      error: undefined, // Limpa qualquer erro anterior
    };
  } catch (error) {
    console.error('Error refreshing access token:', error);
    // Em caso de falha no refresh, retorne o token com um erro
    return {
      ...token,
      error: "RefreshAccessTokenError",
    };
  }
}