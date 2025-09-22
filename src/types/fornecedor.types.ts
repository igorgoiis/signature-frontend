export interface Fornecedor {
  id: number;
  codigo: string;
  cpfCnpj: string;
  razaoSocial: string;
  nomeFantasia: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}