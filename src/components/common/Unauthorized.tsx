"use client"

import React from 'react'
import { ShieldX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useRouter } from 'next/navigation'

interface UnauthorizedAccessProps {
  title?: string
  message?: string
  showReturnButton?: boolean
  showLoginButton?: boolean
  returnPath?: string
  loginPath?: string
  variant?: 'default' | 'minimal' | 'detailed'
  className?: string
}

const UnauthorizedAccess: React.FC<UnauthorizedAccessProps> = ({
  title = "Acesso Não Autorizado",
  message = "Você não possui permissão para acessar esta página.",
  showReturnButton = true,
  showLoginButton = false,
  returnPath = "/",
  loginPath = "/login",
  variant = "default",
  className = ""
}) => {
  const router = useRouter()

  const handleReturn = () => {
    router.push(returnPath)
  }

  const handleLogin = () => {
    router.push(loginPath)
  }

  if (variant === 'minimal') {
    return (
      <div className={`flex flex-col items-center justify-center min-h-[400px] p-4 ${className}`}>
        <ShieldX className="h-16 w-16 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold text-center mb-2">{title}</h2>
        <p className="text-muted-foreground text-center mb-6 max-w-md">{message}</p>
        
        <div className="flex gap-3">
          {showLoginButton && (
            <Button onClick={handleLogin}>
              Fazer Login
            </Button>
          )}
          {showReturnButton && (
            <Button variant="outline" onClick={handleReturn}>
              Voltar
            </Button>
          )}
        </div>
      </div>
    )
  }

  if (variant === 'detailed') {
    return (
      <div className={`container mx-auto px-4 py-8 ${className}`}>
        <div className="max-w-2xl mx-auto">
          <Alert className="mb-6 border-destructive">
            <ShieldX className="h-4 w-4" />
            <AlertDescription>
              <strong>Acesso Restrito:</strong> Esta página requer autenticação ou permissões especiais.
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="rounded-full bg-destructive/10 p-6">
                  <ShieldX className="h-12 w-12 text-destructive" />
                </div>
              </div>
              <CardTitle className="text-2xl">{title}</CardTitle>
              <CardDescription className="text-lg">
                {message}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="text-sm text-muted-foreground space-y-2">
                <p><strong>Possíveis soluções:</strong></p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Verifique se você está logado em sua conta</li>
                  <li>Confirme se possui as permissões necessárias</li>
                  <li>Entre em contato com o administrador do sistema</li>
                  <li>Tente acessar novamente após alguns minutos</li>
                </ul>
              </div>
              
              <div className="flex gap-3 pt-4">
                {showLoginButton && (
                  <Button onClick={handleLogin} className="flex-1">
                    Fazer Login
                  </Button>
                )}
                {showReturnButton && (
                  <Button variant="outline" onClick={handleReturn} className="flex-1">
                    Voltar ao Início
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Variant default
  return (
    <div className={`flex flex-col items-center justify-center min-h-screen p-4 ${className}`}>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-destructive/10 p-4">
              <ShieldX className="h-8 w-8 text-destructive" />
            </div>
          </div>
          <CardTitle className="text-xl">{title}</CardTitle>
          <CardDescription>{message}</CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-3">
          {showLoginButton && (
            <Button onClick={handleLogin} className="w-full">
              Fazer Login
            </Button>
          )}
          {showReturnButton && (
            <Button variant="outline" onClick={handleReturn} className="w-full">
              Voltar
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default UnauthorizedAccess
