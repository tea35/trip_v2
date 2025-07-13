import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CreateTripForm from "./components/createTripForm";

export default async function CreateTripPage() {
  const supabase = await createClient();

  // サーバーサイドで認証チェック
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <div>
      {/* ヘッダーは共通レイアウト(app/layout.tsx)にあると仮定 */}
      <div className="flex min-h-screen w-full items-center justify-center bg-cover bg-center py-20 pt-32">
        <CreateTripForm />
      </div>
    </div>
  );
}
