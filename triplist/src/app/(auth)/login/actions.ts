"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export async function login(revState: string | undefined, formData: FormData) {
  const supabase = await createClient();

  // type-casting here for convenience
  // in practice, you should validate your inputs
  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };
  console.log("Login data:", data);
  const { error } = await supabase.auth.signInWithPassword(data);

  if (error) {
    return (
      "メールアドレスまたはパスワードが間違っています。" + `${error.message}`
    );
  }

  revalidatePath("/", "layout");
  // 認証成功時、旅行リストページへリダイレクト
  redirect("/triplist");
}
