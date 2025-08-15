/**
 * チェックリストで使用する統一的なテキストサイズ設定
 * モバイル → タブレット → デスクトップのレスポンシブ対応
 */

export const textSizes = {
  // ヘッダー・タイトル系
  pageTitle: "text-lg md:text-xl lg:text-2xl",
  sectionTitle: "text-base md:text-lg",
  
  // チェックリストアイテム
  itemName: "text-sm md:text-base lg:text-lg",
  itemQuantity: "text-sm md:text-base",
  
  // ボタン・コントロール
  button: "text-sm md:text-base",
  buttonSmall: "text-xs md:text-sm",
  
  // ラベル・説明文
  label: "text-xs md:text-sm",
  description: "text-xs md:text-sm",
  
  // 入力フィールド
  input: "text-sm md:text-base",
  
  // バッジ・タグ
  badge: "text-xs md:text-sm",
  
  // タブ
  tab: "text-xs md:text-sm",
} as const;

/**
 * 使用例:
 * import { textSizes } from './styles/textSizes';
 * 
 * <h1 className={`${textSizes.pageTitle} font-bold`}>
 *   タイトル
 * </h1>
 * 
 * <span className={`${textSizes.itemName} ${item.is_checked ? 'line-through' : ''}`}>
 *   {item.name}
 * </span>
 */
