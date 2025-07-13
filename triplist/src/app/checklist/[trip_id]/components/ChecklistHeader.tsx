"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

interface ChecklistHeaderProps {
  locationName: string;
}

export default function ChecklistHeader({
  locationName,
}: ChecklistHeaderProps) {
  const router = useRouter();

  return (
    <div className="relative flex w-full items-center justify-center py-2">
      <button
        className="absolute left-0 h-10 w-10 p-0 flex items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground"
        onClick={() => router.push("/triplist")}
      >
        <ArrowLeft className="h-10 w-10" />
        <span className="sr-only">戻る</span>
      </button>

      <h2 className="text-2xl font-bold">{locationName}</h2>
    </div>
  );
}
