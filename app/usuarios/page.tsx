
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Users, 
  Search, 
  Plus, 
  MoreHorizontal, 
  Shield,
  User as UserIcon,
  Loader2,
  Edit,
  Trash2,
  UserX,
  X,
  Check,
  Building2
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { User, Sector } from "@/lib/types";
import { ApiService } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

interface UserFormData {
  name: string;
  email: string;
  password?: string;
  role: 'admin' | 'user';
  sectorId?: string;
}

export default function UsuariosPage() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeactivateModalOpen, setIsDeactivateModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<UserFormData>({
    name: "",
    email: "",
    password: "",
    role: "user",
    sectorId: "none",
  });
  const [formLoading, setFormLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    // Check if user is admin
    if (session?.user?.role !== "admin") {
      router.push("/dashboard");
      return;
    }
    fetchUsers();
    fetchSectors();
  }, [session, router]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await ApiService.get("/users");
      setUsers(data);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        title: "Erro ao carregar usuários",
        description: "Não foi possível carregar a lista de usuários.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSectors = async () => {
    try {
      const data = await ApiService.get("/sectors");
      setSectors(data);
    } catch (error) {
      console.error("Error fetching sectors:", error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      password: "",
      role: "user",
      sectorId: "none",
    });
  };

  // Helper function to transform form data for backend
  const transformFormDataForBackend = (data: UserFormData) => {
    return {
      ...data,
      sectorId: data.sectorId === "none" ? null : data.sectorId,
      // Remove password if empty (for edit operations)
      ...(data.password === "" && { password: undefined })
    };
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      const transformedData = transformFormDataForBackend(formData);
      const newUser = await ApiService.post("/users", transformedData);
      setUsers([...users, newUser]);
      setIsAddModalOpen(false);
      resetForm();
      toast({
        title: "Usuário criado",
        description: "O usuário foi criado com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro ao criar usuário",
        description: "Não foi possível criar o usuário. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    setFormLoading(true);

    try {
      const transformedData = transformFormDataForBackend(formData);
      const updatedUser = await ApiService.put(`/users/${selectedUser.id}`, transformedData);
      setUsers(users.map(user => user.id === selectedUser.id ? updatedUser : user));
      setIsEditModalOpen(false);
      setSelectedUser(null);
      resetForm();
      toast({
        title: "Usuário atualizado",
        description: "O usuário foi atualizado com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro ao atualizar usuário",
        description: "Não foi possível atualizar o usuário. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeactivateUser = async () => {
    if (!selectedUser) return;

    try {
      const updatedUser = await ApiService.put(`/users/${selectedUser.id}`, {
        status: selectedUser.status === 'active' ? 'inactive' : 'active'
      });
      setUsers(users.map(user => user.id === selectedUser.id ? updatedUser : user));
      setIsDeactivateModalOpen(false);
      setSelectedUser(null);
      toast({
        title: selectedUser.status === 'active' ? "Usuário desativado" : "Usuário ativado",
        description: `O usuário foi ${selectedUser.status === 'active' ? 'desativado' : 'ativado'} com sucesso.`,
      });
    } catch (error) {
      toast({
        title: "Erro ao alterar status",
        description: "Não foi possível alterar o status do usuário. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleRoleChange = async (userId: string, newRole: 'admin' | 'user') => {
    try {
      const updatedUser = await ApiService.put(`/users/${userId}`, { role: newRole });
      setUsers(users.map(user => user.id === userId ? updatedUser : user));
      toast({
        title: "Role atualizada",
        description: "A role do usuário foi atualizada com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro ao atualizar role",
        description: "Não foi possível atualizar a role do usuário.",
        variant: "destructive",
      });
    }
  };

  const handleSectorChange = async (userId: string, newSectorId: string) => {
    try {
      const sectorId = newSectorId === "none" ? null : newSectorId;
      const updatedUser = await ApiService.put(`/users/${userId}`, { sectorId });
      setUsers(users.map(user => user.id === userId ? updatedUser : user));
      toast({
        title: "Setor atualizado",
        description: "O setor do usuário foi atualizado com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro ao atualizar setor",
        description: "Não foi possível atualizar o setor do usuário.",
        variant: "destructive",
      });
    }
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      sectorId: user.sectorId || "none",
    });
    setIsEditModalOpen(true);
  };

  const openDeactivateModal = (user: User) => {
    setSelectedUser(user);
    setIsDeactivateModalOpen(true);
  };

  const getRoleColor = (role: string) => {
    return role === "admin" 
      ? "bg-purple-100 text-purple-800" 
      : "bg-blue-100 text-blue-800";
  };

  const getRoleText = (role: string) => {
    return role === "admin" ? "Administrador" : "Usuário";
  };

  const getRoleIcon = (role: string) => {
    return role === "admin" ? Shield : UserIcon;
  };

  const getStatusColor = (status: string) => {
    return status === "active" 
      ? "bg-green-100 text-green-800" 
      : "bg-red-100 text-red-800";
  };

  const getStatusText = (status: string) => {
    return status === "active" ? "Ativo" : "Inativo";
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
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
            <h1 className="text-2xl font-bold text-gray-900">Gerenciar Usuários</h1>
            <p className="text-gray-600">Administre todos os usuários do sistema</p>
          </div>
          <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { resetForm(); setIsAddModalOpen(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Usuário
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Adicionar Usuário</DialogTitle>
                <DialogDescription>
                  Preencha os dados para criar um novo usuário no sistema.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddUser} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select
                      value={formData.role}
                      onValueChange={(value: 'admin' | 'user') => setFormData({...formData, role: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">Usuário</SelectItem>
                        <SelectItem value="admin">Administrador</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sector">Setor</Label>
                    <Select
                      value={formData.sectorId}
                      onValueChange={(value) => setFormData({...formData, sectorId: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o setor" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Nenhum setor</SelectItem>
                        {sectors.map((sector) => (
                          <SelectItem key={sector.id} value={sector.id}>
                            {sector.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAddModalOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={formLoading}>
                    {formLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Plus className="h-4 w-4 mr-2" />
                    )}
                    Criar Usuário
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar usuários..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Users List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {filteredUsers.length} usuário(s) encontrado(s)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhum usuário encontrado
                </h3>
                <p className="text-gray-500">
                  {searchTerm 
                    ? "Tente ajustar os termos de busca"
                    : "Comece adicionando o primeiro usuário"}
                </p>
                {!searchTerm && (
                  <Button className="mt-4" onClick={() => setIsAddModalOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Usuário
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredUsers.map((user, index) => {
                  const RoleIcon = getRoleIcon(user.role);
                  return (
                    <motion.div
                      key={user.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="p-2 bg-gray-100 rounded-full">
                          <RoleIcon className="h-5 w-5 text-gray-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 flex items-center gap-2">
                            {user.name}
                            <Badge className={getStatusColor(user.status)}>
                              {getStatusText(user.status)}
                            </Badge>
                          </h3>
                          <p className="text-sm text-gray-500">
                            {user.email}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Select
                              value={user.role}
                              onValueChange={(value: 'admin' | 'user') => handleRoleChange(user.id, value)}
                            >
                              <SelectTrigger className="w-32 h-7 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="user">Usuário</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                              </SelectContent>
                            </Select>
                            
                            <Select
                              value={user.sectorId || "none"}
                              onValueChange={(value) => handleSectorChange(user.id, value)}
                            >
                              <SelectTrigger className="w-40 h-7 text-xs">
                                <SelectValue placeholder="Setor">
                                  {user.sector ? user.sector.name : "Sem setor"}
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">Sem setor</SelectItem>
                                {sectors.map((sector) => (
                                  <SelectItem key={sector.id} value={sector.id}>
                                    {sector.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditModal(user)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openDeactivateModal(user)}>
                              <UserX className="h-4 w-4 mr-2" />
                              {user.status === 'active' ? 'Desativar' : 'Ativar'}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit User Modal */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Editar Usuário</DialogTitle>
              <DialogDescription>
                Altere os dados do usuário selecionado.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEditUser} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Nome</Label>
                  <Input
                    id="edit-name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-email">Email</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-password">Nova Senha (opcional)</Label>
                <Input
                  id="edit-password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  placeholder="Deixe em branco para manter a senha atual"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-role">Role</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value: 'admin' | 'user') => setFormData({...formData, role: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">Usuário</SelectItem>
                      <SelectItem value="admin">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-sector">Setor</Label>
                  <Select
                    value={formData.sectorId || "none"}
                    onValueChange={(value) => setFormData({...formData, sectorId: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o setor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhum setor</SelectItem>
                      {sectors.map((sector) => (
                        <SelectItem key={sector.id} value={sector.id}>
                          {sector.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={formLoading}>
                  {formLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Check className="h-4 w-4 mr-2" />
                  )}
                  Atualizar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Deactivate User Modal */}
        <AlertDialog open={isDeactivateModalOpen} onOpenChange={setIsDeactivateModalOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {selectedUser?.status === 'active' ? 'Desativar' : 'Ativar'} Usuário
              </AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja {selectedUser?.status === 'active' ? 'desativar' : 'ativar'} o usuário "{selectedUser?.name}"? 
                {selectedUser?.status === 'active' && ' O usuário não poderá mais acessar o sistema.'}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeactivateUser}
                className={selectedUser?.status === 'active' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}
              >
                {selectedUser?.status === 'active' ? 'Desativar' : 'Ativar'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </MainLayout>
  );
}
