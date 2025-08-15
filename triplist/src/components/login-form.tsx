"use client";

import { useActionState } from "react"; // reactからインポート
import { login } from "@/app/(auth)/login/actions";
import { handleGoogleLogin } from "@/app/(auth)/login/components/GoogleLoginButton";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { typographyStyles, globalTextSizes, textColors } from "@/styles/typography";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  // useActionStateからエラーメッセージと保留状態(isPending)を取得
  const [errorMessage, dispatch, isPending] = useActionState(login, undefined);

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className={typographyStyles.cardTitle}>ログイン</CardTitle>
          <CardDescription className={globalTextSizes.bodySmall}>
            メールアドレスとパスワードを入力してください
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={dispatch}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-3">
                <Label htmlFor="email" className={globalTextSizes.label}>メールアドレス</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  className={globalTextSizes.input}
                />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="login-password" className={globalTextSizes.label}>パスワード</Label>
                <Input
                  id="login-password"
                  name="password"
                  type="password"
                  required
                  className={globalTextSizes.input}
                />
              </div>

              {errorMessage && (
                <p className={`${globalTextSizes.bodySmall} font-medium text-red-500`}>
                  {errorMessage}
                </p>
              )}

              <div className="flex flex-col gap-3">
                {/* isPendingを直接使ってボタンの状態を制御 */}
                <Button
                  type="submit"
                  className={`w-full bg-blue-500 text-white hover:bg-blue-600 ${typographyStyles.button}`}
                  disabled={isPending}
                >
                  {isPending ? "ログイン中..." : "ログイン"}
                </Button>
                <Button
                  variant="outline"
                  className={`w-full ${typographyStyles.button}`}
                  type="button"
                  onClick={handleGoogleLogin}
                >
                  Googleでログイン
                </Button>
              </div>
            </div>
            <div className={`mt-4 text-center ${globalTextSizes.bodySmall}`}>
              アカウントがない方は{" "}
              <Link
                href="/register" // 新規登録ページへのパスを修正
                className="underline underline-offset-4 hover:text-blue-500"
              >
                こちらから登録
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
