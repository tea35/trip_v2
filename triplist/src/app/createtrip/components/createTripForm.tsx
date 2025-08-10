"use client";

import React, { useState, useEffect } from "react";
import { useActionState } from "react";
import { type DateRange } from "react-day-picker";
import { format } from "date-fns";
import { createTrip } from "../actions";
import Calendar23 from "@/components/calendar-23";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { createClient } from "@/lib/supabase/client";

interface Group {
  group_id: number;
  group_name: string;
  description?: string;
}

export default function CreateTripForm() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [isGroupTrip, setIsGroupTrip] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");

  const [state, formAction, isPending] = useActionState(createTrip, {
    error: null,
  });

  // ユーザーが参加しているグループを取得
  useEffect(() => {
    const fetchGroups = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data: userGroups } = await supabase
          .from("group_members")
          .select(`
            groups (
              group_id,
              group_name,
              description
            )
          `)
          .eq("user_id", user.id);

        if (userGroups) {
          const groupList = userGroups
            .map(ug => ug.groups)
            .filter(Boolean)
            .flat() as Group[];
          setGroups(groupList);
        }
      }
    };

    fetchGroups();
  }, []);

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

          {/* グループ旅行設定 */}
          <div className="flex w-[300px] flex-col gap-4">
            <div className="flex items-center justify-between">
              <label className="text-xl font-semibold">グループ旅行として作成</label>
              <Switch
                checked={isGroupTrip}
                onCheckedChange={setIsGroupTrip}
              />
            </div>
            
            {isGroupTrip && (
              <div className="flex flex-col gap-2">
                <label htmlFor="groupSelect" className="text-lg font-medium">
                  グループを選択
                </label>
                <select
                  id="groupSelect"
                  name="groupId"
                  value={selectedGroupId}
                  onChange={(e) => setSelectedGroupId(e.target.value)}
                  className="rounded-md border border-gray-300 p-2 text-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                  required={isGroupTrip}
                >
                  <option value="">グループを選択してください</option>
                  {groups.map((group) => (
                    <option key={group.group_id} value={group.group_id}>
                      {group.group_name}
                    </option>
                  ))}
                </select>
                
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="checkbox"
                    id="createBothTrips"
                    name="createBothTrips"
                    className="w-4 h-4"
                  />
                  <label htmlFor="createBothTrips" className="text-sm text-gray-600">
                    個人旅行も同時に作成して紐付ける
                  </label>
                </div>
              </div>
            )}
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
