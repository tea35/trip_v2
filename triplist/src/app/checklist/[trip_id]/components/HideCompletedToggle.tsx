"use client";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useEffect } from "react";
import { updateUserHideCompletedToggle } from "../actions";

interface HideCompletedToggleProps {
  isChecked: boolean;
  onCheckedChange: (isChecked: boolean) => void;
}
export default function HideCompletedToggle({
  isChecked,
  onCheckedChange,
}: HideCompletedToggleProps) {
  useEffect(() => {
    // トグルの状態(hideCompleted)が変更された時だけ、DBを更新するアクションを呼び出す
    updateUserHideCompletedToggle({ hideCompleted: isChecked });
  }, [isChecked]);
  return (
    <div className="flex items-center space-x-2">
      <Switch
        id="hide-completed-toggle"
        checked={isChecked}
        onCheckedChange={onCheckedChange}
      />
      <Label htmlFor="hide-completed-toggle" className="cursor-pointer">
        完了済みを非表示
      </Label>
    </div>
  );
}
