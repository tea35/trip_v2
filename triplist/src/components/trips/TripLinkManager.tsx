"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Link2, Unlink } from "lucide-react";
import { linkTrips, unlinkTrips } from "@/lib/actions/trip-links.actions";
import { TripWithLink } from "@/lib/data/trip-links";

interface TripLinkManagerProps {
  trip: TripWithLink;
  availableTrips: TripWithLink[];
}

export default function TripLinkManager({
  trip,
  availableTrips,
}: TripLinkManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTripId, setSelectedTripId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  // 紐付け可能な旅行をフィルタリング
  const linkableTrips = availableTrips.filter(
    (t) =>
      t.trip_id !== trip.trip_id &&
      !t.is_linked &&
      t.trip_type !== trip.trip_type // 個人とグループは紐付け可能
  );

  const handleLink = async () => {
    if (!selectedTripId) return;

    setIsLoading(true);
    try {
      const personalTripId =
        trip.trip_type === "personal" ? trip.trip_id : parseInt(selectedTripId);
      const groupTripId =
        trip.trip_type === "group" ? trip.trip_id : parseInt(selectedTripId);

      const result = await linkTrips(personalTripId, groupTripId);

      if (result.success) {
        setIsOpen(false);
        setSelectedTripId("");
      } else {
        alert(result.error || "紐付けに失敗しました");
      }
    } catch {
      alert("紐付けに失敗しました");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnlink = async () => {
    if (!trip.linked_trip) return;

    setIsLoading(true);
    try {
      const personalTripId =
        trip.trip_type === "personal" ? trip.trip_id : trip.linked_trip.trip_id;
      const groupTripId =
        trip.trip_type === "group" ? trip.trip_id : trip.linked_trip.trip_id;

      const result = await unlinkTrips(personalTripId, groupTripId);

      if (!result.success) {
        alert(result.error || "紐付け解除に失敗しました");
      }
    } catch {
      alert("紐付け解除に失敗しました");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex gap-2">
      {trip.is_linked ? (
        <Button
          variant="outline"
          size="sm"
          onClick={handleUnlink}
          disabled={isLoading}
          className="text-red-600 hover:text-red-700"
        >
          <Unlink className="h-4 w-4 mr-1" />
          紐付け解除
        </Button>
      ) : (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Link2 className="h-4 w-4 mr-1" />
              紐付け
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>旅行を紐付け</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">現在の旅行</label>
                <p className="text-sm text-gray-600">
                  {trip.location_name} (
                  {trip.trip_type === "personal" ? "個人" : "グループ"})
                </p>
              </div>

              <div>
                <label className="text-sm font-medium">
                  紐付ける旅行を選択
                </label>
                <select
                  value={selectedTripId}
                  onChange={(e) => setSelectedTripId(e.target.value)}
                  className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">旅行を選択してください</option>
                  {linkableTrips.map((linkableTrip) => (
                    <option
                      key={linkableTrip.trip_id}
                      value={linkableTrip.trip_id.toString()}
                    >
                      {linkableTrip.location_name} (
                      {linkableTrip.trip_type === "personal"
                        ? "個人"
                        : "グループ"}
                      )
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setIsOpen(false)}>
                  キャンセル
                </Button>
                <Button
                  onClick={handleLink}
                  disabled={!selectedTripId || isLoading}
                >
                  {isLoading ? "紐付け中..." : "紐付け"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
