// データベースに挿入する最終的なアイテムの型
export interface ChecklistItemInsert {
  trip_id: number;
  item_name: string;
  quantity: number;
  is_checked: boolean;
}

// テンプレートを定義するための基本的な型
interface BaseTemplateItem {
  item_name: string;
  quantity: number;
}

// 国内旅行のテンプレート（個人旅行用）
const personalDomesticTemplate: BaseTemplateItem[] = [
  { item_name: "財布・現金", quantity: 1 },
  { item_name: "スマートフォン", quantity: 1 },
  { item_name: "充電器", quantity: 1 },
  { item_name: "歯ブラシ", quantity: 1 },
  { item_name: "化粧品・スキンケア", quantity: 1 },
  { item_name: "折りたたみ傘", quantity: 1 },
];

// 国外旅行のテンプレート（個人旅行用）
const personalInternationalTemplate: BaseTemplateItem[] = [
  { item_name: "パスポート", quantity: 1 },
  ...personalDomesticTemplate, // 国内テンプレートを再利用
];

// グループ旅行用の国内テンプレート
const groupDomesticTemplate: BaseTemplateItem[] = [
  { item_name: "救急セット", quantity: 1 },
  { item_name: "ウェットティッシュ", quantity: 2 },
  { item_name: "ごみ袋", quantity: 5 },
  { item_name: "モバイルバッテリー", quantity: 1 },
  { item_name: "お菓子・おつまみ", quantity: 3 },
  { item_name: "カメラ", quantity: 1 },
  { item_name: "日焼け止め", quantity: 1 },
  { item_name: "虫除けスプレー", quantity: 1 },
];

// グループ旅行用の国外テンプレート
const groupInternationalTemplate: BaseTemplateItem[] = [
  { item_name: "海外旅行保険証", quantity: 1 },
  { item_name: "変換プラグ", quantity: 1 },
  { item_name: "翻訳アプリ", quantity: 1 },
  ...groupDomesticTemplate, // グループ国内テンプレートを再利用
];

// 服や下着など、日数に依存する項目
const dailyItems = (dateDiff: number): BaseTemplateItem[] => [
  { item_name: "服", quantity: dateDiff },
  { item_name: "下着・靴下", quantity: dateDiff },
  { item_name: "タオル", quantity: dateDiff },
];

/**
 * 緯度経度、旅行日数、旅行タイプに応じて、データベースに挿入できる形式の
 * チェックリスト項目配列を生成して返します。
 * @param tripId - 紐付ける旅行のID
 * @param latitude - 緯度
 * @param longitude - 経度
 * @param dateDiff - 旅行日数
 * @param tripType - 旅行タイプ（"personal" | "group"）
 * @returns データベース挿入用のチェックリスト項目配列
 */
export function getChecklistTemplate(
  tripId: number,
  latitude: number,
  longitude: number,
  dateDiff: number,
  tripType: "personal" | "group" = "personal"
): ChecklistItemInsert[] {
  const isDomestic =
    latitude >= 20 && latitude <= 45 && longitude >= 122 && longitude <= 153;

  // 旅行タイプと地域に応じてテンプレートを選択
  let baseTemplate: BaseTemplateItem[];
  if (tripType === "group") {
    baseTemplate = isDomestic
      ? groupDomesticTemplate
      : groupInternationalTemplate;
  } else {
    baseTemplate = isDomestic
      ? personalDomesticTemplate
      : personalInternationalTemplate;
  }

  // 日数に応じたアイテムを基本テンプレートに追加
  const combinedTemplate = [...baseTemplate, ...dailyItems(dateDiff)];

  // すべてのアイテムに tripId と is_checked を追加して返す
  return combinedTemplate.map((item) => ({
    ...item,
    trip_id: tripId,
    is_checked: false, // デフォルトは未チェック
  }));
}
