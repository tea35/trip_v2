import type { User } from "@supabase/supabase-js";

export interface Trip {
  trip_id: number;
  location_name: string;
  start_date: string;
  end_date: string;
  user_id?: string; // Supabaseのテーブル定義に合わせて調整
}

// クライアントコンポーネントが受け取るPropsの型
export interface TripListProps {
  user: User;
  initialTrips: Trip[];
}
