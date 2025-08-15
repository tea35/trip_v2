"use client";

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
import { useActionState } from "react";
import { signup } from "@/app/(auth)/register/actions";
import Link from "next/link";
import { typographyStyles, globalTextSizes } from "@/styles/typography";

export function RegisterForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [state, dispatch, isPending] = useActionState(signup, {
    error: undefined,
    values: {},
  });
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className={typographyStyles.cardTitle}>新規登録</CardTitle>
          <CardDescription className={globalTextSizes.bodySmall}>
            メールアドレスを入力してアカウントにログインしてください
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={dispatch}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-3">
                <Label htmlFor="name" className={globalTextSizes.label}>
                  ユーザ名
                </Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="田中太郎"
                  required
                  defaultValue={state.values?.name ?? ""}
                  className={globalTextSizes.input}
                />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="email" className={globalTextSizes.label}>
                  メールアドレス
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  defaultValue={state.values?.email ?? ""}
                  className={globalTextSizes.input}
                />
              </div>
              <div className="grid gap-3">
                <div className="flex items-center">
                  <Label
                    htmlFor="register-password"
                    className={globalTextSizes.label}
                  >
                    パスワード
                  </Label>
                </div>
                <Input
                  id="register-password"
                  name="password"
                  type="password"
                  required
                  defaultValue={state.values?.password ?? ""}
                  className={globalTextSizes.input}
                />
              </div>
              <div className="grid gap-3">
                <div className="flex items-center">
                  <Label
                    htmlFor="register-confirm-password"
                    className={globalTextSizes.label}
                  >
                    確認パスワード
                  </Label>
                </div>
                <Input
                  id="register-confirm-password"
                  name="confirmPassword"
                  type="password"
                  required
                  defaultValue={state.values?.confirmPassword ?? ""}
                  className={globalTextSizes.input}
                />
              </div>
              {state.error && (
                <p
                  className={`${globalTextSizes.bodySmall} font-medium text-red-500`}
                >
                  {state.error}
                </p>
              )}
              <div className="flex flex-col gap-3">
                <Button
                  type="submit"
                  className={`w-full bg-blue-400 text-white hover:bg-blue-500 ${typographyStyles.button}`}
                  disabled={isPending}
                >
                  {isPending ? "登録中..." : "登録"}
                </Button>
              </div>
            </div>
            <div className={`mt-4 text-center ${globalTextSizes.bodySmall}`}>
              <Link
                href="/login"
                className="underline underline-offset-4 hover:text-blue-500"
              >
                ログインはこちらから
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
