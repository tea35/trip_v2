import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getTrips } from "@/lib/data/trips"; // 分離した関数をインポート
import TripListComponent from "./components/TripListComponent";
import type { Trip } from "./types";

export default async function TripListPage() {
  const supabase = await createClient();

  // 1. サーバーサイドで認証チェック
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    redirect("/login");
  }

  // 2. 外部からインポートした関数でデータを取得
  const initialTrips: Trip[] = await getTrips(data.user.id);

  // 3. ユーザー情報と初期データをクライアントコンポーネントに渡してレンダリング
  return <TripListComponent user={data.user} initialTrips={initialTrips} />;
}
