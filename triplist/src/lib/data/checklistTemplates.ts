export interface ChecklistItemInsert {
  trip_id: number;
  item_name: string;
  quantity: number;
  is_checked: boolean;
}

interface BaseTemplateItem {
  item_name: string;
  quantity: number;
}

const personalDomesticTemplate: BaseTemplateItem[] = [
  { item_name: "財布・現金", quantity: 1 },
  { item_name: "スマートフォン", quantity: 1 },
  { item_name: "充電器", quantity: 1 },
  { item_name: "歯ブラシ", quantity: 1 },
  { item_name: "化粧品・スキンケア", quantity: 1 },
  { item_name: "折りたたみ傘", quantity: 1 },
];

const personalInternationalTemplate: BaseTemplateItem[] = [
  { item_name: "パスポート", quantity: 1 },
  ...personalDomesticTemplate,
];

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

const groupInternationalTemplate: BaseTemplateItem[] = [
  { item_name: "海外旅行保険証", quantity: 1 },
  { item_name: "変換プラグ", quantity: 1 },
  { item_name: "翻訳アプリ", quantity: 1 },
  ...groupDomesticTemplate,
];

const dailyItems = (dateDiff: number): BaseTemplateItem[] => [
  { item_name: "服", quantity: dateDiff },
  { item_name: "下着・靴下", quantity: dateDiff },
  { item_name: "タオル", quantity: dateDiff },
];

export function getChecklistTemplate(
  tripId: number,
  latitude: number,
  longitude: number,
  dateDiff: number,
  tripType: "personal" | "group" = "personal"
): ChecklistItemInsert[] {
  const isDomestic =
    latitude >= 20 && latitude <= 45 && longitude >= 122 && longitude <= 153;

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

  const combinedTemplate = [...baseTemplate, ...dailyItems(dateDiff)];

  return combinedTemplate.map((item) => ({
    ...item,
    trip_id: tripId,
    is_checked: false,
  }));
}
