import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Header } from '@/components/common/Header';
import { PageTransitionWrapper } from '@/components/common/PageTransitionWrapper';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default async function AuthLayout({ children }: AuthLayoutProps) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto max-w-6xl px-6 py-8">
        <PageTransitionWrapper>
          {children}
        </PageTransitionWrapper>
      </main>
    </div>
  );
}
