"use client";

import React, { useState } from "react";
import type { Trip, TripListProps } from "../types";
import TripItem from "./TripItem";
import AddTripButton from "./AddTripButton";
import NoTripsMessage from "./NoTripsMessage";
import { deleteTrip } from "../actions";

export default function TripListComponent({
  user: _user,
  initialTrips,
}: TripListProps) {
  const [trips, setTrips] = useState<Trip[]>(initialTrips);

  const handleDelete = async (tripId: number) => {
    if (!confirm("この旅行を削除しますか？")) return;

    // サーバーに削除を依頼
    const result = await deleteTrip(tripId);
    // UIを即座に更新（オプティミスティックUI）
    if (result?.success) {
      setTrips((currentTrips) =>
        currentTrips.filter((trip) => trip.trip_id !== tripId)
      );
    }

    if (result?.error) {
      console.error("旅行の削除中にエラーが発生しました:", result.error);
      alert("削除に失敗しました。");
      // エラーが発生した場合、UIを元に戻す（任意）
      setTrips(initialTrips);
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-cover bg-center py-20">
      <div className="relative flex h-[75vh] w-[800px] max-w-[600px] flex-col gap-5 rounded-lg bg-white/85 p-10 pt-20 shadow-xl md:p-12 md:pt-24">
        <p className="text-2xl font-bold">旅行リスト</p>

        <AddTripButton />

        <div className="flex flex-col items-center gap-4 overflow-y-auto p-5 pb-0">
          {trips.length > 0 ? (
            trips.map((trip) => (
              <TripItem
                key={trip.trip_id}
                trip={trip}
                onDelete={handleDelete} // 削除関数をPropsとして渡す
              />
            ))
          ) : (
            <NoTripsMessage />
          )}
        </div>
      </div>
    </div>
  );
}
