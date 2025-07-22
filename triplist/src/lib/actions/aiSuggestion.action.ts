"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// Server Actionの戻り値の型
interface SuggestionResult {
  ai_suggestion_counts?: number;
  suggestions?: string[];
  error?: string;
}

interface TripInfo {
  location_name: string;
  start_date: string;
  end_date: string;
  items: { item_name: string }[];
}

export async function getAiUsageCount(): Promise<{
  count: number;
  limit: number;
  error?: string;
}> {
  const dailyLimitValue = process.env.AI_SUGGESTION_DAILY_LIMIT ?? "3";
  const dailyLimit = parseInt(dailyLimitValue, 10);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    // ログインしていない場合は0回として扱う
    return { count: dailyLimit, limit: dailyLimit, error: "Not authenticated" };
  }

  const { data: userSetting, error } = await supabase
    .from("user_setting")
    .select("ai_suggestion_counts")
    .eq("user_id", user.id)
    .single();

  if (error) {
    console.error("Error fetching usage count:", error);
    // エラー時は利用不可として扱う
    return { count: dailyLimit, limit: dailyLimit };
  }

  return { count: userSetting.ai_suggestion_counts, limit: dailyLimit };
}

function getMockSuggestions(): string[] {
  return [
    "予備のバッテリー",
    "トラベルピロー",
    "ウェットティッシュ",
    "常備薬",
    "エコバッグ",
  ];
}
/**
 * LLM（Gemini）に持ち物の提案を問い合わせる
 * @param tripId 現在の旅行ID
 * @returns 提案された持ち物の配列、またはエラーメッセージ
 */
export async function getAiSuggestions(
  tripId: number // tripIdを引数に追加
): Promise<SuggestionResult> {
  // Vercelの環境変数をチェックし、本番環境以外ではダミーデータを返す
  if (process.env.VERCEL_ENV !== "production") {
    console.log("--- STAGING/DEV MODE: Using mock AI suggestions. ---");
    // ネットワーク遅延をシミュレート（任意）
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return { suggestions: getMockSuggestions() };
  }
  const supabase = await createClient();

  // 回数制限の確認
  // 1. ユーザーの現在の利用回数を取得
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "認証されていません。" };
  }
  const { data: userSetting, error: settingError } = await supabase
    .from("user_setting") // テーブル名を user_setting に変更
    .select("ai_suggestion_counts")
    .eq("user_id", user.id) // user_settingテーブルのidがuser.idと一致するものを検索
    .single();

  if (settingError) {
    console.error("Error fetching user_setting for rate limit:", settingError);
    return { error: "ユーザー情報の取得に失敗しました。" };
  }

  // 2. 上限回数に達しているかチェック (日付比較は不要)
  const dailyLimitValue = Number(process.env.AI_SUGGESTION_DAILY_LIMIT) ?? 3;
  if (userSetting.ai_suggestion_counts >= dailyLimitValue) {
    return {
      error: `AI提案の利用は1日${dailyLimitValue}回までです。明日またお試しください。`,
    };
  }
  // GPT問い合わせ
  // 1. 旅行情報と既存のチェックリストアイテムを取得
  // 1. tripIdを元に、旅行先と期間、既存のアイテムリストを取得
  const { data, error: tripError } = await supabase
    .from("trips")
    .select("location_name, start_date, end_date, items(item_name)")
    .eq("trip_id", tripId)
    .single();

  if (tripError || !data) {
    console.error("Error fetching trip information:", tripError);
    return { error: "旅行情報の取得に失敗しました。" };
  }

  // 型アサーションを使って、dataの型をTypeScriptに伝える
  const tripInformation = data as TripInfo;

  // 取得した情報が有効か確認
  const {
    location_name,
    start_date,
    end_date,
    items: existingItems,
  } = tripInformation;
  if (!location_name || !start_date || !end_date) {
    return { error: "旅行の場所または期間が設定されていません。" };
  }

  const existingItemNames = existingItems.map((item) => item.item_name);

  // 2. LLMへのプロンプトを生成（既存アイテムを除外するように指示）
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return { error: "AIのAPIキーが設定されていません。" };
  }

  const existingItemsText =
    existingItemNames.length > 0
      ? `現在のリストには「${existingItemNames.join(
          "、"
        )}」が既にあります。これらを除外して提案してください。`
      : "";

  const prompt = `${location_name}へ${start_date}から${end_date}まで旅行します。この旅行に特有の持ち物を10個提案してください。${existingItemsText}回答は["アイテム1", "アイテム2", ...]の形式のJSON配列で、キーは"items"としてください。`;
  try {
    // 3. LLMに問い合わせ
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
          },
        }),
      }
    );

    if (!response.ok) {
      console.error("Gemini API Error:", await response.text());
      return { error: "AIからの応答取得に失敗しました。" };
    }

    const data = await response.json();
    const jsonString = data.candidates[0].content.parts[0].text;
    const parsed = JSON.parse(jsonString);

    await supabase
      .from("user_setting")
      .update({
        ai_suggestion_counts: userSetting.ai_suggestion_counts + 1,
      })
      .eq("user_id", user.id);

    return {
      ai_suggestion_counts: userSetting.ai_suggestion_counts + 1,
      suggestions: parsed.items,
    };
  } catch (error) {
    console.error("AI提案の取得中にエラーが発生しました:", error);
    return { error: "AI提案の処理中にエラーが発生しました。" };
  }
}

interface SelectedItem {
  item_name: string;
  quantity: number;
}

/**
 * ユーザーが選択した持ち物をチェックリストに追加する
 * @param tripId 旅行ID
 * @param items 追加するアイテム名の配列
 */
export async function addSuggestedItems(tripId: number, items: SelectedItem[]) {
  if (items.length === 0) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const itemsToInsert = items.map((item) => ({
    trip_id: tripId,
    item_name: item.item_name,
    quantity: item.quantity,
    is_checked: false,
  }));

  const { error } = await supabase.from("items").insert(itemsToInsert);
  if (error) {
    console.error("Add suggested items error:", error);
    return;
  }

  revalidatePath(`/checklist/${tripId}`);
}
