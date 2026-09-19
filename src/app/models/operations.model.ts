import { Id } from './common.model';

export enum FacilityReservationStatus {
  Pendiente = 'pendiente',
  Confirmada = 'confirmada',
  Cancelada = 'cancelada',
  Completada = 'completada'
}

export enum Priority {
  Baja = 'baja',
  Media = 'media',
  Alta = 'alta'
}

export enum TaskStatus {
  Pendiente = 'pendiente',
  EnProgreso = 'en_progreso',
  Completada = 'completada',
  Cancelada = 'cancelada'
}

export interface FacilityCreate {
  name: string;
  description?: string;
  location?: string;
  capacity?: number;
  is_active?: boolean;
  open_time?: string;
  close_time?: string;
}

export type FacilityUpdate = Partial<FacilityCreate>;

export interface FacilityResponse {
  id: Id;
  name: string;
  description: string | null;
  location: string | null;
  capacity: number;
  is_active: boolean;
  open_time: string | null;
  close_time: string | null;
  created_by_id: Id;
  created_at: string;
  updated_at: string;
}

export interface TimeSlot {
  start_time: string;
  end_time: string;
  available: boolean;
  reason: string | null;
}

export interface FacilityAvailabilityResponse {
  facility_id: Id;
  facility_name: string;
  date: string;
  open_time: string | null;
  close_time: string | null;
  booked: number;
  capacity: number;
  slots: TimeSlot[];
}

export interface FacilityReservationCreate {
  facility_id: Id;
  date: string;
  start_time: string;
  end_time: string;
  notes?: string;
}

export interface FacilityReservationUpdate {
  date?: string;
  start_time?: string;
  end_time?: string;
  status?: FacilityReservationStatus;
  notes?: string;
}

export interface FacilityReservationResponse {
  id: Id;
  facility_id: Id;
  user_id: Id;
  date: string;
  start_time: string;
  end_time: string;
  status: FacilityReservationStatus;
  notes: string | null;
  created_at: string;
}

export interface MaintenanceCreate {
  title: string;
  description?: string;
  facility_id?: Id;
  assignee_id?: Id;
  priority?: Priority;
  status?: TaskStatus;
  scheduled_date?: string;
}

export interface MaintenanceUpdate {
  title?: string;
  description?: string;
  facility_id?: Id;
  assignee_id?: Id;
  priority?: Priority;
  status?: TaskStatus;
  scheduled_date?: string;
}

export interface MaintenanceResponse {
  id: Id;
  title: string;
  description: string | null;
  facility_id: Id | null;
  assignee_id: Id | null;
  priority: Priority;
  status: TaskStatus;
  scheduled_date: string | null;
  completed_at: string | null;
  created_by_id: Id;
  created_at: string;
  updated_at: string;
}

export interface FacilityUsageItem {
  facility_id: Id;
  facility_name: string;
  reservations_count: number;
  completed_count: number;
  cancelled_count: number;
  total_hours: number;
  capacity: number;
  occupancy_rate: number;
}

export interface FacilityUsageResponse {
  period: string;
  total_reservations: number;
  items: FacilityUsageItem[];
}