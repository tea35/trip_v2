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

  // 旅行情報を取得
  const { data: trip, error: tripError } = await supabase
    .from("trips")
    .select("location_name, group_id, trip_type, user_id")
    .eq("trip_id", tripId)
    .single();

  if (tripError || !trip) {
    redirect("/triplist");
  }

  // アクセス権限チェック
  let hasAccess = false;

  if (trip.user_id === user.id) {
    // 自分が作成した旅行の場合
    hasAccess = true;
  } else if (trip.trip_type === "group" && trip.group_id) {
    // グループ旅行の場合、グループメンバーかチェック
    const { data: memberCheck } = await supabase
      .from("group_members")
      .select("user_id")
      .eq("group_id", trip.group_id)
      .eq("user_id", user.id)
      .single();

    if (memberCheck) {
      hasAccess = true;
    }
  }

  if (!hasAccess) {
    // アクセス権限がない場合はリダイレクト
    redirect("/triplist");
  }

  // 紐付けされた旅行があるかチェック
  let linkedTrip = null;

  // 現在のユーザーに関連するリンクのみを取得
  const { data: tripLinks } = await supabase
    .from("trip_links")
    .select("personal_trip_id, group_trip_id, user_id")
    .eq("user_id", user.id)
    .or(`personal_trip_id.eq.${tripId},group_trip_id.eq.${tripId}`);

  if (tripLinks && tripLinks.length > 0) {
    // 現在のtripIdに関連するリンクを見つける
    const tripLink = tripLinks.find(
      (link) =>
        link.personal_trip_id === tripId || link.group_trip_id === tripId
    );

    if (tripLink) {
      // 紐付けされた旅行のIDを取得
      const linkedTripId =
        tripLink.personal_trip_id === tripId
          ? tripLink.group_trip_id
          : tripLink.personal_trip_id;

      // 紐付けされた旅行の情報を取得
      const { data: linkedTripData } = await supabase
        .from("trips")
        .select("trip_id, location_name, group_id, trip_type, user_id")
        .eq("trip_id", linkedTripId)
        .single();

      if (linkedTripData) {
        // リンクされた旅行のアクセス権限もチェック
        let linkedHasAccess = false;

        if (linkedTripData.user_id === user.id) {
          linkedHasAccess = true;
        } else if (
          linkedTripData.trip_type === "group" &&
          linkedTripData.group_id
        ) {
          const { data: linkedMemberCheck } = await supabase
            .from("group_members")
            .select("user_id")
            .eq("group_id", linkedTripData.group_id)
            .eq("user_id", user.id)
            .single();

          if (linkedMemberCheck) {
            linkedHasAccess = true;
          }
        }

        if (linkedHasAccess) {
          linkedTrip = linkedTripData;
        } else {
          console.log("LinkedTrip access denied");
        }
      }
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
