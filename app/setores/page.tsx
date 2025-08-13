
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Building2, 
  Search, 
  Plus, 
  MoreHorizontal, 
  Loader2,
  Edit,
  Trash2
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sector } from "@/lib/types";
import { ApiService } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

export default function SetoresPage() {
  const { data: session } = useSession();
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    // Check if user is admin
    if (session?.user?.role !== "admin") {
      router.push("/dashboard");
      return;
    }
    fetchSectors();
  }, [session, router]);

  const fetchSectors = async () => {
    try {
      setLoading(true);
      const data = await ApiService.get("/sectors");
      setSectors(data);
    } catch (error) {
      console.error("Error fetching sectors:", error);
      toast({
        title: "Erro ao carregar setores",
        description: "Não foi possível carregar a lista de setores.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSector = async (sectorId: string, sectorName: string) => {
    if (!confirm(`Tem certeza que deseja excluir o setor "${sectorName}"?`)) {
      return;
    }

    try {
      await ApiService.delete(`/sectors/${sectorId}`);
      setSectors(sectors.filter(sector => sector.id !== sectorId));
      toast({
        title: "Setor excluído",
        description: `O setor "${sectorName}" foi excluído com sucesso.`,
      });
    } catch (error) {
      toast({
        title: "Erro ao excluir setor",
        description: "Não foi possível excluir o setor. Verifique se não há usuários vinculados.",
        variant: "destructive",
      });
    }
  };

  const filteredSectors = sectors.filter(sector =>
    sector.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sector.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (session?.user?.role !== "admin") {
    return null; // Will redirect in useEffect
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gerenciar Setores</h1>
            <p className="text-gray-600">Organize os usuários por setores</p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Novo Setor
          </Button>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar setores..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Sectors List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {filteredSectors.length} setor(es) encontrado(s)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : filteredSectors.length === 0 ? (
              <div className="text-center py-8">
                <Building2 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhum setor encontrado
                </h3>
                <p className="text-gray-500">
                  {searchTerm 
                    ? "Tente ajustar os termos de busca"
                    : "Comece criando o primeiro setor"}
                </p>
                {!searchTerm && (
                  <Button className="mt-4">
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Setor
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredSectors.map((sector, index) => (
                  <motion.div
                    key={sector.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <Card className="h-full hover:shadow-lg transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <Building2 className="h-5 w-5 text-blue-600" />
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Edit className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                Ver usuários
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => handleDeleteSector(sector.id, sector.name)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <h3 className="font-semibold text-gray-900 mb-2">
                          {sector.name}
                        </h3>
                        {sector.description && (
                          <p className="text-sm text-gray-600 mb-3">
                            {sector.description}
                          </p>
                        )}
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>ID: {sector.id}</span>
                          {/* You could add user count here if available */}
                          <span>Ativo</span>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
