"use client";

import React, { useState, useMemo } from "react";
import { Plus, Search, MapPin } from "lucide-react";
import { useRouter } from "next/navigation";
import { typographyStyles, globalTextSizes } from "@/styles/typography";
import type { Trip, TripListProps } from "../types";
import TripItem from "./TripItem";
import { deleteTrip } from "../actions";
import { createPersonalTripFromGroupTrip } from "@/lib/actions/personalTrip.actions";

// 旅行グループの型定義
interface TripGroup {
  id: string;
  mainTrip: Trip;
  linkedTrip?: Trip;
  isLinked: boolean;
}

export default function TripListComponent({
  user: _user,
  initialTrips,
}: TripListProps) {
  const router = useRouter();
  const [trips, _setTrips] = useState<Trip[]>(initialTrips);
  const [searchTerm, setSearchTerm] = useState("");

  // 旅行をグループ化する処理
  const tripGroups = useMemo(() => {
    const processedIds = new Set<number>();
    const groups: TripGroup[] = [];

    // 検索フィルタリング
    const filteredTrips = trips.filter((trip) =>
      trip.location_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    filteredTrips.forEach((trip) => {
      if (processedIds.has(trip.trip_id)) return;

      if (trip.hasLinkedTrip) {
        // グループ旅行の場合：関連する個人旅行があるかチェック
        if (trip.trip_type === "group") {
          // このグループ旅行に関連する個人旅行を探す
          const linkedPersonalTrip = filteredTrips.find(
            (t) =>
              t.trip_id !== trip.trip_id &&
              t.trip_type === "personal" &&
              t.hasLinkedTrip &&
              t.location_name === trip.location_name &&
              t.start_date === trip.start_date &&
              t.end_date === trip.end_date
          );

          if (linkedPersonalTrip) {
            // グループ旅行をメイン、個人旅行をリンクにする
            groups.push({
              id: `linked_${trip.trip_id}_${linkedPersonalTrip.trip_id}`,
              mainTrip: trip,
              linkedTrip: linkedPersonalTrip,
              isLinked: true,
            });

            processedIds.add(trip.trip_id);
            processedIds.add(linkedPersonalTrip.trip_id);
          } else {
            // グループ旅行のみ表示
            groups.push({
              id: `single_${trip.trip_id}`,
              mainTrip: trip,
              isLinked: false,
            });
            processedIds.add(trip.trip_id);
          }
        } else if (trip.trip_type === "personal") {
          // 個人旅行でリンクがある場合：対応するグループ旅行を探す
          const linkedGroupTrip = filteredTrips.find(
            (t) =>
              t.trip_id !== trip.trip_id &&
              t.trip_type === "group" &&
              t.hasLinkedTrip &&
              t.location_name === trip.location_name &&
              t.start_date === trip.start_date &&
              t.end_date === trip.end_date
          );

          if (!linkedGroupTrip) {
            // 対応するグループ旅行が見つからない場合（表示範囲外）
            groups.push({
              id: `single_${trip.trip_id}`,
              mainTrip: trip,
              isLinked: false,
            });
            processedIds.add(trip.trip_id);
          }
          // グループ旅行が見つかった場合は、グループ旅行の処理で一緒に処理される
        }
      } else {
        // リンクがない旅行
        groups.push({
          id: `single_${trip.trip_id}`,
          mainTrip: trip,
          isLinked: false,
        });
        processedIds.add(trip.trip_id);
      }
    });

    // 出発日順でソート
    return groups.sort(
      (a, b) =>
        new Date(b.mainTrip.start_date).getTime() -
        new Date(a.mainTrip.start_date).getTime()
    );
  }, [trips, searchTerm]);

  const handleDelete = async (tripId: number) => {
    // 削除対象の旅行を見つける
    const tripToDelete = trips.find((t) => t.trip_id === tripId);

    if (!tripToDelete) return;

    // 紐付けされた旅行の場合の削除順序制御
    if (tripToDelete.hasLinkedTrip) {
      // 紐付けされた旅行ペアを探す
      const linkedTrip = trips.find(
        (t) =>
          t.trip_id !== tripId &&
          t.hasLinkedTrip &&
          t.location_name === tripToDelete.location_name &&
          t.start_date === tripToDelete.start_date &&
          t.end_date === tripToDelete.end_date
      );

      if (linkedTrip) {
        // 両方が存在する場合、グループ旅行を削除しようとしたら個人旅行を削除
        if (tripToDelete.trip_type === "group") {
          if (!confirm("紐付けされた個人旅行を削除します。よろしいですか？"))
            return;
          tripId = linkedTrip.trip_id; // 個人旅行のIDに変更
        } else {
          if (
            !confirm(
              "この個人旅行を削除しますか？次回はグループ旅行が削除されます。"
            )
          )
            return;
        }
      } else {
        // リンク先が見つからない場合（データ不整合の可能性があるが、そのまま削除）
        if (!confirm("この旅行を削除しますか？")) return;
      }
    } else {
      if (!confirm("この旅行を削除しますか？")) return;
    }

    try {
      const result = await deleteTrip(tripId);
      if (result?.success) {
        // 削除成功時は、Server ActionのrevalidatePath効果を適用するためページをリロード
        window.location.reload();
      } else {
        alert(result?.error || "削除に失敗しました。");
      }
    } catch (error) {
      console.error("削除エラー:", error);
      alert("削除中にエラーが発生しました");
    }
  };

  const handleCreatePersonalVersion = async (groupTrip: Trip) => {
    try {
      const result = await createPersonalTripFromGroupTrip(groupTrip.trip_id);

      if (result.success && result.tripId) {
        // 成功時はクライアントサイドでリダイレクト
        router.push(`/checklist/${result.tripId}`);
      } else {
        alert(result.error || "個人版の作成に失敗しました");
      }
    } catch (error) {
      console.error("個人版作成エラー:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "個人版作成中にエラーが発生しました";
      alert(errorMessage);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* コンパクトなヘッダー */}
      <div className="bg-white/90 backdrop-blur-sm border-b border-gray-200 sticky top-16 z-40">
        <div className="container mx-auto px-4 py-4 max-w-4xl">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className={typographyStyles.pageTitle}>旅行リスト</h1>
            </div>
            <button
              onClick={() => router.push("/createtrip")}
              className={`bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 flex items-center gap-2 md:hidden ${typographyStyles.button}`}
            >
              <Plus className="h-4 w-4" />
              新規作成
            </button>
          </div>

          {/* コンパクトな検索バー */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="場所で検索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none ${globalTextSizes.input}`}
            />
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {tripGroups.length > 0 ? (
          <div className="space-y-3">
            {tripGroups.map((group) => (
              <TripItem
                key={group.id}
                trip={group.mainTrip}
                linkedTrip={group.linkedTrip}
                onDelete={handleDelete}
                onCreatePersonalVersion={handleCreatePersonalVersion}
              />
            ))}
          </div>
        ) : (
          /* 空の状態 - コンパクト版 */
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="bg-white rounded-xl p-6 shadow-md max-w-sm mx-auto">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className={`${typographyStyles.sectionTitle} mb-2`}>
                {searchTerm
                  ? "検索結果が見つかりません"
                  : "旅行を作成しましょう"}
              </h3>
              <p className={`${globalTextSizes.bodySmall} text-gray-600 mb-4`}>
                {searchTerm
                  ? "別のキーワードで検索してみてください"
                  : "最初の旅行を作成してチェックリストを始めましょう"}
              </p>
              {!searchTerm && (
                <button
                  onClick={() => router.push("/createtrip")}
                  className={`bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors ${typographyStyles.button}`}
                >
                  <Plus className="h-4 w-4 mr-2 inline" />
                  旅行を作成
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
