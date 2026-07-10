"use client";

import { useRouter } from "next/navigation";
import { startOrGetThread } from "@/app/(shell)/chat/actions";

interface Props {
  targetHandle: string;
  /** Button text — e.g. "Apply via chat" on job posts. */
  label?: string;
}

export function MessageButton({ targetHandle, label = "Message" }: Props) {
  const router = useRouter();

  async function handleClick() {
    const result = await startOrGetThread(targetHandle);
    if (result.ok && result.threadId) {
      router.push(`/chat/${result.threadId}`);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="border-2 border-ink px-3 py-1 text-caption font-bold uppercase hover:bg-blue hover:border-blue hover:text-paper"
    >
      {label}
    </button>
  );
}
