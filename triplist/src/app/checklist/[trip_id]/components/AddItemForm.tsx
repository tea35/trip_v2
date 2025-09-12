"use client";

import { useRef } from "react";
import { useFormStatus } from "react-dom";
import { addItem } from "../actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="h-10 w-full rounded-md bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:bg-gray-400 sm:h-12 sm:w-auto sm:px-5 sm:whitespace-nowrap"
    >
      {pending ? "追加中..." : "追加"}
    </button>
  );
}

export default function AddItemForm({ tripId }: { tripId: number }) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        await addItem(tripId, formData);
        formRef.current?.reset();
      }}
      className="w-full"
    >
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-start">
        <input
          name="itemName"
          type="text"
          placeholder="荷物名を入力"
          required
          autoComplete="off"
          className="h-10 w-full flex-grow rounded-md border border-gray-400 p-3 text-base sm:h-12 sm:text-lg"
        />
        <input
          name="quantity"
          type="number"
          inputMode="numeric"
          defaultValue="1"
          min="1"
          required
          placeholder="数量"
          className="h-10 w-full rounded-md border border-gray-400 p-3 text-base sm:h-12 sm:w-20 sm:text-lg"
        />
        <div className="w-full sm:w-auto">
          <SubmitButton />
        </div>
      </div>
    </form>
  );
}
