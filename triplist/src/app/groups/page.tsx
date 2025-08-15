import { Suspense } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Plus } from "lucide-react";
import { getUserGroups } from "./actions";

export default async function GroupsPage() {
  const groups = await getUserGroups();

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            グループ管理
          </h1>
          <p className="text-gray-600">
            参加しているグループの管理と新しいグループの作成
          </p>
        </div>
        <Link href="/groups/create">
          <Button className="bg-blue-400 hover:bg-blue-500">
            <Plus className="h-4 w-4 mr-2" />
            新しいグループ
          </Button>
        </Link>
      </div>

      {/* グループ一覧 */}
      <Suspense fallback={<div>読み込み中...</div>}>
        {groups && groups.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {groups.map((group) => (
              <Card
                key={group.group_id}
                className="hover:shadow-md transition-shadow"
              >
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="mr-2 h-5 w-5 text-blue-500" />
                    {group.group_name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-gray-600">
                    <p>メンバー: {group.member_count}人</p>
                    <p>
                      作成日:{" "}
                      {new Date(group.created_at).toLocaleDateString("ja-JP")}
                    </p>
                    {group.role === "admin" && (
                      <span className="inline-block px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                        管理者
                      </span>
                    )}
                  </div>
                  <div className="mt-4">
                    <Link href={`/groups/${group.group_id}`}>
                      <Button variant="outline" className="w-full">
                        詳細を見る
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                グループがありません
              </h3>
              <p className="text-gray-600 mb-6">
                新しいグループを作成するか、招待されたグループに参加してください
              </p>
              <Link href="/groups/create">
                <Button className="bg-blue-400 hover:bg-blue-500">
                  <Plus className="h-4 w-4 mr-2" />
                  最初のグループを作成
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </Suspense>
    </div>
  );
}
