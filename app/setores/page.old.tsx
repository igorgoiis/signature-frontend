
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Building2, 
  Search, 
  Plus, 
  MoreHorizontal, 
  Loader2,
  Edit,
  UserX,
  CheckCircle,
  XCircle,
  Users
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sector, User } from "@/lib/types";
import { ApiService } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

// Extended Sector interface with user count and status
interface ExtendedSector extends Sector {
  userCount?: number;
  status?: 'active' | 'inactive';
}

export default function SetoresPage() {
  const { data: session } = useSession();
  const [sectors, setSectors] = useState<ExtendedSector[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const router = useRouter();

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [selectedSector, setSelectedSector] = useState<ExtendedSector | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });
  const [formLoading, setFormLoading] = useState(false);

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
      const data = await ApiService.get("/api/sectors");
      // Mock user count and status for now - should come from backend
      const sectorsWithExtra = data.map((sector: Sector) => ({
        ...sector,
        userCount: Math.floor(Math.random() * 10), // Mock data
        status: 'active' as const // Mock data
      }));
      setSectors(sectorsWithExtra);
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

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
    });
  };

  const openAddModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  const openEditModal = (sector: ExtendedSector) => {
    setFormData({
      name: sector.name,
      description: sector.description || "",
    });
    setSelectedSector(sector);
    setShowEditModal(true);
  };

  const openDeactivateModal = (sector: ExtendedSector) => {
    setSelectedSector(sector);
    setShowDeactivateModal(true);
  };

  const handleAddSector = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "O nome do setor é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    try {
      setFormLoading(true);
      const newSector = await ApiService.post("/api/sectors", {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
      });
      
      setSectors([...sectors, { 
        ...newSector, 
        userCount: 0, 
        status: 'active' as const 
      }]);
      
      toast({
        title: "Setor criado",
        description: `O setor "${formData.name}" foi criado com sucesso.`,
      });
      
      setShowAddModal(false);
      resetForm();
    } catch (error) {
      toast({
        title: "Erro ao criar setor",
        description: "Não foi possível criar o setor. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditSector = async () => {
    if (!selectedSector || !formData.name.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "O nome do setor é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    try {
      setFormLoading(true);
      const updatedSector = await ApiService.put(`/api/sectors/${selectedSector.id}`, {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
      });
      
      setSectors(sectors.map(sector => 
        sector.id === selectedSector.id 
          ? { ...updatedSector, userCount: sector.userCount, status: sector.status }
          : sector
      ));
      
      toast({
        title: "Setor atualizado",
        description: `O setor "${formData.name}" foi atualizado com sucesso.`,
      });
      
      setShowEditModal(false);
      resetForm();
    } catch (error) {
      toast({
        title: "Erro ao atualizar setor",
        description: "Não foi possível atualizar o setor. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setFormLoading(false);
    }
  };

  const handleToggleSectorStatus = async () => {
    if (!selectedSector) return;

    const newStatus = selectedSector.status === 'active' ? 'inactive' : 'active';
    const actionText = newStatus === 'inactive' ? 'desativado' : 'ativado';

    try {
      setFormLoading(true);
      await ApiService.put(`/api/sectors/${selectedSector.id}`, {
        status: newStatus,
      });
      
      setSectors(sectors.map(sector => 
        sector.id === selectedSector.id 
          ? { ...sector, status: newStatus }
          : sector
      ));
      
      toast({
        title: `Setor ${actionText}`,
        description: `O setor "${selectedSector.name}" foi ${actionText} com sucesso.`,
      });
      
      setShowDeactivateModal(false);
    } catch (error) {
      toast({
        title: `Erro ao ${newStatus === 'inactive' ? 'desativar' : 'ativar'} setor`,
        description: "Não foi possível alterar o status do setor. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setFormLoading(false);
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
    <>
      <MainLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Gerenciar Setores</h1>
              <p className="text-gray-600">Organize os usuários por setores</p>
            </div>
            <Button onClick={openAddModal}>
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
                  <Button className="mt-4" onClick={openAddModal}>
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
                          <div className={`p-2 rounded-lg ${
                            sector.status === 'active' 
                              ? 'bg-blue-100' 
                              : 'bg-gray-100'
                          }`}>
                            <Building2 className={`h-5 w-5 ${
                              sector.status === 'active' 
                                ? 'text-blue-600' 
                                : 'text-gray-400'
                            }`} />
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant={sector.status === 'active' ? 'default' : 'secondary'}
                              className={
                                sector.status === 'active' 
                                  ? 'bg-green-100 text-green-800 hover:bg-green-100' 
                                  : 'bg-red-100 text-red-800 hover:bg-red-100'
                              }
                            >
                              {sector.status === 'active' ? (
                                <>
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Ativo
                                </>
                              ) : (
                                <>
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Inativo
                                </>
                              )}
                            </Badge>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openEditModal(sector)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Users className="h-4 w-4 mr-2" />
                                  Ver usuários ({sector.userCount || 0})
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className={sector.status === 'active' ? "text-red-600" : "text-green-600"}
                                  onClick={() => openDeactivateModal(sector)}
                                  disabled={sector.status === 'active' && (sector.userCount || 0) > 0}
                                >
                                  {sector.status === 'active' ? (
                                    <>
                                      <UserX className="h-4 w-4 mr-2" />
                                      Desativar
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle className="h-4 w-4 mr-2" />
                                      Ativar
                                    </>
                                  )}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <h3 className={`font-semibold mb-2 ${
                          sector.status === 'active' 
                            ? 'text-gray-900' 
                            : 'text-gray-500'
                        }`}>
                          {sector.name}
                        </h3>
                        {sector.description && (
                          <p className={`text-sm mb-3 ${
                            sector.status === 'active' 
                              ? 'text-gray-600' 
                              : 'text-gray-400'
                          }`}>
                            {sector.description}
                          </p>
                        )}
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            <span>{sector.userCount || 0} usuário(s)</span>
                          </div>
                          <span>ID: {sector.id?.substring(0, 8)}</span>
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

      {/* Add Sector Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Novo Setor
          </DialogTitle>
          <DialogDescription>
            Preencha as informações para criar um novo setor.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Setor *</Label>
            <Input
              id="name"
              placeholder="Ex: Recursos Humanos"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              disabled={formLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              placeholder="Descrição opcional do setor..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              disabled={formLoading}
              rows={3}
            />
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowAddModal(false)}
            disabled={formLoading}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleAddSector}
            disabled={formLoading || !formData.name.trim()}
          >
            {formLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Criando...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Criar Setor
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>

    {/* Edit Sector Modal */}
    <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Editar Setor
          </DialogTitle>
          <DialogDescription>
            Atualize as informações do setor.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Nome do Setor *</Label>
            <Input
              id="edit-name"
              placeholder="Ex: Recursos Humanos"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              disabled={formLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-description">Descrição</Label>
            <Textarea
              id="edit-description"
              placeholder="Descrição opcional do setor..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              disabled={formLoading}
              rows={3}
            />
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowEditModal(false)}
            disabled={formLoading}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleEditSector}
            disabled={formLoading || !formData.name.trim()}
          >
            {formLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Edit className="h-4 w-4 mr-2" />
                Salvar Alterações
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>

    {/* Deactivate/Activate Sector Modal */}
    <AlertDialog open={showDeactivateModal} onOpenChange={setShowDeactivateModal}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            {selectedSector?.status === 'active' ? (
              <>
                <UserX className="h-5 w-5 text-red-500" />
                Desativar Setor
              </>
            ) : (
              <>
                <CheckCircle className="h-5 w-5 text-green-500" />
                Ativar Setor
              </>
            )}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {selectedSector?.status === 'active' ? (
              <>
                Tem certeza que deseja desativar o setor{" "}
                <strong>"{selectedSector?.name}"</strong>?
                <br />
                <br />
                {(selectedSector?.userCount || 0) > 0 ? (
                  <span className="text-red-600 font-medium">
                    ⚠️ Este setor possui {selectedSector?.userCount} usuário(s) vinculado(s). 
                    Você precisa mover esses usuários para outro setor antes de desativar.
                  </span>
                ) : (
                  "O setor será marcado como inativo e não aparecerá nas opções de seleção."
                )}
              </>
            ) : (
              <>
                Tem certeza que deseja ativar o setor{" "}
                <strong>"{selectedSector?.name}"</strong>?
                <br />
                <br />
                O setor voltará a aparecer nas opções de seleção.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={formLoading}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleToggleSectorStatus}
            disabled={
              formLoading || 
              (selectedSector?.status === 'active' && (selectedSector?.userCount || 0) > 0)
            }
            className={
              selectedSector?.status === 'active' 
                ? "bg-red-600 hover:bg-red-700" 
                : "bg-green-600 hover:bg-green-700"
            }
          >
            {formLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {selectedSector?.status === 'active' ? 'Desativando...' : 'Ativando...'}
              </>
            ) : (
              <>
                {selectedSector?.status === 'active' ? (
                  <>
                    <UserX className="h-4 w-4 mr-2" />
                    Desativar
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Ativar
                  </>
                )}
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
