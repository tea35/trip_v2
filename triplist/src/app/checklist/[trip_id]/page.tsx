import { getChecklistData } from "@/lib/data/checklist";
import ChecklistClient from "./checklistClient";
import { redirect } from "next/navigation";

export default async function ChecklistPage({
  params,
}: {
  params: Promise<{ trip_id: string }>;
}) {
  const { trip_id: tripIdString } = await params;
  const trip_id = parseInt(tripIdString);
  
  // trip_idが無効な場合はリダイレクト
  if (isNaN(trip_id)) {
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
