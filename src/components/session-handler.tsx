import { useSession, signOut } from "next-auth/react";
import { useEffect } from "react";

export default function SessionHandler({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();

  useEffect(() => {
    if (session?.error === "RefreshAccessTokenError") {
      // Quando o refresh token falha, faça logout
      signOut({ callbackUrl: '/login' });
    }
  }, [session]);

  return <>{children}</>;
}
