"use client";

import React, { useState } from "react";
import { useActionState } from "react";
import { type DateRange } from "react-day-picker";
import { format } from "date-fns";
import { createTrip } from "../actions";
import Calendar23 from "@/components/calendar-23";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function CreateTripForm() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const [state, formAction, isPending] = useActionState(createTrip, {
    error: null,
  });

  return (
    <form
      action={formAction}
      className="flex w-full max-w-3xl flex-col gap-5 rounded-lg bg-white/85 p-10 shadow-xl"
    >
      <p className="mx-auto text-2xl font-bold">新しい旅行を作成</p>
      <p className="text-center text-lg text-gray-700">
        旅行情報を入力してください
      </p>
      <div className="flex justify-center">
        <div className="flex flex-col gap-8">
          {/* 場所入力*/}
          <div className="flex w-[300px] flex-col">
            <label htmlFor="location" className="mb-2 text-xl font-semibold">
              場所
            </label>
            <Input
              type="text"
              id="location"
              name="location"
              className="rounded-md border border-gray-300 p-2 text-lg focus:border-blue-500 focus:ring-blue-500"
              placeholder="東京"
              required
            />
          </div>

          {/* 日付選択グループ */}
          <div className="flex flex-col">
            <label className="mb-2 text-xl font-semibold">日付</label>
            <Calendar23
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
            />
            {dateRange?.from && (
              <input
                type="hidden"
                name="startDate"
                value={format(dateRange.from, "yyyy-MM-dd")}
              />
            )}
            {dateRange?.to && (
              <input
                type="hidden"
                name="endDate"
                value={format(dateRange.to, "yyyy-MM-dd")}
              />
            )}
          </div>
        </div>
      </div>

      {state.error && (
        <div className="mt-4 text-center text-red-600 text-lg font-medium">
          {state.error}
        </div>
      )}

      <div className="my-5 h-px w-full bg-gray-300" />

      <Button
        className="mx-auto h-12 w-48 rounded-lg bg-blue-600 text-xl font-semibold text-white shadow-md transition-colors hover:bg-blue-700 disabled:opacity-50"
        type="submit"
        disabled={isPending}
      >
        {isPending ? "登録中..." : "登録"}
      </Button>
    </form>
  );
}
