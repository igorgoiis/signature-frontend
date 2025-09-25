import { getSession } from 'next-auth/react';
import { FileType } from '../../types/file.type';

export { fileService } from '@/lib/api/services/fileService';

export const uploadFile = async (file: File): Promise<{ success: boolean, message?: string, data?: FileType }> => {
  const session = await getSession();
  const token = session?.accessToken || '';

  const formData = new FormData();
  formData.append('file', file);

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

  const response = await fetch(`${baseUrl}/files/upload`, {
    method: 'POST',
    body: formData,
    headers: {
      'Authorization': `Bearer ${token}`, // Exemplo de header adicional
    },
  });

  if (!response.ok) {
    return {
      success: false,
      message: `Erro ao fazer upload do arquivo: ${response.statusText}`,
    }
  }

  const data = await response.json() as FileType;

  return {
    success: true,
    data,
  };
}