"use server";

import { createClient } from "@/lib/supabase/server";

export interface GroupSummary {
  group_id: number;
  group_name: string;
  created_at: string;
  role: "admin" | "member";
  member_count: number;
}

// ユーザーのグループ一覧を取得
export async function getUserGroups(): Promise<GroupSummary[] | null> {
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

    // ユーザーが参加しているグループを取得
    const { data: memberships, error: membershipError } = await supabase
      .from("group_members")
      .select(
        `
        role,
        groups:group_id (
          group_id,
          group_name,
          created_at
        )
      `
      )
      .eq("user_id", user.id);

    if (membershipError || !memberships) {
      console.error("Membership fetch error:", membershipError);
      return [];
    }

    // 各グループのメンバー数を取得
    const groupIds = (memberships || [])
      .filter((membership) => membership.groups)
      .map((membership) => {
        const group = Array.isArray(membership.groups)
          ? membership.groups[0]
          : membership.groups;
        return group?.group_id;
      })
      .filter(Boolean) as number[];

    const memberCounts: { [key: number]: number } = {};

    for (const groupId of groupIds) {
      const { data: members, error } = await supabase
        .from("group_members")
        .select("user_id")
        .eq("group_id", groupId);

      if (!error && members) {
        memberCounts[groupId] = members.length;
      }
    }

    // データを整形
    const groups: GroupSummary[] = (memberships || [])
      .filter((membership) => membership.groups)
      .map((membership) => {
        const group = Array.isArray(membership.groups)
          ? membership.groups[0]
          : membership.groups;

        return {
          group_id: group?.group_id || 0,
          group_name: group?.group_name || "",
          created_at: group?.created_at || "",
          role: membership.role,
          member_count: memberCounts[group?.group_id || 0] || 0,
        };
      })
      .filter((group) => group.group_id); // IDが存在するもののみ

    return groups;
  } catch (error) {
    console.error("User groups fetch error:", error);
    return [];
  }
}
