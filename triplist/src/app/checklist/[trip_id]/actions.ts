"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// アイテムを追加
export async function addItem(tripId: number, formData: FormData) {
  const supabase = await createClient();
  const itemName = formData.get("itemName") as string;
  const quantity = Number(formData.get("quantity"));

  if (!itemName.trim()) return;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("items").insert({
    trip_id: tripId,
    item_name: itemName,
    quantity: quantity,
  });

  revalidatePath(`/checklist/${tripId}`);
}

// アイテムを削除
export async function deleteItem(itemId: number, path: string) {
  const supabase = await createClient();
  await supabase.from("items").delete().eq("item_id", itemId);
  revalidatePath(path);
}

// チェック状態を更新
export async function toggleItemCheck(
  itemId: number,
  isChecked: boolean,
  path: string
) {
  const supabase = await createClient();
  await supabase
    .from("items")
    .update({ is_checked: isChecked })
    .eq("item_id", itemId);
  revalidatePath(path);
}

export async function updateItemQuantity(
  itemId: number,
  newQuantity: number,
  path: string
) {
  if (newQuantity < 1) return; // 1未満にはしない

  const supabase = await createClient();
  const { error } = await supabase
    .from("items")
    .update({ quantity: newQuantity })
    .eq("item_id", itemId);

  if (error) {
    console.error("Quantity update error:", error);
    return;
  }

  revalidatePath(path);
}
