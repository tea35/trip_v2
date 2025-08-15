import { headers } from "next/headers";

/**
 * Middlewareから渡されたヘッダー情報('x-url')を解析し、
 * URLの末尾に含まれるidを数値として取得する。
 * @returns {number | null} 成功した場合は数値のid、失敗した場合はnullを返す。
 */
export async function getIdFromHeaders(): Promise<number | null> {
  const headerList = headers();
  const requestUrl = (await headerList).get("x-url");

  // ヘッダーが存在しない場合はnullを返す
  if (!requestUrl) {
    return null;
  }

  try {
    const url = new URL(requestUrl);
    const pathSegments = url.pathname
      .split("/")
      .filter((segment) => segment.length > 0);

    // URLの最後のセグメントをIDとして取得
    const idString = pathSegments[pathSegments.length - 1];

    // 空文字列やundefinedの場合はnullを返す
    if (!idString || idString.trim() === "") {
      return null;
    }

    return Number(idString);
  } catch (error) {
    // URLのパースに失敗した場合など
    console.error("Failed to parse ID from headers:", error);
    return null;
  }
}

/**
 * APIエンドポイント用: /api/checklist/[trip_id]/items のようなパスからtrip_idを取得
 * @returns {number | null} 成功した場合は数値のtrip_id、失敗した場合はnullを返す。
 */
export async function getTripIdFromApiHeaders(): Promise<number | null> {
  const headerList = headers();
  const requestUrl = (await headerList).get("x-url");

  // ヘッダーが存在しない場合はnullを返す
  if (!requestUrl) {
    return null;
  }

  try {
    const url = new URL(requestUrl);
    const pathSegments = url.pathname
      .split("/")
      .filter((segment) => segment.length > 0);

    // /api/checklist/[trip_id]/items の形式を想定
    // pathSegments = ["api", "checklist", "22", "items"]
    if (pathSegments.length >= 3 && pathSegments[0] === "api" && pathSegments[1] === "checklist") {
      const tripIdString = pathSegments[2];
      
      if (!tripIdString || tripIdString.trim() === "") {
        return null;
      }

      const tripId = Number(tripIdString);
      return isNaN(tripId) ? null : tripId;
    }

    return null;
  } catch (error) {
    console.error("Failed to parse trip ID from API headers:", error);
    return null;
  }
}
