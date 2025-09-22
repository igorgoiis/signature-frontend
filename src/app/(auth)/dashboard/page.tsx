import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth'; // Ajuste o caminho para o seu arquivo auth.ts
import { dashboardService } from '@/lib/data/dashboard'; // Importa o serviço e os tipos

// Importa o componente cliente "wrapper"
import { DashboardClientWrapper } from '@/components/dashboard/DashboardClientWrapper';
import { CircleX } from 'lucide-react'; // Para um spinner simples de carregamento inicial
import { documentService } from '@/lib/api/services/documentService';
import { DashboardData } from '@/types/dashboard.type';

export const metadata = {
  title: 'Dashboard - Sistema de Assinaturas',
  description: 'Visão geral e gerenciamento de documentos e assinaturas.',
};

export default async function DashboardPage() {
   // 1. Verificação de sessão no lado do servidor para segurança e redirecionamento
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.accessToken) {
    redirect('/login'); // Redireciona para a página de login se não houver sessão válida
  }

  let initialDashboardData: DashboardData | null = null;
  let serverError: string | null = null;

  // 2. Busca de dados do dashboard no lado do servidor usando o serviço
  try {
    const { success: successStats, data: stats } = await dashboardService.getStats({
      headers: {
        'Authorization': `Bearer ${session.accessToken}`,
      },
    });

    const { success: successRecentActivity, data: recentActivity } = await dashboardService.getRecentActivity({
      headers: {
        'Authorization': `Bearer ${session.accessToken}`,
      },
    });

    const { success: successRecentDocuments, data: recentDocuments } = await documentService.getDocuments(
      { limit: 5, sort: 'createdAt:desc' },
      { headers: { 'Authorization': `Bearer ${session.accessToken}` } }
    );

    if (successStats && successRecentActivity && successRecentDocuments && stats && recentActivity && recentDocuments) {
      initialDashboardData = {
        stats,
        recentDocuments: recentDocuments || [],
        recentActivity,
      };
    } else {
      // Trata o erro retornado pelo ApiResponse
      serverError = "Não foi possível carregar os dados iniciais do dashboard.";
    }
  } catch (error) {
    console.error("Erro ao buscar dados iniciais do dashboard no servidor:", error);
    serverError = (error as Error).message || "Ocorreu um erro inesperado ao carregar o dashboard.";
  }

  // 3. Renderização condicional baseada no sucesso da busca de dados no servidor
  if (serverError || !initialDashboardData) {
    // Se houver um erro na busca inicial de dados, exibe uma mensagem de erro simples
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-red-50 text-red-800 p-4">
        <CircleX className="h-10 w-10 animate-spin mb-4" />
        <h2 className="text-xl font-semibold mb-2">Erro ao carregar o Dashboard</h2>
        <p className="text-center">
          {serverError || "Não foi possível carregar os dados do dashboard. Por favor, tente novamente mais tarde."}
        </p>
        <p className="mt-4 text-sm text-gray-600">
          Se o problema persistir, entre em contato com o suporte.
        </p>
      </div>
    );
  }

  // 4. Se os dados foram carregados com sucesso, passa-os para o componente cliente wrapper
  return (
    <div className="space-y-8 p-6">
      <DashboardClientWrapper
        initialData={initialDashboardData}
        userRole={session.user.role}
      />
    </div>
  );
}