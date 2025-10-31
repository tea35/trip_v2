import { createClient } from "@/lib/supabase/server";
import type { Trip, TripLink } from "@/app/triplist/types";

export interface groupTrip {
  trip_id: number;
  location_name: string;
  start_date: string;
  end_date: string;
  group_id: number | null;
  trip_type: "personal" | "group";
  groups: {
    group_name: string;
  } | null;
}

export async function getTrips(userId: string): Promise<Trip[]> {
  const supabase = await createClient();

  try {
    const { data: userGroups, error: groupsError } = await supabase
      .from("group_members")
      .select("group_id")
      .eq("user_id", userId);

    if (groupsError) {
      console.error("Failed to fetch user groups:", groupsError);
      return [];
    }

    const groupIds = userGroups?.map((g) => g.group_id) || [];

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayISO = yesterday.toISOString().split("T")[0]; // YYYY-MM-DD形式

    const { data: personalTrips, error: personalError } = await supabase
      .from("trips")
      .select(
        `
        trip_id,
        location_name,
        start_date,
        end_date,
        group_id,
        trip_type
      `
      )
      .eq("user_id", userId)
      .eq("trip_type", "personal")
      .gte("end_date", yesterdayISO)
      .order("start_date", { ascending: false });

    if (personalError) {
      console.error("Failed to fetch personal trips:", personalError);
    }

    if (groupIds.length === 0) {
      return (
        personalTrips?.map((trip) => ({
          ...trip,
          hasLinkedTrip: false,
          linkedTripType: null,
          hasPersonalVersion: false,
          personalTripId: undefined,
          group_name: undefined,
        })) || []
      );
    }

    const { data: GroupTrips, error: groupTripsError } = await supabase
      .from("trips")
      .select<string, groupTrip>(
        `
        trip_id,
        location_name,
        start_date,
        end_date,
        group_id,
        trip_type,
        groups!inner(group_name)
      `
      )
      .in("group_id", groupIds)
      .eq("trip_type", "group")
      .gte("end_date", yesterdayISO)
      .order("start_date", { ascending: false });

    if (groupTripsError) {
      console.error("Failed to fetch group trips:", groupTripsError);
    }

    const formattedPersonalTrips =
      personalTrips?.map((trip) => ({
        ...trip,
        groups: { group_name: undefined },
      })) || [];

    const formattedGroupTrips = GroupTrips || [];
    const allTrips = [...formattedPersonalTrips, ...formattedGroupTrips];

    const personalTripIds = personalTrips?.map((t) => t.trip_id) || [];
    const groupTripIds = GroupTrips?.map((t) => t.trip_id) || [];

    const { data: tripLinks, error: linksError } = await supabase
      .from("trip_links")
      .select("*")
      .or(
        `group_trip_id.in.(${groupTripIds.join(
          ","
        )}),personal_trip_id.in.(${personalTripIds.join(",")})`
      );

    if (linksError) {
      console.error("Failed to fetch trip links:", linksError);
    }

    const linkMap = new Map<number, TripLink[]>();
    tripLinks?.forEach((link) => {
      if (!linkMap.has(link.group_trip_id)) {
        linkMap.set(link.group_trip_id, []);
      }
      linkMap.get(link.group_trip_id)?.push(link);

      if (!linkMap.has(link.personal_trip_id)) {
        linkMap.set(link.personal_trip_id, []);
      }
      linkMap.get(link.personal_trip_id)?.push(link);
    });

    const extendedTrips: Trip[] = await Promise.all(
      allTrips.map(async (trip) => {
        const links = linkMap.get(trip.trip_id) || [];
        const hasLinkedTrip = links.length > 0;

        let linkedTripType: "personal" | "group" | null = null;
        let hasPersonalVersion = false;
        let personalTripId: number | undefined;
        let group_name: string | undefined;

        if (hasLinkedTrip) {
          linkedTripType = trip.trip_type === "personal" ? "group" : "personal";

          if (trip.trip_type === "group") {
            const userPersonalLink = links.find(
              (link) =>
                link.group_trip_id === trip.trip_id && link.user_id === userId
            );

            if (userPersonalLink) {
              hasPersonalVersion = true;
              personalTripId = userPersonalLink.personal_trip_id;
            }
          }
        }

        const allTrips: Trip = {
          trip_id: trip.trip_id,
          location_name: trip.location_name,
          start_date: trip.start_date,
          end_date: trip.end_date,
          group_id: trip.group_id,
          trip_type: trip.trip_type,
          hasLinkedTrip,
          linkedTripType,
          group_name,
          hasPersonalVersion,
          personalTripId,
        };
        return allTrips;
      })
    );

    return extendedTrips.sort(
      (a, b) =>
        new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
    );
  } catch (error) {
    console.error("getTrips error:", error);
    return [];
  }
}
