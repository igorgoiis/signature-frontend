
"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bell, User, LogOut, Settings } from "lucide-react";
import Link from "next/link";
import { UserRole } from "@/types/user.type";

export function Header() {
  const { data: session } = useSession();
  const [isOnline, setIsOnline] = useState(true);

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  const getUserInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white shadow-sm">
      <div className="container mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        {/* Logo and Brand */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-600 text-white">
              <span className="text-sm font-bold">A</span>
            </div>
            <span className="text-xl font-semibold text-gray-900">
              Assinaturas
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          <Link
            href="/dashboard"
            className="flex items-center space-x-1 text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
          >
            Dashboard
          </Link>
          <Link
            href="/upload"
            className="flex items-center space-x-1 text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
          >
            Upload
          </Link>
          <Link
            href="/documentos"
            className="flex items-center space-x-1 text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
          >
            Documentos
          </Link>
          {session?.user.role === UserRole.FINANCIAL || session?.user.role === UserRole.ADMIN && (
              <Link
              href="/parcelas"
              className="flex items-center space-x-1 text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
            >
              Parcelas
            </Link>
          )}
          {session?.user?.role === "admin" && (
            <>
              <Link
                href="/usuarios"
                className="flex items-center space-x-1 text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
              >
                Usuários
              </Link>
              <Link
                href="/setores"
                className="flex items-center space-x-1 text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
              >
                Setores
              </Link>
              <Link
                href="/auditoria"
                className="flex items-center space-x-1 text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
              >
                Auditoria
              </Link>
            </>
          )}
        </nav>

        {/* Right side */}
        <div className="flex items-center space-x-4">
          {/* Status Badge */}
          <Badge
            variant={isOnline ? "default" : "secondary"}
            className={`${
              isOnline
                ? "bg-green-100 text-green-800 hover:bg-green-100"
                : "bg-gray-100 text-gray-800"
            }`}
          >
            {isOnline ? "Online" : "Offline"}
          </Badge>

          {/* Notifications */}
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="h-4 w-4" />
            <span className="sr-only">Notificações</span>
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-blue-600 text-white text-xs">
                    {session?.user?.name ? getUserInitials(session.user.name) : "U"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <div className="flex items-center justify-start gap-2 p-2">
                <div className="flex flex-col space-y-1 leading-none">
                  <p className="font-medium">{session?.user?.name}</p>
                  <p className="w-[200px] truncate text-sm text-muted-foreground">
                    {session?.user?.email}
                  </p>
                </div>
              </div>
              <DropdownMenuItem asChild>
                <Link href="/settings" className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Configurações</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sair</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
