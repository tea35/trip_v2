"use client";

import { useRouter } from "next/navigation";
import type { Trip } from "../types";
import { Trash2 } from "lucide-react";

// このコンポーネントが受け取るPropsの型を定義
interface TripItemProps {
  trip: Trip;
  onDelete: (tripId: number) => void;
}

export default function TripItem({ trip, onDelete }: TripItemProps) {
  const router = useRouter();
  const days = ["日", "月", "火", "水", "木", "金", "土"];

  function formatDateWithDay(dateStr: string): string {
    const date = new Date(dateStr);
    const localDate = new Date(
      date.getTime() + date.getTimezoneOffset() * 60000
    );
    return `${dateStr}(${days[localDate.getDay()]})`;
  }

  return (
    <div
      className="relative flex h-14 min-h-[55px] max-h-[55px] w-full max-w-[500px] cursor-pointer items-center justify-between rounded-xl bg-gray-100 p-4 pl-12 shadow-sm transition-colors hover:bg-gray-200"
      onClick={() => router.push(`/checklist/${trip.trip_id}`)}
    >
      <p className="text-xl font-bold">{trip.location_name}</p>
      <p className="text-base text-gray-700">
        {formatDateWithDay(trip.start_date)} ～{" "}
        {formatDateWithDay(trip.end_date)}
      </p>
      <button
        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-gray-500 ring-offset-background transition-colors hover:bg-accent hover:text-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
        onClick={(e) => {
          e.stopPropagation(); // 親要素のクリックイベントを止める
          onDelete(trip.trip_id); // 親から渡された関数を呼び出す
        }}
      >
        <Trash2 className="h-6 w-6 text-gray-500 hover:text-red-500" />
        <span className="sr-only">削除</span>
      </button>
    </div>
  );
}
