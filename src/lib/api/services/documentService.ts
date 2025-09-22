import { BaseService } from './baseService';
import { ApiResponse, RequestConfig } from '../core/types';
import { ApiClient } from '../core/apiClient'; // Importa o ApiClient
import { CreateDocumentDTO, Document } from '@/types/document.type';
import { DocumentSignatory } from '@/types/document-signatory.type';

export interface DocumentUploadData {
  file: File;
  name?: string;
  type?: string;
  // Adicione outros metadados que você queira enviar com o arquivo
}

export interface DocumentFilter {
  // search?: string;
  // type?: string;
  // page?: number;
  limit?: number;
  sort?: string;
  // Adicione outros filtros que sua API de documentos suporte
}

/**
 * Serviço responsável por operações relacionadas a documentos
 */
export class DocumentService extends BaseService {
  /**
   * Cria uma instância do serviço de documentos
   */
  constructor() {
    // Passa '/documents' como o endpoint base para o serviço de documentos
    // e usa a instância singleton do ApiClient
    super('/documents', ApiClient.getInstance());
  }

  /**
   * Obtém uma lista de documentos, opcionalmente filtrada.
   * 
   * @param filters - Filtros para a busca de documentos.
   * @returns Resposta contendo uma lista de documentos.
   */
  async getDocuments(filters?: DocumentFilter, config?: RequestConfig): Promise<ApiResponse<Document[]>> {
    let queryString = '';
    if (filters) {
      const params = new URLSearchParams();
      // Itera sobre as chaves do objeto filters
      // Usamos Object.keys e um type assertion para garantir que 'key' é uma chave de DocumentFilter
      for (const key of Object.keys(filters) as Array<keyof DocumentFilter>) {
        const value = filters[key]; // Agora TypeScript sabe que 'key' é válido para 'filters'
        if (value !== undefined && value !== null) {
          // Garante que o valor seja uma string para URLSearchParams
          params.append(key, String(value));
        }
      }
      queryString = params.toString();
    }

    // Constrói o endpoint com a string de consulta, se houver
    const endpoint = queryString ? `/?${queryString}` : '/';

    // O endpoint base '/documents' já está configurado no construtor
    // Então, chamamos apenas o caminho relativo para a listagem
    return await this.get<Document[]>(endpoint, config);
  }

  /**
   * Obtém um documento específico pelo seu ID.
   * 
   * @param id - O ID do documento.
   * @returns Resposta contendo os dados do documento.
   */
  async getDocumentById(id: string): Promise<ApiResponse<Document>> {
    // O endpoint base '/documents' já está configurado no construtor
    // Então, chamamos apenas o caminho relativo para o ID do documento
    return await this.get<Document>(`/${id}`);
  }

  /**
   * Faz upload de um novo documento.
   * 
   * @param data - Dados do documento para upload, incluindo o arquivo.
   * @returns Resposta contendo os dados do documento criado.
   */
  async processDocument(data: CreateDocumentDTO): Promise<ApiResponse<Document>> {
    return await this.post<Document>('/process', data);
  }

  /**
   * Atualiza os metadados de um documento existente.
   * 
   * @param id - O ID do documento a ser atualizado.
   * @param data - Os dados a serem atualizados.
   * @returns Resposta contendo os dados do documento atualizado.
   */
  async updateDocument(id: string, data: Partial<Document>): Promise<ApiResponse<Document>> {
    return await this.put<Document>(`/${id}`, data);
  }

  /**
   * Exclui um documento pelo seu ID.
   * 
   * @param id - O ID do documento a ser excluído.
   * @returns Resposta confirmando a exclusão.
   */
  async deleteDocument(id: string): Promise<ApiResponse<void>> {
    return await this.delete<void>(`/${id}`);
  }

  /**
   * Faz download de um documento.
   * 
   * @param id - O ID do documento a ser baixado.
   * @param fileName - Nome opcional para o arquivo baixado.
   * @returns Uma Promise que resolve com o Blob do arquivo.
   */
  async downloadDocument(id: number, fileName?: string): Promise<Blob> {
    return await this.downloadFile(`/${id}/download`, fileName);
  }

  async getDocumentSignatories(id: number): Promise<ApiResponse<DocumentSignatory[]>> {
    return await this.get<DocumentSignatory[]>(`${id}/signatories`);
  }

  async getInstallmentsForExpiredAndUpcomingDocuments(config?: RequestConfig): Promise<ApiResponse<Document[]>> {
    return await this.get<Document[]>('installments', config);
  }

  async payInstallment(
    documentId: number,
    installmentId: number,
    body: { fileId: number; paymentDate: string; },
    config?: RequestConfig
  ) {
    return this.post<string>(`${documentId}/pay/installment/${installmentId}`, body, config);
  }
}

// Exporta uma instância única do serviço de documentos
export const documentService = new DocumentService();
