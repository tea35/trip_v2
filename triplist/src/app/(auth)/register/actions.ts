"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type SignupResult = {
  error?: string;
  values?: {
    name?: string;
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
    name: formData.get("name") as string,
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    confirmPassword: formData.get("confirmPassword") as string,
  };

  // 入力チェック
  if (!data.name || !data.email || !data.password || !data.confirmPassword) {
    return {
      error: "すべての項目を入力してください。",
      values: {
        name: data.name,
        email: data.email,
        password: data.password,
        confirmPassword: data.confirmPassword,
      },
    };
  }

  if (data.password !== data.confirmPassword) {
    return {
      error: "パスワードが一致しません。",
      values: {
        name: data.name,
        email: data.email,
        password: "",
        confirmPassword: "",
      },
    };
  }

  // サインアップ処理
  const { error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        name: data.name.trim(), // メタデータとして名前を保存
      },
    },
  });

  if (error) {
    return {
      error:
        "サインアップに失敗しました。メールアドレスが既に使用されている可能性があります。",
      values: {
        name: data.name,
        email: data.email,
        password: "",
      },
    };
  }

  revalidatePath("/", "layout");
  redirect("/login");
}
