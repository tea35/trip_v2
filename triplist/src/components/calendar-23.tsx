// components/calendar-23.tsx
"use client";

import * as React from "react";
import { ChevronDownIcon } from "lucide-react";
import { type DateRange } from "react-day-picker";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// propsの型を定義
interface Calendar23Props {
  // 親から渡される現在の選択範囲。これにより、親がカレンダーの状態を制御できる
  dateRange: DateRange | undefined;
  // 日付範囲が変更されたときに親に通知するコールバック関数
  onDateRangeChange: (range: DateRange | undefined) => void;
}

export default function Calendar23({
  dateRange,
  onDateRangeChange,
}: Calendar23Props) {
  // 内部のstateは不要になる場合が多いが、ここではPopOverの開閉制御などで残す可能性も考慮。
  // しかし、DatePickerのselectedプロパティは直接dateRangeを使うのが適切。
  // const [range, setRange] = React.useState<DateRange | undefined>(dateRange); // この行は基本不要

  // 日付範囲が変更されたときに、親に通知するロジック
  const handleRangeSelect = (selectedRange: DateRange | undefined) => {
    // 内部stateを更新する代わりに、親から渡されたonDateRangeChangeを直接呼び出す
    onDateRangeChange(selectedRange);
  };

  return (
    <div className="flex flex-col gap-3">
      <Label htmlFor="dates" className="px-1"></Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            id="dates"
            className="w-56 justify-between font-normal"
          >
            {/* dateRangeプロパティを直接参照して表示 */}
            {dateRange?.from && dateRange?.to
              ? `${dateRange.from.toLocaleDateString(
                  "ja-JP"
                )} - ${dateRange.to.toLocaleDateString("ja-JP")}`
              : "日付を選択"}
            <ChevronDownIcon className="ml-2 h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto overflow-hidden p-0" align="start">
          <Calendar
            mode="range"
            // selectedプロパティに親から渡されたdateRangeを直接使用
            selected={dateRange}
            captionLayout="dropdown"
            // 日付選択時のコールバックも親に通知する関数を直接呼び出す
            onSelect={handleRangeSelect}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
