"use client";

import { useEffect, useState } from "react";
import { deleteItem, toggleItemCheck, updateItemQuantity } from "./actions";
import AddItemForm from "./components/AddItemForm";
import ChecklistHeader from "./components/ChecklistHeader";
import ChecklistItem from "./components/ChecklistItem";
import AiSuggestion from "./components/AiSuggestion";
import { Item, Props } from "./types";

// 型定義（types.tsなど別のファイルに分けるのが望ましい）

export default function ChecklistClient({
  trip_id,
  initialTrip,
  initialLinkedTrip,
  initialItems,
  hideCompletedDefault,
}: Props) {
  const [items, setItems] = useState<Item[]>(initialItems);
  const [hideCompleted, setHideCompleted] = useState(hideCompletedDefault);
  
  // デフォルトタブを個人旅行に設定
  const getDefaultTab = () => {
    if (initialLinkedTrip) {
      // 紐付けがある場合、常に個人旅行を最初に表示
      return initialTrip.trip_type === "personal" ? "main" : "linked";
    }
    return "main";
  };
  
  const [activeTab, setActiveTab] = useState<"main" | "linked">(getDefaultTab());
  const [linkedItems, setLinkedItems] = useState<Item[]>([]);

  // 現在アクティブな旅行IDを取得
  const currentTripId =
    activeTab === "main" ? trip_id : initialLinkedTrip?.trip_id || trip_id;

  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  // 紐付けされた旅行のアイテムを取得
  useEffect(() => {
    if (initialLinkedTrip && activeTab === "linked") {
      const fetchLinkedItems = async () => {
        try {
          const response = await fetch(
            `/api/checklist/${initialLinkedTrip.trip_id}/items`
          );
          if (response.ok) {
            const data = await response.json();
            setLinkedItems(data);
          }
        } catch (error) {
          console.error("Failed to fetch linked items:", error);
        }
      };
      fetchLinkedItems();
    }
  }, [initialLinkedTrip, activeTab]);

  // 現在表示すべきアイテムを取得
  const getCurrentItems = () => {
    if (activeTab === "linked" && initialLinkedTrip) {
      return linkedItems;
    }
    return items;
  };

  // UIを即座に更新（オプティミスティックUI）
  const handleToggle = (itemId: number, newCheckedState: boolean) => {
    if (activeTab === "linked") {
      setLinkedItems((currentItems) =>
        currentItems.map((item) =>
          item.item_id === itemId
            ? { ...item, is_checked: newCheckedState }
            : item
        )
      );
    } else {
      setItems((currentItems) =>
        currentItems.map((item) =>
          item.item_id === itemId
            ? { ...item, is_checked: newCheckedState }
            : item
        )
      );
    }
    // サーバーにも更新を通知
    toggleItemCheck(itemId, newCheckedState, `/checklist/${currentTripId}`);
  };

  const handleDelete = (itemId: number) => {
    if (!confirm("このアイテムを削除しますか？")) return;

    if (activeTab === "linked") {
      setLinkedItems((currentItems) =>
        currentItems.filter((item) => item.item_id !== itemId)
      );
    } else {
      setItems((currentItems) =>
        currentItems.filter((item) => item.item_id !== itemId)
      );
    }
    deleteItem(itemId, `/checklist/${currentTripId}`);
  };

  const handleQuantityChange = (itemId: number, newQuantity: number) => {
    if (newQuantity < 1) return; // 1未満にはしない

    if (activeTab === "linked") {
      setLinkedItems((currentItems) =>
        currentItems.map((item) =>
          item.item_id === itemId ? { ...item, quantity: newQuantity } : item
        )
      );
    } else {
      setItems((currentItems) =>
        currentItems.map((item) =>
          item.item_id === itemId ? { ...item, quantity: newQuantity } : item
        )
      );
    }
    updateItemQuantity(itemId, newQuantity, `/checklist/${currentTripId}`);
  };

  const currentItems = getCurrentItems();
  const filteredItems = hideCompleted
    ? currentItems.filter((item) => !item.is_checked)
    : currentItems;

  return (
    <div className="flex h-[85vh] w-full max-w-4xl flex-col items-center rounded-lg bg-white/85 p-8 shadow-xl">
      <div className="w-full mb-5">
        <ChecklistHeader
          trip={initialTrip}
          linkedTrip={initialLinkedTrip}
          hideCompleted={hideCompleted}
          setHideCompleted={setHideCompleted}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
      </div>

      <div
        className={`h-full w-full overflow-y-auto border border-gray-400 bg-transparent p-4 rounded-lg`}
      >
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

      <div className="w-full mt-5 flex flex-col gap-3">
        <AddItemForm tripId={currentTripId} />
        <AiSuggestion tripId={currentTripId} />
      </div>
    </div>
  );
}
