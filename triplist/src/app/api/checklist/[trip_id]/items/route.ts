import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { getTripIdFromApiHeaders } from "@/lib/utils/url";

export async function GET(
  _request: NextRequest,
  { params: _params }: { params: Promise<{ trip_id: string }> }
) {
  try {
    const supabase = await createClient();
    
    // middlewareのURL関数からtrip_idを取得（API専用）
    const tripId = await getTripIdFromApiHeaders();
    
    if (!tripId) {
      return NextResponse.json({ error: "Invalid trip ID" }, { status: 400 });
    }

    // 認証チェック
    const {
      data: { user },
    } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 旅行が本人のものかチェック
    const { data: trip, error: tripError } = await supabase
      .from("trips")
      .select("trip_id")
      .eq("trip_id", tripId)
      .eq("user_id", user.id)
      .single();

    if (tripError || !trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }

    // チェックリスト項目を取得
    const { data: items, error: itemsError } = await supabase
      .from("items")
      .select("item_id, item_name, quantity, is_checked")
      .eq("trip_id", tripId)
      .order("item_id", { ascending: true });

    if (itemsError) {
      console.error("Failed to fetch items:", itemsError);
      return NextResponse.json({ error: "Failed to fetch items" }, { status: 500 });
    }

    return NextResponse.json(items || []);
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
