import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ trip_id: string }> }
) {
  try {
    const supabase = await createClient();

    // paramsからtrip_idを取得
    const { trip_id: tripIdString } = await params;
    const tripId = parseInt(tripIdString);

    if (isNaN(tripId)) {
      return NextResponse.json({ error: "Invalid trip ID" }, { status: 400 });
    }

    // 認証チェック
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 旅行の存在確認とアクセス権限チェック
    const { data: trip, error: tripError } = await supabase
      .from("trips")
      .select("trip_id, trip_type, group_id, user_id")
      .eq("trip_id", tripId)
      .single();

    if (tripError || !trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }

    // アクセス権限チェック
    let hasAccess = false;

    if (trip.user_id === user.id) {
      // 自分が作成した旅行の場合
      hasAccess = true;
    } else if (trip.trip_type === "group" && trip.group_id) {
      // グループ旅行の場合、グループメンバーかチェック
      const { data: memberCheck } = await supabase
        .from("group_members")
        .select("user_id")
        .eq("group_id", trip.group_id)
        .eq("user_id", user.id)
        .single();

      if (memberCheck) {
        hasAccess = true;
      }
    }

    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // チェックリスト項目を取得
    const { data: items, error: itemsError } = await supabase
      .from("items")
      .select("item_id, item_name, quantity, is_checked")
      .eq("trip_id", tripId)
      .order("item_id", { ascending: true });

    if (itemsError) {
      console.error("Failed to fetch items:", itemsError);
      return NextResponse.json(
        { error: "Failed to fetch items" },
        { status: 500 }
      );
    }

    return NextResponse.json(items || []);
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
