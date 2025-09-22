import { ApiClient } from "../core/apiClient";
import { FileType } from "../../../types/file.type";
import { BaseService } from "./baseService";

export class FileService extends BaseService {
  /**
   * Cria uma instância do serviço de files
   */
  constructor() {
    super('/files', ApiClient.getInstance());
  }

  async uploadFile(file: File): Promise<{ success: boolean; message: string; error?: string, file: FileType | null }> {
    const response = await this.uploadFileBase<FileType>('/upload', file);

    if (!response.success || !response.data) {
      return {
        success: false,
        message: response.message || response.error || 'Erro desconhecido',
        error: response.error,
        file: null,
      }
    }

    return {
      success: true,
      message: response.message || 'Upload realizado com sucesso',
      file: response.data
    };  
  }
}

export const fileService = new FileService();