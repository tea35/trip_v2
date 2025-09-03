"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
/**
 * 指定されたIDの旅行を削除します。
 * @param tripId - 削除する旅行のID
 */
export async function deleteTrip(tripId: number) {
  const supabase = await createClient();

  // 認証チェック
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "認証が必要です。" };
  }

  try {
    // 削除対象の旅行情報を取得
    const { data: trip, error: tripError } = await supabase
      .from("trips")
      .select("trip_id, user_id, trip_type, group_id")
      .eq("trip_id", tripId)
      .single();

    if (tripError || !trip) {
      return { error: "旅行が見つかりません。" };
    }

    // 権限チェック
    if (trip.trip_type === "personal") {
      // 個人旅行の場合：作成者のみ削除可能
      if (trip.user_id !== user.id) {
        return { error: "この旅行を削除する権限がありません。" };
      }
    } else if (trip.trip_type === "group" && trip.group_id) {
      // グループ旅行の場合：グループの管理者のみ削除可能
      const { data: memberCheck, error: memberError } = await supabase
        .from("group_members")
        .select("role")
        .eq("group_id", trip.group_id)
        .eq("user_id", user.id)
        .single();

      if (memberError || !memberCheck) {
        return { error: "このグループにアクセスする権限がありません。" };
      }

      if (memberCheck.role !== "admin") {
        return { error: "グループの管理者でないため削除できません。" };
      }
    }

    // 1. trip_linksテーブルから関連するリンクを削除
    await supabase
      .from("trip_links")
      .delete()
      .or(`personal_trip_id.eq.${tripId},group_trip_id.eq.${tripId}`)
      .eq("user_id", user.id);

    // 2. 旅行を削除
    const { error: deleteError } = await supabase
      .from("trips")
      .delete()
      .eq("trip_id", tripId)
      .eq("user_id", user.id);

    if (deleteError) {
      console.error("Delete trip error:", deleteError);
      return { error: "旅行の削除に失敗しました。" };
    }

    // 旅行リストページのキャッシュをクリアして、表示を最新の状態に更新する
    revalidatePath("/triplist");

    return { success: true };
  } catch (error) {
    console.error("Delete trip process error:", error);
    return { error: "旅行の削除処理中にエラーが発生しました。" };
  }
}
