import { createClient } from "@/lib/supabase/server";
import type { Trip } from "@/app/triplist/types"; // 型定義ファイルのパスを調整

// getTrips関数をエクスポートする
export async function getTrips(userId: string): Promise<Trip[]> {
  const supabase = await createClient();

  const { data: trips, error } = await supabase
    .from("trips")
    .select("trip_id, location_name, start_date, end_date")
    .eq("user_id", userId)
    .order("start_date", { ascending: true });
  if (error) {
    console.error("Failed to fetch trips:", error);
    return [];
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);

  const filteredTrips = trips.filter((trip: Trip) => {
    const endDate = new Date(trip.end_date);
    endDate.setHours(0, 0, 0, 0);
    return endDate >= yesterday;
  });

  return filteredTrips;
}
