"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

interface LoginHookResult {
  login: (email: string, password: string) => Promise<boolean>;
  isLoading: boolean;
  errorMessage: string | null;
}

/**
 * Hook customizado para gerenciar a lógica de autenticação de login.
 * Encapsula a chamada ao signIn do NextAuth.js, estados de carregamento e erro,
 * e feedback ao usuário via toasts.
 *
 * @returns {LoginHookResult} Um objeto contendo a função `login`, o estado `isLoading` e `errorMessage`.
 */
export function useLogin(): LoginHookResult {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    setErrorMessage(null);

    if (!email || !password) {
      const msg = "Por favor, preencha todos os campos.";
      setErrorMessage(msg);
      toast({
        title: "Campos Obrigatórios",
        description: msg,
        variant: "destructive",
      });
      setIsLoading(false);
      return false;
    }

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        const msg = result.error === "CredentialsSignin"
          ? "Credenciais inválidas. Verifique seu email e senha."
          : "Ocorreu um erro inesperado. Tente novamente.";
        
        setErrorMessage(msg);
        toast({
          title: "Erro no Login",
          description: msg,
          variant: "destructive",
        });
        return false;
      } else if (result?.ok) {
        toast({
          title: "Login Realizado com Sucesso",
          description: "Redirecionando para o dashboard...",
        });
        // Redireciona manualmente após o sucesso.
        // O useEffect na LoginPage também faria isso via useSession,
        // mas este push imediato melhora a percepção de velocidade.
        router.push("/dashboard");
        return true;
      }
      return false;
    } catch (err) {
      console.error("Erro inesperado durante o login:", err);
      const msg = "Erro interno do servidor. Tente novamente mais tarde.";
      setErrorMessage(msg);
      toast({
        title: "Erro no Login",
        description: msg,
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return { login, isLoading, errorMessage };
}
