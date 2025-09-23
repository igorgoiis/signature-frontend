// src/hooks/useUsers.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  userService,
  UserFilter,
  UserCreateRequest,
  UserUpdateRequest,
} from '../lib/api/services/userService';
import { User } from '@/types/user.type';

// Chave de query para identificar os dados de usuários no cache do React Query
const USERS_QUERY_KEY = 'users';

/**
 * Hook para buscar um usuário específico pelo ID.
 * @param userId - O ID do usuário a ser buscado.
 * @returns Um objeto contendo data, isLoading, isError, error, etc.
 */
export const useUser = (userId: string | undefined) => {
  return useQuery<User, Error>({
    queryKey: [USERS_QUERY_KEY, userId],
    queryFn: async () => {
      if (!userId) {
        throw new Error("User ID is required.");
      }
      const response = await userService.getUserById(userId);
      if (!response.success) {
        throw new Error(response.message || 'Falha ao carregar usuário.');
      }
      return response.data!;
    },
    enabled: !!userId, // A query só será executada se userId for um valor truthy
  });
};

/**
 * Hook para criar um novo usuário.
 * @returns Um objeto de mutação para criar usuários.
 */
export const useCreateUser = () => {
  const queryClient = useQueryClient(); // Obtém a instância do QueryClient

  return useMutation<User, Error, UserCreateRequest>({
    mutationFn: async (newUser) => {
      const response = await userService.createUser(newUser);
      if (!response.success) {
        throw new Error(response.message || 'Falha ao criar usuário.');
      }
      return response.data!;
    },
    onSuccess: () => {
      // Invalida o cache de todas as queries de usuários.
      // Isso fará com que qualquer componente usando `useUsers` re-busque os dados.
      queryClient.invalidateQueries({ queryKey: [USERS_QUERY_KEY] });
    },
    // Opcional: onError, onSettled, etc. para tratamento de erros ou finalização
  });
};

/**
 * Hook para atualizar um usuário existente.
 * @returns Um objeto de mutação para atualizar usuários.
 */
export const useUpdateUser = () => {
  const queryClient = useQueryClient();

  return useMutation<User, Error, { id: string; data: UserCreateRequest }>({
    mutationFn: async ({ id, data }) => {
      const response = await userService.updateUser(+id, data);
      if (!response.success) {
        throw new Error(response.message || 'Falha ao atualizar usuário.');
      }
      return response.data!;
    },
    onSuccess: (updatedUser) => {
      // Invalida o cache da lista de usuários
      queryClient.invalidateQueries({ queryKey: [USERS_QUERY_KEY] });
      // Opcional: Atualiza o cache de um usuário específico diretamente
      queryClient.setQueryData([USERS_QUERY_KEY, updatedUser.id], updatedUser);
    },
  });
};

/**
 * Hook para deletar um usuário.
 * @returns Um objeto de mutação para deletar usuários.
 */
export const useDeleteUser = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, number>({
    mutationFn: async (userId) => {
      const response = await userService.deleteUser(userId);
      if (!response.success) {
        throw new Error(response.message || 'Falha ao deletar usuário.');
      }
    },
    onSuccess: () => {
      // Invalida o cache da lista de usuários após a exclusão
      queryClient.invalidateQueries({ queryKey: [USERS_QUERY_KEY] });
    },
  });
};
