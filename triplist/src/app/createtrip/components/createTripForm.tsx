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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Users, User } from "lucide-react";
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
  const [createBothTrips, setCreateBothTrips] = useState(false);

  const [state, formAction, isPending] = useActionState(createTrip, {
    error: null,
  });

  // ユーザーが参加しているグループを取得
  useEffect(() => {
    const fetchGroups = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: userGroups } = await supabase
          .from("group_members")
          .select(
            `
            groups (
              group_id,
              group_name,
              description
            )
          `
          )
          .eq("user_id", user.id);

        if (userGroups) {
          const groupList = userGroups
            .map((ug) => ug.groups)
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
      <p className="mx-auto text-2xl font-bold">旅行情報</p>
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

          {/* 旅行タイプ選択 */}
          <div className="flex w-[300px] flex-col gap-4">
            <div className="flex items-center justify-between">
              <label className="text-xl font-semibold">
                グループ旅行として作成
              </label>
              <Switch checked={isGroupTrip} onCheckedChange={setIsGroupTrip} />
            </div>

            {/* 旅行タイプの説明カード */}
            <Card
              className={`border transition-colors ${
                isGroupTrip
                  ? createBothTrips
                    ? "border-purple-200 bg-purple-50"
                    : "border-blue-200 bg-blue-50"
                  : "border-gray-200 bg-gray-50"
              }`}
            >
              <CardContent className="p-3">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    {isGroupTrip ? (
                      createBothTrips ? (
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-purple-600" />
                          <User className="h-3 w-3 text-purple-600" />
                        </div>
                      ) : (
                        <Users className="h-4 w-4 text-blue-600" />
                      )
                    ) : (
                      <User className="h-4 w-4 text-gray-600" />
                    )}
                    <div className="flex-1">
                      <div className="font-medium text-xs">
                        {isGroupTrip
                          ? createBothTrips
                            ? "グループ + 個人旅行"
                            : "グループ旅行"
                          : "個人旅行"}
                      </div>
                      <div className="text-xs text-gray-600">
                        {isGroupTrip
                          ? createBothTrips
                            ? "共有 + あなた専用の両方作成"
                            : "メンバーと共有"
                          : "自分専用"}
                      </div>
                    </div>
                  </div>

                  {isGroupTrip && (
                    <div className="flex flex-col gap-1 pl-6">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="createBothTrips"
                          name="createBothTrips"
                          checked={createBothTrips}
                          onChange={(e) => setCreateBothTrips(e.target.checked)}
                          className="w-3 h-3 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                        />
                        <label
                          htmlFor="createBothTrips"
                          className="text-xs text-gray-700 cursor-pointer font-medium"
                        >
                          両方作成
                        </label>
                      </div>
                      <div className="text-xs text-gray-500 ml-5">
                        グループ用と個人用の旅行を同時に作成
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {isGroupTrip && (
              <div className="flex flex-col gap-3">
                <Label htmlFor="groupSelect" className="text-lg font-medium">
                  グループを選択
                </Label>
                <Select
                  value={selectedGroupId}
                  onValueChange={setSelectedGroupId}
                  required={isGroupTrip}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="グループを選択してください" />
                  </SelectTrigger>
                  <SelectContent>
                    {groups.map((group) => (
                      <SelectItem
                        key={group.group_id}
                        value={group.group_id.toString()}
                      >
                        {group.group_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* 隠しinputでフォームデータに含める */}
                <input type="hidden" name="groupId" value={selectedGroupId} />
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
