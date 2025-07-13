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
    .select("location_name")
    .eq("trip_id", tripId)
    .eq("user_id", user.id) // ★ 本人のデータか検証
    .single();

  if (tripError || !trip) {
    // データがないか、他人のデータにアクセスしようとした場合はリダイレクト
    redirect("/triplist");
  }

  // チェックリスト項目を取得
  const { data: items, error: itemsError } = await supabase
    .from("items")
    .select("item_id, item_name, quantity, is_checked")
    .eq("trip_id", tripId)
    .order("item_id", { ascending: true });

  if (itemsError) {
    console.error("Failed to fetch items:", itemsError);
    return { trip, items: [] }; // エラーでも画面は表示させる
  }
  return { trip, items };
}
