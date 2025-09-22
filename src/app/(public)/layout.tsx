import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PageTransitionWrapper } from '@/components/common/PageTransitionWrapper';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default async function PublicLayout({ children }: AuthLayoutProps) {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect('/dashboard');
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
    <PageTransitionWrapper>
        {children}
      </PageTransitionWrapper>
    </main>
  );
}
