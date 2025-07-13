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
    return { error: "Not authenticated" };
  }

  // 自分の旅行のみを削除できるように、user_idも条件に加える
  const { error } = await supabase
    .from("trips")
    .delete()
    .eq("trip_id", tripId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Delete trip error:", error);
    return { error: "旅行の削除に失敗しました。" };
  }

  // 旅行リストページのキャッシュをクリアして、表示を最新の状態に更新する
  revalidatePath("/triplist");

  return { success: true };
}
