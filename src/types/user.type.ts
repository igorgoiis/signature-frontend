import { Sector } from "./sector.type";

export enum UserRole {
  ADMIN = "admin",
  USER = "user",
  FINANCIAL = "financial",
}


export type User = {
  id: number;
  name: string;
  email: string
  password?: string;
  role: UserRole;
  sectorId: number | null;
  sector: Sector | null;
  createdAt: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}