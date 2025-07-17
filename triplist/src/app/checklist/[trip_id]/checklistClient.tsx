"use client";

import { useEffect, useRef, useState } from "react";
import {
  deleteItem,
  toggleItemCheck,
  updateItemQuantity,
  updateUserHideCompletedToggle,
} from "./actions";
import AddItemForm from "./components/AddItemForm";
import ChecklistHeader from "./components/ChecklistHeader";
import ChecklistItem from "./components/ChecklistItem";
import { Item, Props } from "./types";

// 型定義（types.tsなど別のファイルに分けるのが望ましい）

export default function ChecklistClient({
  trip_id,
  initialTrip,
  initialItems,
  hideCompletedDefault,
}: Props) {
  const [items, setItems] = useState<Item[]>(initialItems);
  const [hideCompleted, setHideCompleted] = useState(hideCompletedDefault);

  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  // UIを即座に更新（オプティミスティックUI）
  const handleToggle = (itemId: number, newCheckedState: boolean) => {
    setItems((currentItems) =>
      currentItems.map((item) =>
        item.item_id === itemId
          ? { ...item, is_checked: newCheckedState }
          : item
      )
    );
    // サーバーにも更新を通知
    toggleItemCheck(itemId, newCheckedState, `/checklist/${trip_id}`);
  };

  const handleDelete = (itemId: number) => {
    if (!confirm("このアイテムを削除しますか？")) return;
    setItems((currentItems) =>
      currentItems.filter((item) => item.item_id !== itemId)
    );
    deleteItem(itemId, `/checklist/${trip_id}`);
  };

  const handleQuantityChange = (itemId: number, newQuantity: number) => {
    if (newQuantity < 1) return; // 1未満にはしない
    setItems((currentItems) =>
      currentItems.map((item) =>
        item.item_id === itemId ? { ...item, quantity: newQuantity } : item
      )
    );
    updateItemQuantity(itemId, newQuantity, `/checklist/${trip_id}`);
  };
  const filteredItems = hideCompleted
    ? items.filter((item) => !item.is_checked)
    : items;

  return (
    <div className="flex h-[85vh] w-full max-w-4xl flex-col items-center gap-5 rounded-lg bg-white/85 p-8 shadow-xl">
      <ChecklistHeader
        locationName={initialTrip.location_name}
        hideCompleted={hideCompleted}
        setHideCompleted={setHideCompleted}
      />

      <div className="h-full w-full overflow-y-auto rounded-lg border border-gray-400 bg-transparent p-4">
        <ul>
          {filteredItems.length > 0 ? (
            filteredItems.map((item) => (
              <ChecklistItem
                key={item.item_id}
                item={item}
                onToggle={handleToggle}
                onDelete={handleDelete}
                onQuantityChange={handleQuantityChange}
              />
            ))
          ) : (
            <p className="pt-10 text-center text-gray-600">
              {hideCompleted
                ? "全ての持ち物の準備が完了しました！"
                : "アイテムがありません。"}
            </p>
          )}
        </ul>
      </div>

      <AddItemForm tripId={trip_id} />
    </div>
  );
}
