import { UUID } from './common.model';

export enum Role {
  Administrador = 'Administrador',
  Encargado = 'Encargado',
  Cajero = 'Cajero',
  Cliente = 'Cliente',
  Proveedor = 'Proveedor'
}

export interface UserResponse {
  id: UUID;
  email: string;
  full_name: string;
  role: Role;
  is_active: boolean;
}

export interface RegisterRequest {
  email: string;
  full_name: string;
  password: string;
}

export interface UserCreate extends RegisterRequest {
  role?: Role;
  is_active?: boolean;
}

export interface UserUpdate {
  email?: string;
  full_name?: string;
  password?: string;
  role?: Role;
  is_active?: boolean;
}

export interface ProfileUpdate {
  email?: string;
  full_name?: string;
  password?: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: UserResponse;
}
