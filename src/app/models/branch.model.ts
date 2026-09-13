import { ID } from './common.model';

export interface CityCreate {
  name: string;
}

export interface CityUpdate {
  name?: string;
}

export interface CityResponse {
  id: ID;
  name: string;
}

export interface BranchCreate {
  city_id: ID;
  name: string;
  address: string;
  is_active?: boolean;
}

export interface BranchUpdate {
  city_id?: ID;
  name?: string;
  address?: string;
  is_active?: boolean;
}

export interface BranchResponse {
  id: ID;
  city_id: ID;
  name: string;
  address: string;
  is_active: boolean;
}