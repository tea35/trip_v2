/**
 * アプリケーション全体で使用する統一的なテキストサイズ設定
 * モバイル → タブレット → デスクトップのレスポンシブ対応
 */

export const globalTextSizes = {
  // ページタイトル・メインヘッダー
  pageTitle: "text-xl md:text-2xl lg:text-3xl",
  sectionTitle: "text-lg md:text-xl lg:text-2xl",
  cardTitle: "text-base md:text-lg",
  
  // コンテンツ
  body: "text-sm md:text-base",
  bodyLarge: "text-base md:text-lg",
  bodySmall: "text-xs md:text-sm",
  
  // ナビゲーション・メニュー
  navItem: "text-sm md:text-base",
  menuItem: "text-sm md:text-base",
  
  // ボタン
  buttonLarge: "text-base md:text-lg",
  button: "text-sm md:text-base",
  buttonSmall: "text-xs md:text-sm",
  
  // フォーム要素
  label: "text-sm md:text-base",
  input: "text-sm md:text-base",
  placeholder: "text-xs md:text-sm",
  formError: "text-xs md:text-sm",
  formHelp: "text-xs md:text-sm",
  
  // リスト・アイテム
  listItemTitle: "text-sm md:text-base lg:text-lg",
  listItemMeta: "text-xs md:text-sm",
  
  // バッジ・タグ・ステータス
  badge: "text-xs md:text-sm",
  tag: "text-xs md:text-sm",
  status: "text-xs md:text-sm",
  
  // タブ・ナビゲーション
  tab: "text-xs md:text-sm",
  breadcrumb: "text-xs md:text-sm",
  
  // 説明文・ヘルプテキスト
  description: "text-xs md:text-sm",
  caption: "text-xs",
  footnote: "text-xs",
  
  // チェックリスト専用
  checklistItem: "text-sm md:text-base lg:text-lg",
  checklistQuantity: "text-sm md:text-base",
  checklistHeader: "text-lg md:text-xl lg:text-2xl",
} as const;

/**
 * フォントウェイトの統一設定
 */
export const fontWeights = {
  light: "font-light",
  normal: "font-normal", 
  medium: "font-medium",
  semibold: "font-semibold",
  bold: "font-bold",
} as const;

/**
 * テキストカラーの統一設定
 */
export const textColors = {
  primary: "text-gray-900",
  secondary: "text-gray-600", 
  muted: "text-gray-500",
  disabled: "text-gray-400",
  success: "text-green-600",
  warning: "text-yellow-600",
  error: "text-red-600",
  info: "text-blue-600",
} as const;

/**
 * 使用例:
 * import { globalTextSizes, fontWeights, textColors } from '@/styles/typography';
 * 
 * <h1 className={`${globalTextSizes.pageTitle} ${fontWeights.bold} ${textColors.primary}`}>
 *   ページタイトル
 * </h1>
 * 
 * <p className={`${globalTextSizes.body} ${textColors.secondary}`}>
 *   本文テキスト
 * </p>
 */

/**
 * 共通のタイポグラフィスタイル組み合わせ
 */
export const typographyStyles = {
  pageTitle: `${globalTextSizes.pageTitle} ${fontWeights.bold} ${textColors.primary}`,
  sectionTitle: `${globalTextSizes.sectionTitle} ${fontWeights.semibold} ${textColors.primary}`,
  cardTitle: `${globalTextSizes.cardTitle} ${fontWeights.medium} ${textColors.primary}`,
  body: `${globalTextSizes.body} ${textColors.primary}`,
  bodySecondary: `${globalTextSizes.body} ${textColors.secondary}`,
  label: `${globalTextSizes.label} ${fontWeights.medium} ${textColors.primary}`,
  button: `${globalTextSizes.button} ${fontWeights.medium}`,
  badge: `${globalTextSizes.badge} ${fontWeights.medium}`,
  error: `${globalTextSizes.formError} ${textColors.error}`,
  help: `${globalTextSizes.formHelp} ${textColors.muted}`,
} as const;
