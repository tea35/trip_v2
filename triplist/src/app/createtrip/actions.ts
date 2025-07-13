"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getChecklistTemplate } from "@/lib/data/cheklistTemplates";
import { calculateTripDays } from "@/utils/date";

// Server Actionの戻り値の型
interface ActionResult {
  error: string | null;
}

// 地域名から緯度経度を取得するサーバーサイド関数
async function fetchLatLng(address: string) {
  // NEXT_PUBLIC_プレフィックスは不要。サーバーサイドでのみ使われる
  const apiKey = process.env.NEXT_PUBLIC_Maps_API_KEY;
  if (!apiKey) throw new Error("Google Maps APIキーが設定されていません。");

  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
    address
  )}&key=${apiKey}&language=ja`;

  const response = await fetch(url);
  const data = await response.json();

  if (data.status !== "OK" || data.results.length === 0) {
    throw new Error("指定された場所が見つかりませんでした。");
  }
  return data.results[0].geometry.location; // { lat, lng }
}

export async function createTrip(
  prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const supabase = await createClient();

  // 1. 認証ユーザー情報をCookieから安全に取得
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "認証されていません。" };
  }

  // 2. フォームからデータを取得
  const locationName = formData.get("location") as string;
  const startDateStr = formData.get("startDate") as string;
  const endDateStr = formData.get("endDate") as string;

  if (!locationName || !startDateStr || !endDateStr) {
    return { error: "すべてのフィールドを入力してください。" };
  }
  let newTripId: number | null = null;

  try {
    const location = await fetchLatLng(locationName);

    const tripData = {
      user_id: user.id,
      location_name: locationName,
      latitude: location.lat,
      longitude: location.lng,
      start_date: startDateStr,
      end_date: endDateStr,
    };

    // 1. 旅行データを挿入
    const { data: newTrip, error: tripError } = await supabase
      .from("trips")
      .insert(tripData)
      .select("trip_id")
      .single();

    if (tripError) throw tripError;
    if (!newTrip) throw new Error("旅行の作成に失敗しました。");

    newTripId = newTrip.trip_id; // リダイレクト用にIDを保持

    // 2. チェックリストデータを生成
    const dateDiff = calculateTripDays(startDateStr, endDateStr);
    const checklistData = getChecklistTemplate(
      newTrip.trip_id,
      location.lat,
      location.lng,
      dateDiff
    );

    // 3. チェックリストデータを挿入
    const { error: itemsError } = await supabase
      .from("items")
      .insert(checklistData);

    if (itemsError) throw itemsError;
  } catch (error) {
    console.error("旅行作成エラー:", error);
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "不明なエラーが発生しました。" };
  }

  // 4. すべての処理が成功した場合、try-catchブロックの外でリダイレクトを実行
  if (newTripId) {
    redirect(`/checklist/${newTripId}`);
  }

  // 通常、redirectが実行されるため、この行には到達しない
  return { error: "リダイレクトに失敗sしました。" };
}
