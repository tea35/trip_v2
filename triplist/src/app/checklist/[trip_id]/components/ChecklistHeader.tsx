"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import HideCompletedToggle from "./HideCompletedToggle";

interface ChecklistHeaderProps {
  locationName: string;
  hideCompleted: boolean;
  setHideCompleted: (isChecked: boolean) => void;
}

export default function ChecklistHeader({
  locationName,
  hideCompleted,
  setHideCompleted,
}: ChecklistHeaderProps) {
  const router = useRouter();
  return (
    <div className="relative flex w-full items-center justify-center py-2">
      <button
        className="absolute left-0 h-10 w-10 p-0 flex items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground"
        onClick={() => router.push("/triplist")}
      >
        <ArrowLeft className="h-10 w-10" />
        <span className="sr-only">戻る</span>
      </button>

      <h2 className="text-2xl font-bold">{locationName}</h2>
      <div className="absolute right-0">
        <HideCompletedToggle
          isChecked={hideCompleted} // 現在の状態を渡す
          onCheckedChange={setHideCompleted} // 状態を更新する関数を渡す
        />
      </div>
    </div>
  );
}
