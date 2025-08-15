/**
 * 文字列の先頭N文字以外を伏字（*）に置き換えます。
 * @param text - マスキング対象の文字列 (例: 'sato@gmail.com' or '佐藤 鴻成')
 * @param visibleChars - 表示する先頭の文字数 (デフォルト: 4)
 * @param maskSymbol - 伏字に使う記号 (デフォルト: '*')
 * @returns マスキングされた文字列 (例: 'sato********')
 */
export function maskIdentifier(
  text: string | null | undefined,
  visibleChars: number = 4,
  maskSymbol: string = "*"
): string {
  // textがnullまたはundefinedの場合は空文字を返す
  if (!text) {
    return "";
  }

  // 表示する部分を切り出す
  const visiblePart = text.slice(0, visibleChars);

  // 伏字の部分を作成（元の文字列の長さに合わせる場合）
  // const maskPart = maskSymbol.repeat(Math.max(0, text.length - visibleChars));

  // 伏字の部分を固定長にする場合（例：8文字）
  const maskPart = maskSymbol.repeat(8);

  return `${visiblePart}${maskPart}`;
}
