/**
 * 2つの日付文字列（YYYY-MM-DD）から旅行日数を計算します。
 * 例: '2025-07-10' から '2025-07-12' は 3日 となります。
 * @param startDateStr - 開始日 (例: '2025-07-10')
 * @param endDateStr - 終了日 (例: '2025-07-12')
 * @returns 旅行日数 (数値)
 */
export function calculateTripDays(
  startDateStr: string,
  endDateStr: string
): number {
  const startDate = new Date(startDateStr);
  const endDate = new Date(endDateStr);

  // タイムゾーンの違いによる問題を避けるため、UTCで計算
  const utcStartDate = Date.UTC(
    startDate.getFullYear(),
    startDate.getMonth(),
    startDate.getDate()
  );
  const utcEndDate = Date.UTC(
    endDate.getFullYear(),
    endDate.getMonth(),
    endDate.getDate()
  );

  // ミリ秒単位の差を計算
  const diffInMs = utcEndDate - utcStartDate;

  // ミリ秒を日数に変換 (1日 = 1000ms * 60s * 60min * 24h)
  const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

  // 日数は「泊数 + 1」なので、結果に1を足す
  return diffInDays + 1;
}
