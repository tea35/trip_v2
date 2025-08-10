import { createClient } from "@/lib/supabase/server";
import { Trip } from "@/app/triplist/types";

export interface TripWithLink extends Trip {
  linked_trip?: Trip;
  is_linked: boolean;
  trip_type: 'personal' | 'group';
}

// 紐付けを考慮したtrips取得（Triplist画面用）
export async function getTripsWithLinks(userId: string): Promise<TripWithLink[]> {
  const supabase = await createClient();

  // 1. 全ての旅行を取得（個人＋グループ）
  const { data: allTrips, error } = await supabase
    .from("trips")
    .select(`
      *,
      trip_links_personal:trip_links!trip_links_personal_trip_id_fkey(
        group_trip_id,
        group_trip:trips!trip_links_group_trip_id_fkey(*)
      ),
      trip_links_group:trip_links!trip_links_group_trip_id_fkey(
        personal_trip_id,
        personal_trip:trips!trip_links_personal_trip_id_fkey(*)
      ),
      groups(group_name)
    `)
    .or(`user_id.eq.${userId},groups.group_members.user_id.eq.${userId}`)
    .order("first_date", { ascending: true });

  if (error) {
    console.error("Failed to fetch trips:", error);
    return [];
  }

  // 2. 紐付けされているペアを抽出
  const linkedPairs = new Set<string>();
  const result: TripWithLink[] = [];

  allTrips?.forEach((trip) => {
    const tripKey = `${trip.trip_id}_${trip.trip_type}`;
    
    // 既に処理済みならスキップ
    if (linkedPairs.has(tripKey)) return;

    if (trip.trip_type === 'personal' && trip.trip_links_personal?.length > 0) {
      // 個人旅行で紐付けあり
      const linkedGroupTrip = trip.trip_links_personal[0].group_trip;
      
      result.push({
        ...trip,
        linked_trip: linkedGroupTrip,
        is_linked: true,
        trip_type: 'personal'
      });
      
      // 対応するグループ旅行は表示しない
      linkedPairs.add(`${linkedGroupTrip.trip_id}_group`);
      linkedPairs.add(tripKey);
      
    } else if (trip.trip_type === 'group' && trip.trip_links_group?.length > 0) {
      // グループ旅行で紐付けあり（個人旅行側で処理済みでなければ）
      const linkedPersonalTrip = trip.trip_links_group[0].personal_trip;
      
      if (!linkedPairs.has(`${linkedPersonalTrip.trip_id}_personal`)) {
        result.push({
          ...linkedPersonalTrip,
          linked_trip: trip,
          is_linked: true,
          trip_type: 'personal'
        });
        
        linkedPairs.add(`${trip.trip_id}_group`);
        linkedPairs.add(`${linkedPersonalTrip.trip_id}_personal`);
      }
      
    } else {
      // 紐付けなしの旅行
      result.push({
        ...trip,
        is_linked: false,
        trip_type: trip.trip_type || 'personal'
      });
      
      linkedPairs.add(tripKey);
    }
  });

  return result;
}

// チェックリスト画面用：紐付けされた旅行のアイテムを両方取得
export async function getLinkedChecklistData(tripId: number) {
  const supabase = await createClient();

  // 指定された旅行の情報を取得
  const { data: mainTrip } = await supabase
    .from("trips")
    .select(`
      *,
      trip_links_personal:trip_links!trip_links_personal_trip_id_fkey(
        group_trip_id,
        group_trip:trips!trip_links_group_trip_id_fkey(*)
      ),
      trip_links_group:trip_links!trip_links_group_trip_id_fkey(
        personal_trip_id,
        personal_trip:trips!trip_links_personal_trip_id_fkey(*)
      )
    `)
    .eq("trip_id", tripId)
    .single();

  if (!mainTrip) return null;

  // 紐付けされた旅行IDを特定
  let linkedTripId: number | null = null;
  
  if (mainTrip.trip_type === 'personal' && mainTrip.trip_links_personal?.length > 0) {
    linkedTripId = mainTrip.trip_links_personal[0].group_trip_id;
  } else if (mainTrip.trip_type === 'group' && mainTrip.trip_links_group?.length > 0) {
    linkedTripId = mainTrip.trip_links_group[0].personal_trip_id;
  }

  // アイテムを取得（メイン旅行＋紐付け旅行）
  const tripIds = linkedTripId ? [tripId, linkedTripId] : [tripId];
  
  const { data: items } = await supabase
    .from("items")
    .select("*")
    .in("trip_id", tripIds)
    .order("created_at", { ascending: true });

  return {
    mainTrip,
    linkedTrip: linkedTripId ? (
      mainTrip.trip_type === 'personal' 
        ? mainTrip.trip_links_personal[0].group_trip
        : mainTrip.trip_links_group[0].personal_trip
    ) : null,
    items: items || []
  };
}
