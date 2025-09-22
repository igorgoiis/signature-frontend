"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
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
  Trash2,
  ArchiveRestore,
  Users
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { sectorService } from "@/lib/api/services/sectorService";
import { Sector } from "@/types/sector.type";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { User, UserRole } from "@/types/user.type";

const createSectorFormSchema = z.object({
  id: z.number({ message: "O ID precisa ser um número" }).optional(),
  name: z.string({ message: "O nome precisa ser um texto" })
    .min(1, { message: "O nome é obrigatório" })
    .max(100, { message: "O nome não pode ter mais de 100 caracteres" }),
  description: z.string({ message: "O nome precisa ser um texto" })
  .max(500, { message: "A descrição deve ter no máximo 500 caracteres" })
  .optional()
});

type CreateSectorFormData = z.infer<typeof createSectorFormSchema>

export default function SetoresPage() {
  const { data: session } = useSession();
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [openCreateSectorModal, setOpenCreateSectorModal] = useState(false);
  const [openConfirmationDeletionAlert, setOpenConfirmationDeletionAlert] = useState(false);
  const [openConfirmationReactivationAlert, setOpenConfirmationReactivationAlert] = useState(false);
  const [sectorToDelete, setSectorToDelete] = useState<Sector>();
  const [sectorToReactivation, setSectorToReactivation] = useState<Sector>();
  const [sectorSelected, setSectorSelected] = useState<Sector>();
  const { toast } = useToast();
  const router = useRouter();

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<CreateSectorFormData>({
    resolver: zodResolver(createSectorFormSchema),
    defaultValues: {
      name: '',
      description: undefined,
      id: undefined,
    }
  });

  const form = watch()

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
      const response = await sectorService.getSectors(true);

      if (response.success && response.data) {
        setSectors(response.data);
      }
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

  const handleDeleteSector = async () => {
    try {
      if (!sectorToDelete) return;

      setLoading(true);
      setOpenConfirmationDeletionAlert(false);

      const response = await sectorService.deleteSector(sectorToDelete.id);

      if (!response.success) {
        toast({
          title: "Erro ao excluir setor",
          description: "Não foi possível excluir o setor. Verifique se não há usuários vinculados.",
            variant: "destructive",
        });

        return;
      }

      setSectorToDelete(undefined);
      
      toast({
        title: "Setor excluído",
        description: `O setor "${sectorToDelete.name}" foi excluído com sucesso.`,
      });

      await fetchSectors();
    } catch (error) {
      toast({
        title: "Erro ao excluir setor",
        description: "Não foi possível excluir o setor. Verifique se não há usuários vinculados.",
        variant: "destructive",
      });
    }
  };

  const handleReactiveSector = async () => {
    try {
      if (!sectorToReactivation) return;

      setLoading(true);
      setOpenConfirmationReactivationAlert(false);
      
      const response = await sectorService.restoreSector(sectorToReactivation.id);

      if (!response.success || !response.data) {
        toast({
          title: "Erro ao reativar setor",
          description: `O setor "${sectorToReactivation.name}" não foi reativado.`,
          duration: 4000,
          variant: "destructive",
        });

        return;
      }

      setSectorToReactivation(undefined);

      toast({
        title: "Setor reativado",
        description: `O setor "${sectorToReactivation.name}" foi reativado com sucesso.`,
        duration: 4000,
      });

      await fetchSectors();
    } catch(error) {
      toast({
        title: "Erro ao reativar setor",
        description: "Não foi possível reativar o setor.",
        duration: 4000,
        variant: "destructive",
      });
    }
  }

  const handleConfirmDeleteSector = (sector: Sector) => {
    setSectorToDelete(sector);
    setOpenConfirmationDeletionAlert(true);
  }

  const handleConfirmReactiveSector = (sector: Sector) => {
    setSectorToReactivation(sector);
    setOpenConfirmationReactivationAlert(true);
  }

  const onCreateOrEditSector = async (data: CreateSectorFormData) => {
    if (data.id) {
      const response = await sectorService.updateSector(data.id, data);

      if (!response.success || !response.data) {
        toast({
        title: "Erro ao tentar editar o setor",
        description: response.message || "Houve um erro ao tentar editar o setor, por favor tente novamente",
        duration: 4000,
      })

      return;
      }

      toast({
        title: "Setor editado com sucesso",
        duration: 4000,
      })

      setOpenCreateSectorModal(false);

      await fetchSectors();
      return;
    }

    const response = await sectorService.createSector(data);
    
    if (!response.success || !response.data) {
      toast({
        title: "Erro ao tentar criar o setor",
        description: response.message || "Houve um erro ao tentar criar o setor, por favor tente novamente",
        duration: 4000,
      })

      return;
    }

    toast({
      title: "Setor criado com sucesso",
      duration: 4000,
    })

    setOpenCreateSectorModal(false);
    await fetchSectors();
  }

  const renderUsersModal = async (sector: Sector) => {
    return (
       <Dialog open={true} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Usuários do Setor {sector.name}</DialogTitle>
            <DialogDescription>
              Lista de usuários do setor
            </DialogDescription>
          </DialogHeader>
          {sector.users.map((user, index) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <Card className="h-full hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Users className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">
                        {user.name}
                      </h3>
                    </div>
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
                    <span>{sector.deletedAt === null ? "ATIVO" : "INATIVO"}</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </DialogContent>
      </Dialog>
    );
  }

  const filteredSectors = sectors.filter(sector =>
    sector.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sector.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    if (!openCreateSectorModal) {
      reset({
        name: '',
        description: '',
        id: undefined,
      });
    }
  }, [openCreateSectorModal]);

  if (session?.user?.role !== "admin") {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gerenciar Setores</h1>
          <p className="text-gray-600">Organize os usuários por setores</p>
        </div>
        <Button onClick={() => setOpenCreateSectorModal(true)}>
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
                <Button className="mt-4" onClick={() => setOpenCreateSectorModal(true)}>
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
                            <DropdownMenuItem onClick={() => {
                              reset({
                                id: sector.id,
                                name: sector.name,
                                description: sector.description,
                              })

                              setOpenCreateSectorModal(true);
                            }}>
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            {sector.deletedAt ? (
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => handleConfirmReactiveSector(sector)}
                              >
                                <ArchiveRestore className="h-4 w-4 mr-2" />
                                Reativar
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => handleConfirmDeleteSector(sector)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Excluir
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => setSectorSelected(sector)}>
                              <Users className="h-4 w-4 mr-2" />
                              Ver usuários
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
                        <span>{sector.deletedAt === null ? "ATIVO" : "INATIVO"}</span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/** Modal de criação e edição do setor */}
      <Dialog open={openCreateSectorModal} onOpenChange={setOpenCreateSectorModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{form.id ? 'Editar' : 'Adicionar'} Setor</DialogTitle>
            <DialogDescription>
              {form.id ? 'Edite os dados do setor' : 'Preencha os dados para criar um novo setor no sistema.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onCreateOrEditSector)} className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Controller
                  control={control}
                  name="name"
                  render={({ field: { name, value, onChange } }) => (
                    <>
                      <Label htmlFor={name}>Nome</Label>
                      <Input
                        id={name}
                        value={value}
                        onChange={onChange}
                        maxLength={100}
                        required
                      />
                      {errors.name && <p className="text-red-700 text-sm">{errors.name.message}</p>}
                    </>
                  )}
                />
              </div>
              <div className="space-y-2">
                <Controller
                  control={control}
                  name="description"
                  render={({ field: { name, onChange, value } }) => (
                    <>
                      <Label htmlFor={name}>Descrição</Label>
                      <Textarea
                        id={name}
                        value={value}
                        onChange={onChange}
                        maxLength={500}
                      />
                      {errors.description && <p className="text-red-700 text-sm">{errors.description.message}</p>}
                    </>
                  )}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpenCreateSectorModal(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                 form.id ? <Edit className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />
                )}
                {form.id ? 'Editar' : 'Criar'} Setor
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/** Modal de usuários do setor */}
      {sectorSelected && (
        <Dialog  open={true} onOpenChange={() => setSectorSelected(undefined)}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Usuários do Setor {sectorSelected.name}</DialogTitle>
              <DialogDescription>
                Lista de usuários do setor
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col max-h-[600px] overflow-y-scroll gap-y-3">
              {sectorSelected.users.map((user, index) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Card className="h-full hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center">
                        <div className="p-2 mr-3 bg-blue-100 rounded-lg">
                          <Users className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-2">
                            {user.name}
                          </h3>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 mb-3">
                        {user.email}
                      </p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>ID: {user.id}</span>
                        <span>Perfil: {user.role === UserRole.ADMIN ? 'Administrador' : "Usuário"}</span>
                        <span>{user.deletedAt === null ? "ATIVO" : "INATIVO"}</span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/** Dialog de confirmação de exclusão */}
      <AlertDialog open={openConfirmationDeletionAlert} onOpenChange={setOpenConfirmationDeletionAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza que deseja excluir o setor {sectorToDelete?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação poderá ser desfeita posteriormente!
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Não</AlertDialogCancel>
            <Button onClick={() => handleDeleteSector()}>Sim</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/** Dialog de confirmação de reativação */}
      <AlertDialog open={openConfirmationReactivationAlert} onOpenChange={setOpenConfirmationReactivationAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza que deseja reativar o setor {sectorToReactivation?.name}?</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Não</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleReactiveSector()}>Sim</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
