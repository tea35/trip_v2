"use client";
import { useRouter } from "next/navigation";

export default function AddTripButton() {
  const router = useRouter();
  return (
    <button
      className="absolute right-12 top-8 flex h-16 w-16 items-center justify-center rounded-full bg-[#2196f3] text-5xl text-white shadow-md transition-colors hover:bg-[#4da6ff]"
      onClick={() => router.push("/createtrip")}
    >
      +
    </button>
  );
}
