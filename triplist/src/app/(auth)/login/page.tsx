import { LoginForm } from "@/components/login-form";
import { typographyStyles, globalTextSizes, textColors } from "@/styles/typography";

export default function LoginPage() {
  return (
    // 背景画像と中央配置コンテナ
    <div className="flex min-h-screen w-full items-center justify-center bg-cover bg-center p-4">
      <div className="flex w-full max-w-6xl overflow-hidden rounded-xl bg-white/80 shadow-2xl backdrop-blur-lg">
        {/* 左側の説明エリア */}
        <div className="hidden w-1/2 flex-col justify-center p-12 text-slate-800 md:flex">
          <h1 className={`mb-2 font-bold ${typographyStyles.pageTitle}`}>忘れ物ゼロの旅へ</h1>
          <h2 className={`mb-8 ${globalTextSizes.sectionTitle} ${textColors.secondary}`}>
            あなただけのチェックリストで、もっと自由な旅行を
          </h2>
          <p className={`${globalTextSizes.body} leading-relaxed text-slate-700`}>
            <strong>TripList</strong>{" "}
            は、旅行前の「持ち物チェック」をもっと簡単・便利にする、あなただけの旅行準備アプリです。
            <br />
            <br />
            ログイン・会員登録をすると、自分専用のチェックリストを保存・編集・カスタマイズできるようになります。
            <br />
            <br />
            国内旅行でも、海外旅行でも、「あれ持ったっけ？」の不安をこのアプリが解決します。
          </p>
        </div>

        {/* 右側のログインフォームエリア */}
        <div className="w-full bg-white/50 p-8 md:w-1/2 md:p-16">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
