import { getChecklistData } from "@/lib/data/checklist";
import ChecklistClient from "./checklistClient";
import { redirect } from "next/navigation";
import { getIdFromHeaders } from "@/lib/utils/url";

export default async function ChecklistPage() {
  const trip_id = await getIdFromHeaders();
  // trip_idが取得できなかった場合（nullの場合）はリダイレクト
  if (trip_id === null) {
    return redirect("/triplist");
  }

  // サーバーサイドで初期データを安全に取得
  const { trip, linkedTrip, items, hide_completed } = await getChecklistData(trip_id);

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-cover bg-center py-20">
      <ChecklistClient
        trip_id={trip_id}
        initialTrip={trip}
        initialLinkedTrip={linkedTrip}
        initialItems={items}
        hideCompletedDefault={hide_completed}
      />
    </div>
  );
}
