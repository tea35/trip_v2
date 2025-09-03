"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Users, User } from "lucide-react";
import HideCompletedToggle from "./HideCompletedToggle";
import type { Trip } from "../types";

interface ChecklistHeaderProps {
  trip: Trip;
  linkedTrip?: Trip | null;
  hideCompleted: boolean;
  setHideCompleted: (isChecked: boolean) => void;
  activeTab: "main" | "linked";
  setActiveTab: (tab: "main" | "linked") => void;
}

export default function ChecklistHeader({
  trip,
  linkedTrip,
  hideCompleted,
  setHideCompleted,
  activeTab,
  setActiveTab,
}: ChecklistHeaderProps) {
  const router = useRouter();

  // 現在アクティブな旅行を取得
  const currentTrip = activeTab === "main" ? trip : linkedTrip || trip;

  // 旅行タイプによってアイコンとバッジの色のみ決定（背景色は変更しない）
  const getTripTypeInfo = (tripData: Trip) => {
    if (tripData.group_id && tripData.trip_type === "group") {
      return {
        icon: <Users className="h-5 w-5 text-blue-600" />,
        text: "グループ旅行",
        bgColor: "bg-blue-50", // バッジの背景色のみ
        textColor: "text-blue-700",
        borderColor: "border-blue-300",
      };
    } else {
      return {
        icon: <User className="h-5 w-5 text-gray-600" />,
        text: "個人旅行",
        bgColor: "bg-gray-50", // バッジの背景色のみ
        textColor: "text-gray-700",
        borderColor: "border-gray-300",
      };
    }
  };

  const typeInfo = getTripTypeInfo(currentTrip);

  // タブのスタイル
  const getTabStyle = (tabType: "main" | "linked", tripData: Trip) => {
    const isActive = activeTab === tabType;
    const isGroup = tripData.group_id && tripData.trip_type === "group";

    if (isActive) {
      return isGroup
        ? "bg-blue-500 text-white border-blue-500 shadow-md"
        : "bg-gray-500 text-white border-gray-500 shadow-md";
    } else {
      return "bg-white text-gray-600 border-gray-300 hover:bg-gray-50 hover:border-gray-400";
    }
  };

  return (
    <div className="relative flex w-full flex-col items-center justify-center py-2">
      <div className="relative flex w-full items-center justify-center">
        <button
          className="absolute left-0 h-10 w-10 p-0 flex items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground"
          onClick={() => router.push("/triplist")}
        >
          <ArrowLeft className="h-10 w-10" />
          <span className="sr-only">戻る</span>
        </button>

        <div className="flex flex-col items-center gap-2">
          <h2 className="text-lg md:text-xl lg:text-2xl font-bold">
            {currentTrip.location_name}
          </h2>
          <div
            className={`flex items-center gap-2 px-3 py-1 rounded-full border ${typeInfo.bgColor} ${typeInfo.borderColor}`}
          >
            {typeInfo.icon}
            <span className={`text-sm font-medium ${typeInfo.textColor}`}>
              {typeInfo.text}
            </span>
          </div>
        </div>

        {/* デスクトップ表示時のトグル */}
        <div className="absolute right-0 hidden md:block">
          <HideCompletedToggle
            isChecked={hideCompleted}
            onCheckedChange={setHideCompleted}
          />
        </div>
      </div>

      {/* モバイル表示時のトグル */}
      <div className="w-full mt-4 flex justify-center md:hidden">
        <HideCompletedToggle
          isChecked={hideCompleted}
          onCheckedChange={setHideCompleted}
        />
      </div>

      {/* タブボタン（紐付けされた旅行がある場合のみ表示） */}
      {linkedTrip && (
        <div className="w-full mt-4">
          <div className="flex gap-2 justify-center">
            {/* 常に個人旅行タブを最初に表示 */}
            {trip.trip_type === "personal" ? (
              <>
                {/* 現在のtripが個人旅行の場合 */}
                <button
                  className={`px-6 py-3 text-sm font-medium border-2 transition-all rounded-lg ${getTabStyle(
                    "main",
                    trip
                  )}`}
                  onClick={() => setActiveTab("main")}
                >
                  <div className="flex items-center justify-center gap-2">
                    <User className="h-4 w-4" />
                    個人旅行
                  </div>
                </button>
                <button
                  className={`px-6 py-3 text-sm font-medium border-2 transition-all rounded-lg ${getTabStyle(
                    "linked",
                    linkedTrip
                  )}`}
                  onClick={() => setActiveTab("linked")}
                >
                  <div className="flex items-center justify-center gap-2">
                    <Users className="h-4 w-4" />
                    グループ旅行
                  </div>
                </button>
              </>
            ) : (
              <>
                {/* 現在のtripがグループ旅行の場合 */}
                <button
                  className={`px-6 py-3 text-sm font-medium border-2 transition-all rounded-lg ${getTabStyle(
                    "linked",
                    linkedTrip
                  )}`}
                  onClick={() => setActiveTab("linked")}
                >
                  <div className="flex items-center justify-center gap-2">
                    <User className="h-4 w-4" />
                    個人旅行
                  </div>
                </button>
                <button
                  className={`px-6 py-3 text-sm font-medium border-2 transition-all rounded-lg ${getTabStyle(
                    "main",
                    trip
                  )}`}
                  onClick={() => setActiveTab("main")}
                >
                  <div className="flex items-center justify-center gap-2">
                    <Users className="h-4 w-4" />
                    グループ旅行
                  </div>
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
