"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input"; // 個数入力のためにインポート
import { Sparkles } from "lucide-react";
import {
  getAiSuggestions,
  addSuggestedItems,
  getAiUsageCount,
} from "@/lib/actions/aiSuggestion.action";

interface AiSuggestionProps {
  tripId: number;
}

// 選択されたアイテムの型を定義
interface SelectedItem {
  item_name: string;
  quantity: number;
}

interface UsageInfo {
  count: number;
  limit: number;
}

export default function AiSuggestion({ tripId }: AiSuggestionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  // 選択されたアイテムのstateを更新
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [usageInfo, setUsageInfo] = useState<UsageInfo | null>(null);
  const isLimitReached = usageInfo ? usageInfo.count >= usageInfo.limit : true;
  useEffect(() => {
    getAiUsageCount().then(setUsageInfo);
  }, []);

  const handleGetSuggestions = async () => {
    setIsLoading(true);
    setError(null);
    setSuggestions([]);
    setSelectedItems([]);

    // Server Actionの引数をtripIdのみに変更
    const result = await getAiSuggestions(tripId);
    if (result.error) {
      setError(result.error);
    } else if (result.suggestions) {
      setSuggestions(result.suggestions);
      if (
        result.ai_suggestion_counts !== undefined &&
        usageInfo?.limit !== undefined
      ) {
        setUsageInfo({
          count: result.ai_suggestion_counts,
          limit: usageInfo?.limit,
        });
      }
    }
    setIsLoading(false);
  };

  const handleAddItem = async () => {
    await addSuggestedItems(tripId, selectedItems);
    setIsOpen(false);
  };

  // チェックボックスの状態が変わったときの処理を更新
  const handleCheckboxChange = (item: string, checked: boolean) => {
    setSelectedItems((prev) =>
      checked
        ? [...prev, { item_name: item, quantity: 1 }] // デフォルト個数1で追加
        : prev.filter((i) => i.item_name !== item)
    );
  };

  // 個数が変更されたときの処理を追加
  const handleQuantityChange = (itemName: string, quantity: number) => {
    const newQuantity = Math.max(1, quantity); // 個数は1以上
    setSelectedItems((prev) =>
      prev.map((item) =>
        item.item_name === itemName ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  return (
    <div className="flex items-center gap-4">
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button onClick={handleGetSuggestions} disabled={isLimitReached}>
            <Sparkles className="mr-2 h-4 w-4" />
            {isLimitReached ? "本日の上限に達しました" : "AIにおすすめを聞く"}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>AIによる持ち物提案</DialogTitle>
          </DialogHeader>
          {isLoading && <p className="py-4">AIが考えています...</p>}
          {error && <p className="py-4 text-red-500">{error}</p>}
          {suggestions.length > 0 && (
            <div className="space-y-4 py-4">
              {suggestions.map((item, index) => {
                const selectedItem = selectedItems.find(
                  (si) => si.item_name === item
                );
                const isSelected = !!selectedItem;
                return (
                  <div
                    key={index}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`item-${index}`}
                        checked={isSelected}
                        onCheckedChange={(checked) =>
                          handleCheckboxChange(item, !!checked)
                        }
                      />
                      <Label htmlFor={`item-${index}`}>{item}</Label>
                    </div>
                    {isSelected && (
                      <Input
                        type="number"
                        min="1"
                        className="h-8 w-20"
                        value={selectedItem.quantity}
                        onChange={(e) =>
                          handleQuantityChange(
                            item,
                            parseInt(e.target.value, 10) || 1
                          )
                        }
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost">キャンセル</Button>
            </DialogClose>
            <Button
              onClick={handleAddItem}
              disabled={selectedItems.length === 0}
            >
              選択した{selectedItems.length}個を追加
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {usageInfo && (
        <p className="text-sm text-muted-foreground">
          本日 {usageInfo.count} / {usageInfo.limit} 回
        </p>
      )}
    </div>
  );
}
