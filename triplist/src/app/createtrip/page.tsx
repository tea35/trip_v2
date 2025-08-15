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
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">旅行作成</h1>
        <p className="text-gray-600">
          新しい旅行を作成して、チェックリストで準備を整理しましょう
        </p>
      </div>

      <CreateTripForm />
    </div>
  );
}
