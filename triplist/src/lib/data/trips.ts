import { createClient } from "@/lib/supabase/server";
import type { Trip, TripLink } from "@/app/triplist/types";

// データベースから取得される生のTrip型
interface RawTrip {
  trip_id: number;
  location_name: string;
  start_date: string;
  end_date: string;
  group_id: number | null;
  trip_type: "personal" | "group" | null;
  user_id: string;
}

// グループ旅行の型（JOIN結果を含む）
interface RawGroupTrip extends RawTrip {
  groups?: {
    group_name: string;
  }[];
  group_name?: string;
  creator_name?: string;
  creator_email?: string;
}

// getTrips関数をエクスポートする（trip_links対応版）
export async function getTrips(userId: string): Promise<Trip[]> {
  const supabase = await createClient();

  try {
    // 1. ユーザーが所属するグループを取得
    const { data: userGroups, error: groupsError } = await supabase
      .from("group_members")
      .select("group_id")
      .eq("user_id", userId);

    if (groupsError) {
      console.error("Failed to fetch user groups:", groupsError);
      return [];
    }

    const groupIds = userGroups?.map(g => g.group_id) || [];

    // 2. 個人旅行を取得
    const { data: personalTrips, error: personalError } = await supabase
      .from("trips")
      .select(`
        trip_id,
        location_name,
        start_date,
        end_date,
        group_id,
        trip_type,
        user_id
      `)
      .eq("user_id", userId)
      .eq("trip_type", "personal")
      .order("start_date", { ascending: false });

    if (personalError) {
      console.error("Failed to fetch personal trips:", personalError);
    }

    // 3. グループ旅行を取得
    let groupTrips: RawGroupTrip[] = [];
    if (groupIds.length > 0) {
      const { data: fetchedGroupTrips, error: groupTripsError } = await supabase
        .from("trips")
        .select(`
          trip_id,
          location_name,
          start_date,
          end_date,
          group_id,
          trip_type,
          user_id,
          groups!inner(group_name)
        `)
        .in("group_id", groupIds)
        .eq("trip_type", "group")
        .order("start_date", { ascending: false });

      if (groupTripsError) {
        console.error("Failed to fetch group trips:", groupTripsError);
      } else if (fetchedGroupTrips) {
        // ユーザー情報を別途取得
        const userIds = fetchedGroupTrips.map(trip => trip.user_id);
        const { data: users } = await supabase
          .from("user_setting")
          .select("user_id, name, email")
          .in("user_id", userIds);

        const userMap = new Map(users?.map(user => [user.user_id, user]) || []);

        // グループ旅行にユーザー情報を追加
        groupTrips = fetchedGroupTrips.map(trip => {
          const user = userMap.get(trip.user_id);
          return {
            ...trip,
            group_name: trip.groups?.[0]?.group_name,
            creator_name: user?.name || undefined,
            creator_email: user?.email
          };
        });
      }
    }

    // 4. trip_linksテーブルからリンク情報を取得
    const allTripIds = [
      ...(personalTrips?.map(t => t.trip_id) || []),
      ...(groupTrips?.map(t => t.trip_id) || [])
    ];

    const { data: tripLinks, error: linksError } = await supabase
      .from("trip_links")
      .select("*")
      .or(`group_trip_id.in.(${allTripIds.join(",")}),personal_trip_id.in.(${allTripIds.join(",")})`);

    if (linksError) {
      console.error("Failed to fetch trip links:", linksError);
    }

    // 5. 全ての旅行を結合
    const allTrips: (RawTrip | RawGroupTrip)[] = [
      ...(personalTrips || []),
      ...groupTrips
    ];

    // 6. 日付フィルタリング（昨日以降の旅行のみ）
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const filteredTrips = allTrips.filter((trip: RawTrip | RawGroupTrip) => {
      const endDate = new Date(trip.end_date);
      endDate.setHours(0, 0, 0, 0);
      return endDate >= yesterday;
    });

    // 7. リンク情報をマップに変換
    const linkMap = new Map<number, TripLink[]>();
    tripLinks?.forEach(link => {
      // グループ旅行からのリンク
      if (!linkMap.has(link.group_trip_id)) {
        linkMap.set(link.group_trip_id, []);
      }
      linkMap.get(link.group_trip_id)?.push(link);

      // 個人旅行からのリンク
      if (!linkMap.has(link.personal_trip_id)) {
        linkMap.set(link.personal_trip_id, []);
      }
      linkMap.get(link.personal_trip_id)?.push(link);
    });

    // 8. 各旅行にリンク情報を付与
    const extendedTrips: Trip[] = await Promise.all(
      filteredTrips.map(async (trip: RawTrip | RawGroupTrip) => {
        const links = linkMap.get(trip.trip_id) || [];
        const hasLinkedTrip = links.length > 0;

        let linkedTripType: "personal" | "group" | null = null;
        let hasPersonalVersion = false;
        let personalTripId: number | undefined;
        let groupName: string | undefined;

        if (hasLinkedTrip) {
          linkedTripType = trip.trip_type === "personal" ? "group" : "personal";
          
          // 個人旅行の場合、リンクされたグループ旅行からグループ名を取得
          if (trip.trip_type === "personal") {
            const groupLink = links.find(link => link.personal_trip_id === trip.trip_id);
            if (groupLink) {
              const linkedGroupTrip = groupTrips.find(gt => gt.trip_id === groupLink.group_trip_id);
              if (linkedGroupTrip?.group_name) {
                groupName = linkedGroupTrip.group_name;
              }
            }
          }
          
          // グループ旅行の場合、現在のユーザーの個人版があるかチェック
          if (trip.trip_type === "group") {
            const userPersonalLink = links.find(link => 
              link.group_trip_id === trip.trip_id && link.user_id === userId
            );
            
            if (userPersonalLink) {
              hasPersonalVersion = true;
              personalTripId = userPersonalLink.personal_trip_id;
            }
          }
        }

        const baseTrip: Trip = {
          trip_id: trip.trip_id,
          location_name: trip.location_name,
          start_date: trip.start_date,
          end_date: trip.end_date,
          group_id: trip.group_id,
          trip_type: trip.trip_type,
          user_id: trip.user_id,
          hasLinkedTrip,
          linkedTripType,
          hasPersonalVersion,
          personalTripId
        };

        // グループ旅行の場合、追加情報を設定
        if ("group_name" in trip && trip.group_name) {
          baseTrip.group_name = trip.group_name;
        }
        // 個人旅行でもリンクからグループ名を設定
        if (groupName) {
          baseTrip.group_name = groupName;
        }
        if ("creator_name" in trip && trip.creator_name) {
          baseTrip.creator_name = trip.creator_name;
        }
        if ("creator_email" in trip && trip.creator_email) {
          baseTrip.creator_email = trip.creator_email;
        }

        return baseTrip;
      })
    );

    return extendedTrips.sort((a, b) => 
      new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
    );

  } catch (error) {
    console.error("getTrips error:", error);
    return [];
  }
}
