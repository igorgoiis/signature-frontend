"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";

// Componentes de UI (Shadcn UI)
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Ícones
import { Loader2, FileSignature } from "lucide-react";

// Hook Customizado de Login
import { useLogin } from "@/hooks/use-login"; // Importa o novo hook

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();
  
  const { login, isLoading, errorMessage } = useLogin();
  
  const { status } = useSession();

  // Efeito para redirecionar se o usuário já estiver autenticado
  useEffect(() => {
    if (status === "authenticated") {
      router.push("/dashboard");
    }
  }, [status, router]);

  // Exibe um spinner de carregamento enquanto a sessão está sendo verificada
  // ou se o usuário já está autenticado (antes do redirecionamento).
  if (status === "loading" || status === "authenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(email, password);
  };

  return (
    <Card className="shadow-xl border-0 px-8 mx-auto mt-10">
      <CardHeader className="space-y-4 text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="mx-auto h-12 w-12 rounded-xl bg-blue-600 flex items-center justify-center"
        >
          <FileSignature className="h-6 w-6 text-white" />
        </motion.div>
        <div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Sistema de Assinaturas
          </CardTitle>
          <CardDescription className="text-gray-600">
            Faça login para acessar sua conta
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Exibe a mensagem de erro do hook, se houver */}
          {errorMessage && (
            <Alert variant="destructive">
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
              className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
              className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 transition-all duration-200"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Entrando...
              </>
            ) : (
              "Entrar"
            )}
          </Button>
        </form>
        
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>
            Esqueceu sua senha?{" "}
            {/* Use o componente Link do Next.js para navegação interna */}
            <Link href="/forgot-password" className="text-blue-600 hover:underline">
              Clique aqui
            </Link>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
