"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type SignupResult = {
  error?: string;
  values?: {
    email?: string;
    password?: string;
    confirmPassword?: string;
  };
};

export async function signup(
  prevState: SignupResult | undefined,
  formData: FormData
): Promise<SignupResult> {
  const supabase = await createClient();

  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    confirmPassword: formData.get("confirmPassword") as string,
  };

  // 入力チェック
  if (!data.email || !data.password || !data.confirmPassword) {
    return {
      error: "すべての項目を入力してください。",
      values: {
        email: data.email,
        password: data.password,
        confirmPassword: data.confirmPassword,
      },
    };
  }

  if (data.password !== data.confirmPassword) {
    return {
      error: "パスワードが一致しません。",
      values: { email: data.email, password: "", confirmPassword: "" },
    };
  }

  // サインアップ処理
  const { error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
  });

  if (error) {
    return {
      error:
        "すでに登録されているメールアドレスです。別のメールアドレスを使用してください。",
      values: { email: data.email, password: "" }, // パスワードは空にするのが一般的
    };
  }
  alert("登録完了メールを確認してください");

  revalidatePath("/", "layout");
  redirect("/login");
}
