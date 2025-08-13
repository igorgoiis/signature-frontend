
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSession } from "next-auth/react";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const redirect = async () => {
      const session = await getSession();
      if (session) {
        router.push("/dashboard");
      } else {
        router.push("/login");
      }
    };
    redirect();
  }, [router]);

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );
}
