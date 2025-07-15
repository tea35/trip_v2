import { headers } from "next/headers";

/**
 * Middlewareから渡されたヘッダー情報('x-url')を解析し、
 * URLの末尾に含まれるtrip_idを数値として取得する。
 * @returns {number | null} 成功した場合は数値のtrip_id、失敗した場合はnullを返す。
 */
export async function getTripIdFromHeaders(): Promise<number | null> {
  const headerList = headers();
  const requestUrl = (await headerList).get("x-url");

  // ヘッダーが存在しない場合はnullを返す
  if (!requestUrl) {
    return null;
  }

  try {
    const url = new URL(requestUrl);
    const pathSegments = url.pathname.split("/");
    const tripIdString = pathSegments[pathSegments.length - 1];

    // 文字列を数値に変換
    const trip_id = Number(tripIdString);

    // 数値に変換できなかった場合 (NaN) はnullを返す
    if (isNaN(trip_id)) {
      return null;
    }

    return trip_id;
  } catch (error) {
    // URLのパースに失敗した場合など
    console.error("Failed to parse trip_id from headers:", error);
    return null;
  }
}
