"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

interface LinkTripResult {
  error?: string;
  success?: boolean;
}

// 個人旅行とグループ旅行を紐付け
export async function linkTrips(
  personalTripId: number,
  groupTripId: number
): Promise<LinkTripResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "認証が必要です" };
  }

  try {
    // 既に紐付けされているかチェック
    const { data: existingLink } = await supabase
      .from("trip_links")
      .select("link_id")
      .eq("personal_trip_id", personalTripId)
      .eq("group_trip_id", groupTripId)
      .single();

    if (existingLink) {
      return { error: "既に紐付けされています" };
    }

    // 紐付けを作成
    const { error } = await supabase.from("trip_links").insert({
      personal_trip_id: personalTripId,
      group_trip_id: groupTripId,
    });

    if (error) throw error;

    revalidatePath("/triplist");
    revalidatePath(`/checklist/${personalTripId}`);
    revalidatePath(`/checklist/${groupTripId}`);

    return { success: true };
  } catch {
    return { error: "紐付けに失敗しました" };
  }
}

// 旅行の紐付けを解除
export async function unlinkTrips(
  personalTripId: number,
  groupTripId: number
): Promise<LinkTripResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "認証が必要です" };
  }

  try {
    const { error } = await supabase
      .from("trip_links")
      .delete()
      .eq("personal_trip_id", personalTripId)
      .eq("group_trip_id", groupTripId);

    if (error) throw error;

    revalidatePath("/triplist");
    return { success: true };
  } catch (error) {
    return { error: "紐付け解除に失敗しました" };
  }
}
