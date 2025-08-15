// lib/data/checklist.ts
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function getChecklistData(tripId: number) {
  const supabase = await createClient();

  // 認証チェック
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  // 旅行情報と、その旅行が本人に所有されているかを確認
  const { data: trip, error: tripError } = await supabase
    .from("trips")
    .select("location_name, group_id, trip_type")
    .eq("trip_id", tripId)
    .eq("user_id", user.id) // ★ 本人のデータか検証
    .single();

  if (tripError || !trip) {
    // データがないか、他人のデータにアクセスしようとした場合はリダイレクト
    redirect("/triplist");
  }

  // 紐付けされた旅行があるかチェック
  let linkedTrip = null;
  const { data: tripLink } = await supabase
    .from("trip_links")
    .select("personal_trip_id, group_trip_id")
    .or(`personal_trip_id.eq.${tripId},group_trip_id.eq.${tripId}`)
    .single();

  if (tripLink) {
    // 紐付けされた旅行のIDを取得
    const linkedTripId = tripLink.personal_trip_id === tripId 
      ? tripLink.group_trip_id 
      : tripLink.personal_trip_id;

    // 紐付けされた旅行の情報を取得
    const { data: linkedTripData } = await supabase
      .from("trips")
      .select("trip_id, location_name, group_id, trip_type")
      .eq("trip_id", linkedTripId)
      .eq("user_id", user.id)
      .single();

    if (linkedTripData) {
      linkedTrip = linkedTripData;
    }
  }

  // チェックリスト項目を取得
  const { data: items, error: itemsError } = await supabase
    .from("items")
    .select("item_id, item_name, quantity, is_checked")
    .eq("trip_id", tripId)
    .order("item_id", { ascending: true });

  const { data: setting, error: hide_completed_error } = await supabase
    .from("user_setting") // ユーザー設定を保存するテーブル名
    .select("hideCompleted")
    .eq("user_id", user.id)
    .single();

  if (itemsError) {
    console.error("Failed to fetch items:", itemsError);
    return { trip, linkedTrip, items: [], hide_completed: false }; // エラーでも画面は表示させる
  }
  if (hide_completed_error) {
    return { trip, linkedTrip, items, hide_completed: false };
  }
  return { trip, linkedTrip, items, hide_completed: !!setting?.hideCompleted };
}
