import { createClient } from "@/lib/supabase/client";
import { redirect } from "next/navigation";

// Googleログイン処理
export async function handleGoogleLogin() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${location.origin}/auth/callback?next=/triplist`,
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });
  if (error) throw error;
  if (data.url) {
    redirect(data.url); // use the redirect API for your server framework
  }
}
