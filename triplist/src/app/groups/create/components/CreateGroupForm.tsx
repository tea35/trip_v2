"use client";

import { useState, useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Plus, User, Mail } from "lucide-react";
import { typographyStyles, globalTextSizes, textColors } from "@/styles/typography";
import {
  createGroup,
  searchUserByEmail,
  type CreateGroupState,
} from "../actions";

interface PendingMember {
  email: string;
  name?: string;
  found: boolean;
}

export default function CreateGroupForm() {
  const router = useRouter();
  const [groupName, setGroupName] = useState("");
  const [memberEmail, setMemberEmail] = useState("");
  const [pendingMembers, setPendingMembers] = useState<PendingMember[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const [state, formAction, isPending] = useActionState<
    CreateGroupState,
    FormData
  >(createGroup, { success: false });

  // 成功時の処理をuseEffectで管理
  useEffect(() => {
    if (state.success && state.group_id) {
      router.push(`/groups/${state.group_id}`);
    }
  }, [state.success, state.group_id, router]);

  const handleAddMember = async () => {
    if (!memberEmail.trim()) return;

    // 既に追加済みかチェック
    const isDuplicate = pendingMembers.some(
      (member) => member.email.toLowerCase() === memberEmail.toLowerCase()
    );

    if (isDuplicate) {
      alert("既に追加済みのメンバーです");
      return;
    }

    setIsSearching(true);

    try {
      const userData = await searchUserByEmail(memberEmail);

      setPendingMembers((prev) => [
        ...prev,
        {
          email: memberEmail.trim(),
          name: userData?.name,
          found: !!userData,
        },
      ]);

      setMemberEmail("");
    } catch (error) {
      console.error("User search error:", error);
      setPendingMembers((prev) => [
        ...prev,
        {
          email: memberEmail.trim(),
          found: false,
        },
      ]);
      setMemberEmail("");
    } finally {
      setIsSearching(false);
    }
  };

  const handleRemoveMember = (emailToRemove: string) => {
    setPendingMembers((prev) =>
      prev.filter((member) => member.email !== emailToRemove)
    );
  };

  const handleSubmit = (formData: FormData) => {
    // フォームデータにグループ名とメンバーのメールアドレスを追加
    formData.set("groupName", groupName);
    pendingMembers.forEach((member) => {
      formData.append("memberEmails", member.email);
    });

    formAction(formData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className={`flex items-center ${typographyStyles.cardTitle}`}>
          <User className="mr-2 h-5 w-5" />
          グループ情報
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <form action={handleSubmit}>
          {/* グループ名入力 */}
          <div className="space-y-2 mb-6">
            <Label htmlFor="groupName" className={typographyStyles.label}>グループ名</Label>
            <Input
              id="groupName"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="例: 沖縄旅行チーム"
              className={globalTextSizes.input}
              required
            />
          </div>

          {/* メンバー追加セクション */}
          <div className="space-y-3">
            <Label className={`${typographyStyles.label} text-base font-medium`}>メンバーを追加</Label>

            {/* メール入力 */}
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="email"
                  value={memberEmail}
                  onChange={(e) => setMemberEmail(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddMember();
                    }
                  }}
                  placeholder="メンバーのメールアドレス"
                  className={`pl-10 ${globalTextSizes.input}`}
                />
              </div>
              <Button
                type="button"
                onClick={handleAddMember}
                disabled={!memberEmail.trim() || isSearching}
                variant="outline"
                className={typographyStyles.button}
              >
                {isSearching ? (
                  "検索中..."
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-1" />
                    追加
                  </>
                )}
              </Button>
            </div>

            {/* 追加済みメンバー一覧 */}
            {pendingMembers.length > 0 && (
              <div className="space-y-2">
                <Label className={`${globalTextSizes.bodySmall} text-gray-600`}>
                  追加予定のメンバー
                </Label>
                <div className="space-y-2">
                  {pendingMembers.map((member, index) => (
                    <div
                      key={index}
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        member.found
                          ? "bg-green-50 border-green-200"
                          : "bg-yellow-50 border-yellow-200"
                      }`}
                    >
                      <div className="flex-1">
                        <div className={`font-medium ${globalTextSizes.body}`}>{member.email}</div>
                        {member.name && (
                          <div className={`${globalTextSizes.bodySmall} ${textColors.secondary}`}>
                            {member.name}
                          </div>
                        )}
                        <div
                          className={`${globalTextSizes.bodySmall} ${
                            member.found ? "text-green-600" : "text-yellow-600"
                          }`}
                        >
                          {member.found
                            ? "✓ アカウントが見つかりました"
                            : "! アカウントが見つかりません（招待として追加されます）"}
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveMember(member.email)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* エラー表示 */}
          {state.error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200">
              <p className={typographyStyles.error}>{state.error}</p>
            </div>
          )}

          {/* 送信ボタン */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isPending}
              className={typographyStyles.button}
            >
              キャンセル
            </Button>
            <Button
              type="submit"
              disabled={!groupName.trim() || isPending}
              className={`bg-blue-400 hover:bg-blue-500 ${typographyStyles.button}`}
            >
              {isPending ? "作成中..." : "グループを作成"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
