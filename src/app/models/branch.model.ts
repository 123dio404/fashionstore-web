import { Id } from './common.model';

export interface CityCreate {
  name: string;
}

export interface CityUpdate {
  name?: string;
}

export interface CityResponse {
  id: Id;
  name: string;
}

export interface BranchCreate {
  city_id: Id;
  name: string;
  address: string;
  is_active?: boolean;
}

export interface BranchUpdate {
  city_id?: Id;
  name?: string;
  address?: string;
  is_active?: boolean;
}

export interface BranchResponse {
  id: Id;
  city_id: Id;
  name: string;
  address: string;
  is_active: boolean;
}
