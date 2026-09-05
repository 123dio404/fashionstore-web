import { UUID } from './common.model';

export interface CityCreate {
  name: string;
  country?: string;
}

export interface CityUpdate {
  name?: string;
  country?: string;
}

export interface CityResponse extends CityCreate {
  id: UUID;
  country: string;
}

export interface BranchCreate {
  city_id: UUID;
  name: string;
  address: string;
  fitting_rooms?: number;
  manager_id?: UUID;
  is_active?: boolean;
}

export interface BranchUpdate {
  city_id?: UUID;
  name?: string;
  address?: string;
  fitting_rooms?: number;
  manager_id?: UUID;
  is_active?: boolean;
}

export interface BranchResponse extends Omit<BranchCreate, 'manager_id' | 'fitting_rooms' | 'is_active'> {
  id: UUID;
  manager_id: UUID | null;
  fitting_rooms: number;
  is_active: boolean;
}
