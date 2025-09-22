import { User } from "./user.type";

export type Sector = {
  id: number;
  name: string;
  description: string;
  users: User[];
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}