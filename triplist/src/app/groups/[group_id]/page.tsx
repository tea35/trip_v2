import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import GroupDetails from "./components/GroupDetails";
import { getGroupDetails } from "./actions";
import { getIdFromHeaders } from "@/lib/utils/url";

export const dynamic = "force-dynamic";

export default async function GroupPage() {
  try {
    const supabase = await createClient();

    // 認証チェック
    const { data, error } = await supabase.auth.getUser();
    if (error || !data?.user) {
      redirect("/login");
    }

    const group_id = await getIdFromHeaders();

    if (group_id === null) {
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
