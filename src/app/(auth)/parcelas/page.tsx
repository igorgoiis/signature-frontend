import UnauthorizedAccess from "@/components/common/Unauthorized";
import InstallmentsDocumentsClientWrapper from "@/components/parcelas/InstallmentsDocumentsClientWrapper";
import { authOptions } from "@/lib/auth";
import { documentService } from "@/lib/data/document";
import { Document } from "@/types/document.type";
import { UserRole } from "@/types/user.type";
import { CircleX } from "lucide-react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export default async function InstallmentsDocumentsPage() {
   // 1. Verificação de sessão no lado do servidor para segurança e redirecionamento
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.accessToken) {
    redirect('/login'); // Redireciona para a página de login se não houver sessão válida
  }

  if (session.user.role && ![UserRole.ADMIN, UserRole.FINANCIAL].includes(session.user.role as UserRole)) {
    return (
      <UnauthorizedAccess variant="detailed" />
    );
  }

  let initialInstallmentsDocuments: Document[] | null = null;
  let serverError: string | null = null;

  // 2. Busca de dados do dashboard no lado do servidor usando o serviço
  try {
    const { success, data, error, message } = await documentService.getInstallmentsForExpiredAndUpcomingDocuments({
      headers: {
        'Authorization': `Bearer ${session.accessToken}`,
      },
    });

    if (success && data) {
      initialInstallmentsDocuments = data;
    } else {
      // Trata o erro retornado pelo ApiResponse
      serverError = "Não foi possível carregar os dados iniciais das parcelas dos documentos.";
    }
  } catch (error) {
    console.error("Erro ao buscar dados iniciais das parcelas dos documentos no servidor:", error);
    serverError = (error as Error).message || "Ocorreu um erro inesperado ao carregar as parcelas dos documentos.";
  }

  // 3. Renderização condicional baseada no sucesso da busca de dados no servidor
  if (serverError || !initialInstallmentsDocuments) {
    // Se houver um erro na busca inicial de dados, exibe uma mensagem de erro simples
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-red-50 text-red-800 p-4">
        <CircleX className="h-10 w-10 animate-spin mb-4" />
        <h2 className="text-xl font-semibold mb-2">Erro ao carregar as parcelas dos documentos</h2>
        <p className="text-center">
          {serverError || "Não foi possível carregar os dados das parcelas dos documentos. Por favor, tente novamente mais tarde."}
        </p>
        <p className="mt-4 text-sm text-gray-600">
          Se o problema persistir, entre em contato com o suporte.
        </p>
      </div>
    );
  }

  // 4. Se os dados foram carregados com sucesso, passa-os para o componente cliente wrapper
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Documentos com parcelas vencidas e à vencer</h1>
          <p className="text-gray-600">Gerencie as parcelas dos seus documentos</p>
        </div>
      </div>

      <InstallmentsDocumentsClientWrapper initialData={initialInstallmentsDocuments} userRole={session.user.role} />
    </div>
  );
}
