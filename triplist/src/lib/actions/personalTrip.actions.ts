"use server";

import { createClient } from "@/lib/supabase/server";
import { getChecklistTemplate } from "@/lib/data/checklistTemplates";
import { calculateTripDays } from "@/utils/date";
import { revalidatePath } from "next/cache";

export interface CreatePersonalTripResult {
  success: boolean;
  error?: string;
  tripId?: number;
}

// グループ旅行をベースに個人旅行を作成（trip_links使用版）
export async function createPersonalTripFromGroupTrip(
  groupTripId: number
): Promise<CreatePersonalTripResult> {
  const supabase = await createClient();

  try {
    // 認証チェック
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "認証が必要です" };
    }

    // グループ旅行の情報を取得（位置情報も含む）
    const { data: groupTrip, error: groupTripError } = await supabase
      .from("trips")
      .select("*")
      .eq("trip_id", groupTripId)
      .eq("trip_type", "group")
      .single();

    if (groupTripError || !groupTrip) {
      return { success: false, error: "グループ旅行が見つかりません" };
    }

    // 位置情報が存在することを確認
    if (!groupTrip.latitude || !groupTrip.longitude) {
      return {
        success: false,
        error: "グループ旅行に位置情報が設定されていません",
      };
    }

    // ユーザーがグループのメンバーかチェック
    if (groupTrip.group_id) {
      const { data: member } = await supabase
        .from("group_members")
        .select("user_id")
        .eq("group_id", groupTrip.group_id)
        .eq("user_id", user.id)
        .single();

      if (!member) {
        return {
          success: false,
          error: "このグループにアクセスする権限がありません",
        };
      }
    }

    // 既にこのユーザーのリンクが存在するかチェック
    const { data: existingLink } = await supabase
      .from("trip_links")
      .select("personal_trip_id")
      .eq("group_trip_id", groupTripId)
      .eq("user_id", user.id)
      .single();

    if (existingLink) {
      return { success: false, error: "既に個人版の旅行が存在します" };
    }

    // トランザクション開始（Supabaseでは複数クエリを順次実行）
    // 1. 個人旅行を作成（位置情報も含める）
    const { data: newTrip, error: createError } = await supabase
      .from("trips")
      .insert({
        user_id: user.id,
        location_name: groupTrip.location_name,
        latitude: groupTrip.latitude,
        longitude: groupTrip.longitude,
        start_date: groupTrip.start_date,
        end_date: groupTrip.end_date,
        trip_type: "personal",
        group_id: null, // 個人旅行なのでgroup_idはnull
      })
      .select("trip_id")
      .single();

    if (createError || !newTrip) {
      console.error("個人旅行作成エラー:", createError);
      return { success: false, error: "個人旅行の作成に失敗しました" };
    }

    // 2. trip_linksテーブルに関連付けを作成
    const { error: linkError } = await supabase.from("trip_links").insert({
      group_trip_id: groupTripId,
      personal_trip_id: newTrip.trip_id,
      user_id: user.id,
    });

    if (linkError) {
      console.error("旅行リンク作成エラー:", linkError);

      // リンク作成に失敗した場合、作成した個人旅行を削除（ロールバック）
      await supabase.from("trips").delete().eq("trip_id", newTrip.trip_id);

      return { success: false, error: "旅行の関連付けに失敗しました" };
    }

    // 3. 個人旅行用のチェックリストテンプレートを作成
    try {
      const dateDiff = calculateTripDays(
        groupTrip.start_date,
        groupTrip.end_date
      );
      const checklistData = getChecklistTemplate(
        newTrip.trip_id,
        groupTrip.latitude,
        groupTrip.longitude,
        dateDiff,
        "personal" // 個人旅行用のテンプレート
      );

      // チェックリストデータをデータベースに挿入
      const { error: itemsError } = await supabase
        .from("items")
        .insert(checklistData);

      if (itemsError) {
        console.error("チェックリスト作成エラー:", itemsError);

        // チェックリスト作成に失敗した場合、作成した個人旅行とリンクを削除（ロールバック）
        await supabase
          .from("trip_links")
          .delete()
          .eq("personal_trip_id", newTrip.trip_id);
        await supabase.from("trips").delete().eq("trip_id", newTrip.trip_id);

        return { success: false, error: "チェックリストの作成に失敗しました" };
      }
    } catch (templateError) {
      console.error("テンプレート生成エラー:", templateError);

      // テンプレート生成に失敗した場合も同様にロールバック
      await supabase
        .from("trip_links")
        .delete()
        .eq("personal_trip_id", newTrip.trip_id);
      await supabase.from("trips").delete().eq("trip_id", newTrip.trip_id);

      return {
        success: false,
        error: "チェックリストテンプレートの生成に失敗しました",
      };
    }

    // 成功時は旅行リストとチェックリストページのキャッシュを更新してリダイレクト
    revalidatePath("/triplist", "page");
    revalidatePath(`/checklist/${newTrip.trip_id}`, "page");

    return { success: true, tripId: newTrip.trip_id };
  } catch (error) {
    console.error("個人旅行作成エラー:", error);
    return { success: false, error: "個人旅行の作成に失敗しました" };
  }
}
