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
      className="h-10 rounded-md bg-blue-600 px-5 font-semibold text-white hover:bg-blue-700 disabled:bg-gray-400"
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
      <div className="mt-4 flex items-center justify-start gap-3">
        <input
          name="itemName"
          type="text"
          placeholder="荷物名"
          required
          className="h-10 flex-grow rounded-md border border-gray-400 p-3 text-lg"
        />
        <input
          name="quantity"
          type="number"
          defaultValue="1"
          min="1"
          required
          className="h-10 w-20 rounded-md border border-gray-400 p-3 text-lg"
        />
        <SubmitButton />
      </div>
    </form>
  );
}
