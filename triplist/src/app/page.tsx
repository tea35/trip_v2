// app/page.tsx

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  // サーバーサイドでSupabaseクライアントを作成
  const supabase = await createClient();

  // Cookieを元に現在のユーザー情報を取得
  const { data, error } = await supabase.auth.getUser();

  // ユーザーが存在しない、またはエラーが発生した場合
  if (error || !data?.user) {
    // ログインページへリダイレクト
    redirect("/login");
  } else {
    // ユーザーが存在する場合、旅行リストページへリダイレクト
    redirect("/triplist");
  }
}
