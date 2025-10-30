import type { User } from "@supabase/supabase-js";

export interface Trip {
  trip_id: number;
  location_name: string;
  start_date: string;
  end_date: string;
  group_id?: number | null;
  trip_type?: "personal" | "group" | null;
  hasLinkedTrip?: boolean;
  linkedTripType?: "personal" | "group" | null;
  group_name?: string;
  hasPersonalVersion?: boolean;
  personalTripId?: number;
  linkedTrips?: Trip[];
}

export interface TripLink {
  id?: string;
  link_id?: number;
  group_trip_id: number;
  personal_trip_id: number;
  user_id?: string;
  created_at?: string;
}

export interface ExtendedTrip extends Trip {
  trip_links?: TripLink[];
  linked_group_trip?: Trip;
  linked_personal_trips?: Trip[];
}

export interface TripListProps {
  user: User;
  initialTrips: Trip[];
}
