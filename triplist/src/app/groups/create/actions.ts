"use server";

import { createClient } from "@/lib/supabase/server";

export interface CreateGroupState {
  success?: boolean;
  error?: string;
  group_id?: number;
}

export async function createGroup(
  prevState: CreateGroupState,
  formData: FormData
): Promise<CreateGroupState> {
  const supabase = await createClient();

  try {
    // 認証チェック
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return { error: "認証が必要です" };
    }

    const groupName = formData.get("groupName") as string;
    const memberEmails = formData.getAll("memberEmails") as string[];

    // バリデーション
    if (!groupName?.trim()) {
      return { error: "グループ名を入力してください" };
    }

    // グループを作成
    const { data: group, error: groupError } = await supabase
      .from("groups")
      .insert({
        group_name: groupName.trim(),
        created_by: user.id,
      })
      .select()
      .single();

    if (groupError) {
      console.error("Group creation error:", groupError);
      return { error: "グループの作成に失敗しました" };
    }

    // 作成者を管理者として追加
    const { error: ownerError } = await supabase.from("group_members").insert({
      group_id: group.group_id,
      user_id: user.id,
      role: "admin",
    });

    if (ownerError) {
      console.error("Owner addition error:", ownerError);
      // グループは作成されているが、管理者追加に失敗
      return {
        error: "グループは作成されましたが、管理者の追加に失敗しました",
      };
    }

    // メンバーを追加
    if (memberEmails.length > 0) {
      const validEmails = memberEmails.filter((email) => email.trim() !== "");

      for (const email of validEmails) {
        // メールアドレスからユーザーを検索
        const { data: userData, error: userError } = await supabase
          .from("user_setting")
          .select("user_id")
          .eq("email", email.trim())
          .single();

        if (!userError && userData) {
          // 既に同じユーザーがメンバーになっていないかチェック
          const { data: existingMember } = await supabase
            .from("group_members")
            .select("user_id")
            .eq("group_id", group.group_id)
            .eq("user_id", userData.user_id)
            .single();

          if (!existingMember) {
            await supabase.from("group_members").insert({
              group_id: group.group_id,
              user_id: userData.user_id,
              role: "member",
            });
          }
        }
      }
    }

    return { success: true, group_id: group.group_id };
  } catch (error) {
    console.error("Unexpected error:", error);
    return { error: "予期しないエラーが発生しました" };
  }
}

// メールアドレスからユーザーを検索
export async function searchUserByEmail(email: string) {
  if (!email.trim()) {
    return null;
  }

  const supabase = await createClient();

  try {
    const { data: userData, error } = await supabase
      .from("user_setting")
      .select("user_id, email, name")
      .eq("email", email.trim())
      .single();

    if (error || !userData) {
      console.error("User search error:", error);
      return null;
    }

    return userData;
  } catch {
    return null;
  }
}
