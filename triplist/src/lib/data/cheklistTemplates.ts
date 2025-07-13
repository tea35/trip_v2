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

// 国内旅行のテンプレート
const domesticTemplate: BaseTemplateItem[] = [
  { item_name: "財布・現金", quantity: 1 },
  { item_name: "スマートフォン", quantity: 1 },
  { item_name: "充電器", quantity: 1 },
  { item_name: "歯ブラシ", quantity: 1 },
  { item_name: "化粧品・スキンケア", quantity: 1 },
  { item_name: "折りたたみ傘", quantity: 1 },
];

// 国外旅行のテンプレート
const internationalTemplate: BaseTemplateItem[] = [
  { item_name: "パスポート", quantity: 1 },
  ...domesticTemplate, // 国内テンプレートを再利用
];

// 服や下着など、日数に依存する項目
const dailyItems = (dateDiff: number): BaseTemplateItem[] => [
  { item_name: "服", quantity: dateDiff },
  { item_name: "下着・靴下", quantity: dateDiff },
  { item_name: "タオル", quantity: dateDiff },
];

/**
 * 緯度経度と旅行日数に応じて、データベースに挿入できる形式の
 * チェックリスト項目配列を生成して返します。
 * @param tripId - 紐付ける旅行のID
 * @param latitude - 緯度
 * @param longitude - 経度
 * @param dateDiff - 旅行日数
 * @returns データベース挿入用のチェックリスト項目配列
 */
export function getChecklistTemplate(
  tripId: number,
  latitude: number,
  longitude: number,
  dateDiff: number
): ChecklistItemInsert[] {
  const isDomestic =
    latitude >= 20 && latitude <= 45 && longitude >= 122 && longitude <= 153;

  const baseTemplate = isDomestic ? domesticTemplate : internationalTemplate;

  // 日数に応じたアイテムを基本テンプレートに追加
  const combinedTemplate = [...baseTemplate, ...dailyItems(dateDiff)];

  // すべてのアイテムに tripId と is_checked を追加して返す
  return combinedTemplate.map((item) => ({
    ...item,
    trip_id: tripId,
    is_checked: false, // デフォルトは未チェック
  }));
}
