import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import GroupDetails from "./components/GroupDetails";
import { getGroupDetails } from "./actions";

export const dynamic = "force-dynamic";

export default async function GroupPage({
  params,
}: {
  params: Promise<{ group_id: string }>;
}) {
  try {
    const supabase = await createClient();

    // 認証チェック
    const { data, error } = await supabase.auth.getUser();
    if (error || !data?.user) {
      redirect("/login");
    }

    const { group_id: groupIdString } = await params;
    const group_id = parseInt(groupIdString);

    if (isNaN(group_id)) {
      redirect("/groups");
    }

    const groupData = await getGroupDetails(group_id);

    if (!groupData) {
      redirect("/groups");
    }

    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <GroupDetails group={groupData} />
      </div>
    );
  } catch (error) {
    console.error("Group page error:", error);
    redirect("/groups");
  }
}
