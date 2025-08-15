import type { User } from "@supabase/supabase-js";

export interface Trip {
  trip_id: number;
  location_name: string;
  start_date: string;
  end_date: string;
  user_id?: string; // Supabaseのテーブル定義に合わせて調整
  group_id?: number | null; // グループ旅行の場合のグループID
  trip_type?: "personal" | "group" | null; // 旅行タイプ
  hasLinkedTrip?: boolean; // 紐付けされた旅行があるかどうか
  linkedTripType?: "personal" | "group" | null; // 紐付けされた旅行のタイプ
  group_name?: string; // グループ名
  creator_name?: string; // グループ旅行の作成者名
  creator_email?: string; // グループ旅行の作成者メール
  hasPersonalVersion?: boolean; // 個人版が存在するか
  personalTripId?: number; // 個人版のID
  linkedTrips?: Trip[]; // 紐付けされた旅行のリスト（新規追加）
}

// trip_linksテーブルの型定義
export interface TripLink {
  id?: string;        // 新しいUUID主キー
  link_id?: number;   // 既存の主キー（後方互換性のため）
  group_trip_id: number;
  personal_trip_id: number;
  user_id?: string;   // 新規追加
  created_at?: string;
}

// 拡張されたTrip型（リンク情報を含む）
export interface ExtendedTrip extends Trip {
  trip_links?: TripLink[];
  linked_group_trip?: Trip;
  linked_personal_trips?: Trip[];
}

// クライアントコンポーネントが受け取るPropsの型
export interface TripListProps {
  user: User;
  initialTrips: Trip[];
}
