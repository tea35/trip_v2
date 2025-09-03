"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

type LoginResult = {
  success: boolean;
  error: string | null;
};

export async function login(
  revState: LoginResult | undefined,
  formData: FormData
): Promise<LoginResult> {
  const supabase = await createClient();

  // type-casting here for convenience
  // in practice, you should validate your inputs
  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };
  const { error } = await supabase.auth.signInWithPassword(data);

  if (error) {
    return {
      success: false,
      error: "メールアドレスまたはパスワードが間違っています。",
    };
  }

  revalidatePath("/", "layout");
  revalidatePath("/triplist", "page");

  // 成功時
  return {
    success: true,
    error: null,
  };
}
