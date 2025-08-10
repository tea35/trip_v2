"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getChecklistTemplate } from "@/lib/data/checklistTemplates";
import { calculateTripDays } from "@/utils/date";

// Server Actionの戻り値の型
interface ActionResult {
  error: string | null;
}

/**
 * 地域名から緯度経度を取得するサーバーサイド専用関数
 * @param address - 検索する場所の文字列
 */
async function fetchLatLng(address: string) {
  // ★修正点: サーバーサイド専用の環境変数名に変更
  // これにより、このAPIキーがサーバーでのみ使用されるべき機密情報であることが明確になります。
  // Vercelの環境変数設定も、この新しい名前（GOOGLE_MAPS_SERVER_KEY）で登録してください。
  const apiKey = process.env.GOOGLE_MAPS_SERVER_KEY;
  if (!apiKey) {
    throw new Error("Google Maps APIキーがサーバーに設定されていません。");
  }

  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
    address
  )}&key=${apiKey}&language=ja`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `Google Maps APIへのリクエストに失敗しました: ${response.statusText}`
    );
  }

  const data = await response.json();
  if (data.status !== "OK" || !data.results?.[0]) {
    console.error("Geocoding API Error:", data.error_message || data.status);
    throw new Error(`「${address}」の場所が見つかりませんでした。`);
  }

  return data.results[0].geometry.location; // { lat, lng }
}

/**
 * 新しい旅行プランを作成するサーバーアクション
 * @param prevState - useActionStateの前の状態
 * @param formData - フォームデータ
 */
export async function createTrip(
  prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const supabase = createClient();

  // 1. 認証ユーザー情報を取得
  const {
    data: { user },
  } = await (await supabase).auth.getUser();
  if (!user) {
    return { error: "認証されていません。ログインしてください。" };
  }

  // 2. フォームデータを取得
  const locationName = formData.get("location") as string;
  const startDateStr = formData.get("startDate") as string;
  const endDateStr = formData.get("endDate") as string;
  const groupId = formData.get("groupId") as string;
  const createBothTrips = formData.get("createBothTrips") === "on";

  if (!locationName || !startDateStr || !endDateStr) {
    return { error: "すべての必須フィールドを入力してください。" };
  }

  let newTripId: number | null = null;
  let personalTripId: number | null = null;
  let groupTripId: number | null = null;

  try {
    // 外部APIを呼び出して緯度経度を取得
    const location = await fetchLatLng(locationName);

    // グループ旅行の場合のグループメンバーシップ確認
    if (groupId) {
      const { data: membership } = await (await supabase)
        .from("group_members")
        .select("role")
        .eq("group_id", parseInt(groupId))
        .eq("user_id", user.id)
        .single();

      if (!membership) {
        return { error: "このグループのメンバーではありません。" };
      }
    }

    const baseTripData = {
      user_id: user.id,
      location_name: locationName,
      latitude: location.lat,
      longitude: location.lng,
      start_date: startDateStr,
      end_date: endDateStr,
    };

    if (groupId && createBothTrips) {
      // グループ旅行と個人旅行を両方作成して紐付け

      // 1. グループ旅行を作成
      const { data: groupTrip, error: groupTripError } = await (
        await supabase
      )
        .from("trips")
        .insert({
          ...baseTripData,
          group_id: parseInt(groupId),
          trip_type: "group",
        })
        .select("trip_id")
        .single();

      if (groupTripError) throw groupTripError;
      groupTripId = groupTrip.trip_id;

      // 2. 個人旅行を作成
      const { data: personalTrip, error: personalTripError } = await (
        await supabase
      )
        .from("trips")
        .insert({
          ...baseTripData,
          trip_type: "personal",
        })
        .select("trip_id")
        .single();

      if (personalTripError) throw personalTripError;
      personalTripId = personalTrip.trip_id;

      // 3. 紐付けを作成
      const { error: linkError } = await (await supabase)
        .from("trip_links")
        .insert({
          personal_trip_id: personalTripId,
          group_trip_id: groupTripId,
        });

      if (linkError) throw linkError;

      newTripId = personalTripId; // 個人旅行のページにリダイレクト
    } else if (groupId) {
      // グループ旅行のみ作成
      const { data: newTrip, error: tripError } = await (
        await supabase
      )
        .from("trips")
        .insert({
          ...baseTripData,
          group_id: parseInt(groupId),
          trip_type: "group",
        })
        .select("trip_id")
        .single();

      if (tripError) throw tripError;
      newTripId = newTrip.trip_id;
    } else {
      // 個人旅行のみ作成
      const { data: newTrip, error: tripError } = await (
        await supabase
      )
        .from("trips")
        .insert({
          ...baseTripData,
          trip_type: "personal",
        })
        .select("trip_id")
        .single();

      if (tripError) throw tripError;
      newTripId = newTrip.trip_id;
    }

    // 4. チェックリストデータを生成（全ての旅行に対して）
    const dateDiff = calculateTripDays(startDateStr, endDateStr);
    const tripsToCreateChecklistFor = [];

    if (personalTripId) tripsToCreateChecklistFor.push(personalTripId);
    if (groupTripId) tripsToCreateChecklistFor.push(groupTripId);
    if (!personalTripId && !groupTripId && newTripId)
      tripsToCreateChecklistFor.push(newTripId);

    for (const tripId of tripsToCreateChecklistFor) {
      const checklistData = getChecklistTemplate(
        tripId,
        location.lat,
        location.lng,
        dateDiff
      );

      // 5. チェックリストデータをデータベースに挿入
      const { error: itemsError } = await (await supabase)
        .from("items")
        .insert(checklistData);

      if (itemsError) throw itemsError;
    }
  } catch (error) {
    console.error("旅行作成プロセスでのエラー:", error);
    // エラー内容をクライアントに返す
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "旅行の作成中に不明なエラーが発生しました。" };
  }

  // 6. すべての処理が成功した場合、リダイレクト
  redirect(`/checklist/${newTripId}`);
}
