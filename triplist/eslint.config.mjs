import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),

  // ▼▼▼ このオブジェクトを追加 ▼▼▼
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn", // エラーではなく警告にする
        {
          argsIgnorePattern: "^_", // アンダースコアで始まる引数を無視
          varsIgnorePattern: "^_", // アンダースコアで始まる変数を無視
        },
      ],
    },
  },
];

export default eslintConfig;
