import { getChecklistData } from "@/lib/data/checklist";
import ChecklistClient from "./checklistClient";

interface PageProps {
  params: { trip_id: string };
}

export default async function ChecklistPage({ params }: PageProps) {
  const trip_id = Number(params.trip_id);

  // サーバーサイドで初期データを安全に取得
  const { trip, items } = await getChecklistData(trip_id);

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-cover bg-center py-20">
      <ChecklistClient
        trip_id={trip_id}
        initialTrip={trip}
        initialItems={items}
      />
    </div>
  );
}
