"use server";

import { createClient } from "@/lib/supabase/server";

export interface GroupMember {
  user_id: string;
  email: string;
  name?: string;
  role: "admin" | "member";
  joined_at: string;
}

export interface GroupData {
  group_id: number;
  group_name: string;
  created_by: string;
  created_at: string;
  members: GroupMember[];
}

export interface ActionState {
  success?: boolean;
  error?: string;
}

export interface GroupTrip {
  trip_id: number;
  location_name: string;
  start_date: string;
  end_date: string;
  created_at: string;
  trip_type: "personal" | "group";
  group_id: number | null;
  user_id: string;
  users: {
    name: string | null;
    email: string;
  } | null;
  hasPersonalTrip?: boolean;
  personalTripId?: number;
}

export interface CreatePersonalTripState {
  success: boolean;
  error?: string;
  tripId?: number;
}

// グループ詳細を取得
export async function getGroupDetails(
  group_id: number
): Promise<GroupData | null> {
  const supabase = await createClient();

  try {
    // 認証チェック
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return null;
    }

    // ユーザーがこのグループのメンバーかチェック
    const { data: membership } = await supabase
      .from("group_members")
      .select("role")
      .eq("group_id", group_id)
      .eq("user_id", user.id)
      .single();

    if (!membership) {
      // メンバーでない場合はアクセス拒否
      return null;
    }

    // グループ情報を取得
    const { data: group, error: groupError } = await supabase
      .from("groups")
      .select("*")
      .eq("group_id", group_id)
      .single();

    if (groupError || !group) {
      return null;
    }

    // グループメンバー情報を取得
    const { data: members, error: membersError } = await supabase
      .from("group_members")
      .select("group_id, role, user_id, joined_at")
      .eq("group_id", group_id);

    if (membersError) {
      console.error("Members fetch error:", membersError);
      return null;
    }

    // メンバーがいない場合は空配列で返す
    if (!members || members.length === 0) {
      return {
        group_id: group.group_id,
        group_name: group.group_name,
        created_by: group.created_by,
        created_at: group.created_at,
        members: [],
      };
    }

    // 全メンバーのuser_idを配列で取得
    const memberUserIds = members.map((m) => m.user_id);

    // 一回のクエリで全ユーザー情報を取得
    const { data: userSettings, error: userSettingsError } = await supabase
      .from("user_setting")
      .select("user_id, email, name")
      .in("user_id", memberUserIds);

    if (userSettingsError) {
      console.error("User settings fetch error:", userSettingsError);
      return null;
    }

    // Mapで効率的に結合
    const userSettingMap = new Map(
      userSettings?.map((us) => [us.user_id, us]) || []
    );

    // データを整形
    const formattedMembers: GroupMember[] = members.map((member) => {
      const userSetting = userSettingMap.get(member.user_id);

      return {
        user_id: member.user_id,
        email: userSetting?.email || "",
        name: userSetting?.name || "",
        role: member.role,
        joined_at: member.joined_at,
      };
    });

    return {
      group_id: group.group_id,
      group_name: group.group_name,
      created_by: group.created_by,
      created_at: group.created_at,
      members: formattedMembers,
    };
  } catch (error) {
    console.error("Group details fetch error:", error);
    return null;
  }
}

// グループを削除
export async function deleteGroup(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient();

  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return { error: "認証が必要です" };
    }

    const group_id = Number(formData.get("group_id") as string);

    // 管理者権限チェック
    const { data: membership } = await supabase
      .from("group_members")
      .select("role")
      .eq("group_id", group_id)
      .eq("user_id", user.id)
      .single();

    if (!membership || membership.role !== "admin") {
      return { error: "グループを削除する権限がありません" };
    }

    // グループメンバーを削除
    await supabase.from("group_members").delete().eq("group_id", group_id);

    // グループを削除
    const { error: deleteError } = await supabase
      .from("groups")
      .delete()
      .eq("group_id", group_id);

    if (deleteError) {
      return { error: "グループの削除に失敗しました" };
    }

    return { success: true };
  } catch (error) {
    console.error("Group deletion error:", error);
    return { error: "予期しないエラーが発生しました" };
  }
}

// メンバーを追加
export async function addMember(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient();

  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return { error: "認証が必要です" };
    }

    const group_id = Number(formData.get("group_id") as string);
    const email = formData.get("email") as string;

    // グループメンバーかどうかチェック（管理者権限は不要）
    const { data: membership } = await supabase
      .from("group_members")
      .select("role")
      .eq("group_id", group_id)
      .eq("user_id", user.id)
      .single();

    if (!membership) {
      return { error: "グループのメンバーのみメンバーを追加できます" };
    }

    // ユーザーを検索
    const { data: userData, error: userError } = await supabase
      .from("user_setting")
      .select("user_id")
      .eq("email", email.trim())
      .single();

    if (userError || !userData) {
      return { error: "指定されたメールアドレスのユーザーが見つかりません" };
    }

    // 既にメンバーかチェック
    const { data: existingMember } = await supabase
      .from("group_members")
      .select("user_id")
      .eq("group_id", group_id)
      .eq("user_id", userData.user_id)
      .single();

    if (existingMember) {
      return { error: "このユーザーは既にグループのメンバーです" };
    }

    // メンバーを追加
    const { error: addError } = await supabase.from("group_members").insert({
      group_id: group_id,
      user_id: userData.user_id,
      role: "member",
    });

    if (addError) {
      return { error: "メンバーの追加に失敗しました" };
    }

    return { success: true };
  } catch (error) {
    console.error("Member addition error:", error);
    return { error: "予期しないエラーが発生しました" };
  }
}

// メンバーを削除
export async function removeMember(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient();

  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return { error: "認証が必要です" };
    }

    const group_id = Number(formData.get("group_id") as string);
    const memberUserId = formData.get("memberUserId") as string;

    // 管理者権限チェック（または自分自身を削除する場合）
    const { data: membership } = await supabase
      .from("group_members")
      .select("role")
      .eq("group_id", group_id)
      .eq("user_id", user.id)
      .single();

    const isAdmin = membership?.role === "admin";
    const isSelf = user.id === memberUserId;

    if (!isAdmin && !isSelf) {
      return { error: "メンバーを削除する権限がありません" };
    }

    // 削除対象のメンバー情報を取得
    const { data: targetMember } = await supabase
      .from("group_members")
      .select("role")
      .eq("group_id", group_id)
      .eq("user_id", memberUserId)
      .single();

    // 最後の管理者を削除しようとした場合
    if (targetMember?.role === "admin") {
      const { data: adminCount } = await supabase
        .from("group_members")
        .select("id")
        .eq("group_id", group_id)
        .eq("role", "admin");

      if (adminCount && adminCount.length <= 1) {
        return { error: "最後の管理者は削除できません" };
      }
    }

    // メンバーを削除
    const { error: removeError } = await supabase
      .from("group_members")
      .delete()
      .eq("group_id", group_id)
      .eq("user_id", memberUserId);

    if (removeError) {
      return { error: "メンバーの削除に失敗しました" };
    }

    return { success: true };
  } catch (error) {
    console.error("Member removal error:", error);
    return { error: "予期しないエラーが発生しました" };
  }
}

// グループの旅行を取得
export async function getGroupTrips(groupId: number, currentUserId: string): Promise<GroupTrip[]> {
  const supabase = await createClient();
  
  try {
    // 認証チェック
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id !== currentUserId) {
      throw new Error("認証が必要です");
    }

    // ユーザーがグループのメンバーかチェック
    const { data: member } = await supabase
      .from("group_members")
      .select("user_id")
      .eq("group_id", groupId)
      .eq("user_id", user.id)
      .single();

    if (!member) {
      throw new Error("このグループにアクセスする権限がありません");
    }

    // グループの旅行を取得（group_idが指定されている旅行のみ）
    const { data: trips, error } = await supabase
      .from("trips")
      .select(`
        trip_id,
        location_name,
        start_date,
        end_date,
        created_at,
        trip_type,
        group_id,
        user_id
      `)
      .eq("group_id", groupId)
      .order("start_date", { ascending: false });

    if (error) {
      console.error("グループ旅行取得エラー:", error);
      throw new Error("旅行の取得に失敗しました");
    }

    if (!trips || trips.length === 0) {
      return [];
    }

    // ユーザー情報を別途取得
    const userIds = trips.map(trip => trip.user_id);
    const { data: users } = await supabase
      .from("user_setting")
      .select("user_id, name, email")
      .in("user_id", userIds);

    const userMap = new Map(users?.map(user => [user.user_id, user]) || []);

    // 各グループ旅行に対して、現在のユーザーの個人旅行があるかチェック
    const tripsWithPersonalInfo = await Promise.all(
      trips.map(async (trip) => {
        const user = userMap.get(trip.user_id);
        
        // 同じ場所・日程の個人旅行を検索
        const { data: personalTrip } = await supabase
          .from("trips")
          .select("trip_id")
          .eq("user_id", currentUserId)
          .eq("location_name", trip.location_name)
          .eq("start_date", trip.start_date)
          .eq("end_date", trip.end_date)
          .eq("trip_type", "personal")
          .single();

        return {
          ...trip,
          users: user ? {
            name: user.name,
            email: user.email
          } : null,
          hasPersonalTrip: !!personalTrip,
          personalTripId: personalTrip?.trip_id,
        };
      })
    );

    return tripsWithPersonalInfo;
  } catch (error) {
    console.error("getGroupTrips error:", error);
    throw error;
  }
}

// グループ旅行をベースに個人旅行を作成
export async function createPersonalTripForGroup(
  prevState: CreatePersonalTripState,
  formData: FormData
): Promise<CreatePersonalTripState> {
  const supabase = await createClient();

  try {
    // 認証チェック
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "認証が必要です" };
    }

    const groupTripId = parseInt(formData.get("groupTripId") as string);
    const groupId = parseInt(formData.get("groupId") as string);

    if (!groupTripId || !groupId) {
      return { success: false, error: "必要な情報が不足しています" };
    }

    // グループ旅行の情報を取得
    const { data: groupTrip, error: groupTripError } = await supabase
      .from("trips")
      .select("*")
      .eq("trip_id", groupTripId)
      .eq("group_id", groupId)
      .single();

    if (groupTripError || !groupTrip) {
      return { success: false, error: "グループ旅行が見つかりません" };
    }

    // ユーザーがグループのメンバーかチェック
    const { data: member } = await supabase
      .from("group_members")
      .select("user_id")
      .eq("group_id", groupId)
      .eq("user_id", user.id)
      .single();

    if (!member) {
      return { success: false, error: "このグループにアクセスする権限がありません" };
    }

    // 既に個人旅行が存在するかチェック
    const { data: existingTrip } = await supabase
      .from("trips")
      .select("trip_id")
      .eq("user_id", user.id)
      .eq("location_name", groupTrip.location_name)
      .eq("start_date", groupTrip.start_date)
      .eq("end_date", groupTrip.end_date)
      .eq("trip_type", "personal")
      .single();

    if (existingTrip) {
      return { success: false, error: "既に個人版の旅行が存在します" };
    }

    // 個人旅行を作成
    const { data: newTrip, error: createError } = await supabase
      .from("trips")
      .insert({
        user_id: user.id,
        location_name: groupTrip.location_name,
        start_date: groupTrip.start_date,
        end_date: groupTrip.end_date,
        trip_type: "personal",
        group_id: null, // 個人旅行なのでgroup_idはnull
      })
      .select("trip_id")
      .single();

    if (createError || !newTrip) {
      console.error("個人旅行作成エラー:", createError);
      return { success: false, error: "個人旅行の作成に失敗しました" };
    }

    return { 
      success: true, 
      tripId: newTrip.trip_id,
    };

  } catch (error) {
    console.error("個人旅行作成エラー:", error);
    return { success: false, error: "個人旅行の作成に失敗しました" };
  }
}
