import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getTrips } from "@/lib/data/trips"; // 分離した関数をインポート
import TripListComponent from "./components/TripListComponent";
import type { Trip } from "./types";

export default async function TripListPage() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    redirect("/login");
  }

  const initialTrips: Trip[] = await getTrips(data.user.id);
  return <TripListComponent user={data.user} initialTrips={initialTrips} />;
}
