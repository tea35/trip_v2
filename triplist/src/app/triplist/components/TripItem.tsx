"use client";

import { useRouter } from "next/navigation";
import type { Trip } from "../types";
import { Trash2, Users, User, Plus } from "lucide-react";
import { globalTextSizes, textColors } from "@/styles/typography";

interface TripItemProps {
  trip: Trip;
  linkedTrip?: Trip;
  onDelete: (tripId: number) => void;
  onCreatePersonalVersion?: (trip: Trip) => void;
}

export default function TripItem({
  trip,
  linkedTrip,
  onDelete,
  onCreatePersonalVersion,
}: TripItemProps) {
  const router = useRouter();
  const days = ["日", "月", "火", "水", "木", "金", "土"];

  function formatDateWithDay(dateStr: string): string {
    const date = new Date(dateStr);
    const localDate = new Date(
      date.getTime() + date.getTimezoneOffset() * 60000
    );

    return `${dateStr}(${days[localDate.getDay()]})`;
  }

  const getTripTypeStyle = () => {
    if (trip.group_id && trip.trip_type === "group") {
      return {
        typeText: "グループ",
        typeColor: "text-blue-700",
        bgBadge: "bg-blue-50 border-blue-200",
      };
    } else {
      return {
        typeText: "個人",
        typeColor: "text-gray-700",
        bgBadge: "bg-gray-50 border-gray-200",
      };
    }
  };

  const style = getTripTypeStyle();

  const showCreatePersonalButton =
    trip.trip_type === "group" &&
    !trip.hasPersonalVersion &&
    onCreatePersonalVersion;

  return (
    <div className="relative rounded-lg bg-white border border-gray-200 shadow-sm transition-all duration-300 hover:shadow-md hover:border-blue-300 border-l-4 border-l-blue-400 group">
      <div
        className="flex h-14 w-full cursor-pointer items-center justify-between px-4 py-3 transition-all duration-300 hover:scale-[1.01]"
        onClick={() => router.push(`/checklist/${trip.trip_id}`)}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3
                className={`font-bold transition-colors duration-300 group-hover:text-blue-700 truncate ${globalTextSizes.listItemTitle}`}
              >
                {trip.location_name}
              </h3>
              {linkedTrip ? (
                <span
                  className={`px-2 py-1 rounded bg-purple-50 border-purple-200 text-purple-700 transition-all duration-300 group-hover:bg-purple-100 flex-shrink-0 ${globalTextSizes.badge}`}
                >
                  両方
                </span>
              ) : (
                <span
                  className={`px-2 py-1 rounded border transition-all duration-300 group-hover:scale-105 flex-shrink-0 ${style.typeColor} ${style.bgBadge} ${globalTextSizes.badge}`}
                >
                  {style.typeText}
                </span>
              )}
              {(trip.trip_type === "group" || linkedTrip) &&
                trip.group_name && (
                  <span
                    className={`${globalTextSizes.listItemMeta} ${textColors.secondary} flex-shrink-0 flex`}
                  >
                    <Users className="h-5 w-5 text-blue-600" />
                    {trip.group_name}
                  </span>
                )}
            </div>
            <div className="flex items-center gap-4">
              <p
                className={`transition-colors duration-300 group-hover:text-gray-700 truncate ${globalTextSizes.listItemMeta} ${textColors.secondary}`}
              >
                {formatDateWithDay(trip.start_date)} ～{" "}
                {formatDateWithDay(trip.end_date)}
              </p>
            </div>
          </div>
        </div>

        <button
          className="flex-shrink-0 h-8 w-8 flex items-center justify-center rounded-md text-gray-400 hover:bg-red-50 hover:text-red-500 transition-all duration-300"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(trip.trip_id);
          }}
        >
          <Trash2 className="h-4 w-4" />
          <span className="sr-only">削除</span>
        </button>
      </div>

      {/* 個人版作成ボタン */}
      {showCreatePersonalButton && (
        <div className="px-4 pb-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCreatePersonalVersion(trip);
            }}
            className={`flex items-center gap-2 px-3 py-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-all duration-300 ${globalTextSizes.bodySmall}`}
          >
            <Plus className="h-4 w-4" />
            個人版チェックリストを作成
          </button>
        </div>
      )}
    </div>
  );
}
