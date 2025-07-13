"use client";

import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { Item } from "../types"; // Adjust the import path as necessary

interface ChecklistItemProps {
  item: Item;
  onToggle: (itemId: number, newCheckedState: boolean) => void;
  onDelete: (itemId: number) => void;
  onQuantityChange: (itemId: number, newQuantity: number) => void;
}

export default function ChecklistItem({
  item,
  onToggle,
  onDelete,
  onQuantityChange,
}: ChecklistItemProps) {
  return (
    <li className="flex items-center justify-between border-b border-gray-300 py-3 last:border-b-0">
      <label className="flex flex-grow cursor-pointer items-center gap-4">
        <input
          type="checkbox"
          checked={item.is_checked}
          onChange={() => onToggle(item.item_id, !item.is_checked)}
          className="h-5 w-5 shrink-0 accent-blue-500"
        />
        <span
          className={`text-xl ${
            item.is_checked ? "text-gray-400 line-through" : ""
          }`}
        >
          {item.item_name}
        </span>
      </label>
      <div className="flex items-center gap-2">
        {/* 個数変更ボタンを追加 */}
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7"
          onClick={() => onQuantityChange(item.item_id, item.quantity - 1)}
          disabled={item.quantity <= 1}
        >
          -
        </Button>
        <span className="w-8 text-center text-lg font-medium">
          {item.quantity}
        </span>
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7"
          onClick={() => onQuantityChange(item.item_id, item.quantity + 1)}
        >
          +
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-gray-500 hover:text-red-500"
          onClick={() => onDelete(item.item_id)}
        >
          <Trash2 className="h-5 w-5" />
          <span className="sr-only">削除</span>
        </Button>
      </div>
    </li>
  );
}
