"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Users,
  Trash2,
  UserPlus,
  UserMinus,
  Crown,
  Calendar,
} from "lucide-react";
import {
  deleteGroup,
  addMember,
  removeMember,
  type GroupData,
} from "../actions";
import { maskIdentifier } from "@/lib/utils/masking";
import { globalTextSizes, typographyStyles } from "@/styles/typography";

interface GroupDetailsProps {
  group: GroupData;
}

export default function GroupDetails({ group }: GroupDetailsProps) {
  const router = useRouter();
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleAddMember = async () => {
    if (!newMemberEmail.trim()) return;

    setError(null);
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.set("group_id", String(group.group_id));
        formData.set("email", newMemberEmail);

        const result = await addMember({ success: false }, formData);

        if (result.success) {
          setIsAddDialogOpen(false);
          setNewMemberEmail("");
          router.refresh();
        } else if (result.error) {
          setError(result.error);
        }
      } catch (err) {
        setError("メンバーの追加に失敗しました");
      }
    });
  };

  const handleRemoveMember = async (memberUserId: string) => {
    setError(null);
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.set("group_id", String(group.group_id));
        formData.set("memberUserId", memberUserId);

        const result = await removeMember({ success: false }, formData);

        if (result.success) {
          router.refresh();
        } else if (result.error) {
          setError(result.error);
        }
      } catch (err) {
        setError("メンバーの削除に失敗しました");
      }
    });
  };

  const handleDeleteGroup = async () => {
    setError(null);
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.set("group_id", String(group.group_id));

        const result = await deleteGroup({ success: false }, formData);

        if (result.success) {
          router.push("/groups");
        } else if (result.error) {
          setError(result.error);
        }
      } catch (err) {
        setError("グループの削除に失敗しました");
      }
    });
  };

  const currentUserMember = group.members.find(
    (m) => m.user_id === group.created_by
  );
  const isAdmin = currentUserMember?.role === "admin";

  return (
    <div className="space-y-6">
      {/* エラー表示 */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className={`${globalTextSizes.bodySmall} text-red-800`}>
              {error}
            </p>
          </CardContent>
        </Card>
      )}

      {/* グループヘッダー */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div>
                <CardTitle
                  className={`${typographyStyles.cardTitle} flex items-center`}
                >
                  <Users className="h-6 w-6 text-blue-500 mr-2" />
                  {group.group_name}
                </CardTitle>
                <p
                  className={`${globalTextSizes.bodySmall} text-gray-600 mt-1`}
                >
                  作成日:{" "}
                  {new Date(group.created_at).toLocaleDateString("ja-JP")}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              {/* メンバー追加ボタン - 全メンバーが使用可能 */}
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" disabled={isPending}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    メンバー追加
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className={typographyStyles.cardTitle}>
                      メンバーを追加
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="email" className={globalTextSizes.label}>
                        メールアドレス
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={newMemberEmail}
                        onChange={(e) => setNewMemberEmail(e.target.value)}
                        placeholder="新しいメンバーのメールアドレス"
                        disabled={isPending}
                        className={globalTextSizes.input}
                        required
                      />
                    </div>

                    <div className="flex gap-2 justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsAddDialogOpen(false)}
                        disabled={isPending}
                        className={typographyStyles.button}
                      >
                        キャンセル
                      </Button>
                      <Button
                        type="button"
                        onClick={handleAddMember}
                        disabled={!newMemberEmail.trim() || isPending}
                        className={typographyStyles.button}
                      >
                        {isPending ? "追加中..." : "追加"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              {/* グループ削除ボタン - 管理者のみ */}
              {isAdmin && (
                <Dialog
                  open={isDeleteDialogOpen}
                  onOpenChange={setIsDeleteDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                      disabled={isPending}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      グループ削除
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle className={typographyStyles.cardTitle}>
                        グループを削除
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <p className={`${globalTextSizes.body} text-gray-600`}>
                        本当に「{group.group_name}
                        」を削除しますか？この操作は取り消せません。
                      </p>

                      <div className="flex gap-2 justify-end">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsDeleteDialogOpen(false)}
                          disabled={isPending}
                          className={typographyStyles.button}
                        >
                          キャンセル
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          onClick={handleDeleteGroup}
                          disabled={isPending}
                          className={typographyStyles.button}
                        >
                          {isPending ? "削除中..." : "削除"}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* メンバー一覧 */}
      <Card>
        <CardHeader>
          <CardTitle
            className={`${typographyStyles.cardTitle} flex items-center`}
          >
            <Users className="mr-2 h-5 w-5" />
            メンバー ({group.members.length}人)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {group.members.map((member) => (
              <div
                key={member.user_id}
                className="flex items-center justify-between p-4 rounded-lg border"
              >
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    {member.role === "admin" ? (
                      <Crown className="h-5 w-5 text-yellow-500" />
                    ) : (
                      <Users className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className={`${globalTextSizes.body} font-medium`}>
                        {member.name || maskIdentifier(member.email)}
                      </span>
                      {member.role === "admin" && (
                        <span
                          className={`${globalTextSizes.bodySmall} px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full`}
                        >
                          管理者
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-4">
                      <span
                        className={`${globalTextSizes.bodySmall} text-gray-600 flex items-center`}
                      >
                        <Calendar className="h-3 w-3 mr-1" />
                        {new Date(member.joined_at).toLocaleDateString("ja-JP")}
                      </span>
                    </div>
                  </div>
                </div>

                {/* メンバー削除ボタン（管理者以外のメンバーは削除可能 - サーバー側で権限チェック） */}
                {member.role !== "admin" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemoveMember(member.user_id)}
                    disabled={isPending}
                    className={`${typographyStyles.button} text-red-600 hover:text-red-700`}
                  >
                    <UserMinus className="h-4 w-4 mr-1" />
                    削除
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 戻るボタン */}
      <div className="flex justify-start">
        <Button
          variant="outline"
          onClick={() => router.push("/groups")}
          className={typographyStyles.button}
        >
          グループ一覧に戻る
        </Button>
      </div>
    </div>
  );
}
