"use client";

import { useOptimistic, useRef, useEffect } from "react";
import { sendMessage } from "../actions";
import type { ChatMessage } from "@/lib/chat/types";

interface Props {
  threadId: string;
  messages: ChatMessage[];
  otherName: string;
  viewerId: string | null;
}

export function ThreadMessages({ threadId, messages, otherName, viewerId }: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const [optimisticMessages, addOptimistic] = useOptimistic(
    messages,
    (state, body: string) => [
      ...state,
      {
        id: `optimistic-${Date.now()}`,
        thread_id: threadId,
        sender_id: "self",
        body,
        created_at: new Date().toISOString(),
      },
    ],
  );

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [optimisticMessages.length]);

  async function onSubmit(formData: FormData) {
    const body = String(formData.get("body") ?? "").trim();
    if (!body) return;
    addOptimistic(body);
    formRef.current?.reset();
    await sendMessage(formData);
  }

  return (
    <div className="flex flex-col">
      <div className="mb-4 flex max-h-[60dvh] min-h-[300px] flex-col gap-3 overflow-y-auto border-b-2 border-ink pb-4">
        {optimisticMessages.map((msg) => {
          const isSelf = msg.sender_id === viewerId || msg.sender_id === "self";
          return (
            <div
              key={msg.id}
              data-message
              className={`flex ${isSelf ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[75%] border-2 border-ink px-4 py-2 ${
                  isSelf
                    ? "bg-ink text-paper"
                    : "bg-paper text-ink"
                }`}
              >
                <p className="text-body break-words">{msg.body}</p>
                <p
                  className={`mt-1 text-caption ${
                    isSelf ? "text-paper/60" : "opacity-60"
                  }`}
                >
                  {new Date(msg.created_at).toLocaleTimeString("en-GB", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form action={onSubmit} ref={formRef} className="flex gap-3">
        <input
          name="body"
          required
          maxLength={2000}
          placeholder={`Message ${otherName}…`}
          autoFocus
          className="min-w-0 flex-1 border-2 border-ink bg-paper px-3 py-2 text-body outline-none focus:border-blue"
        />
        <input type="hidden" name="thread_id" value={threadId} />
        <button
          type="submit"
          className="border-2 border-ink bg-ink px-4 py-2 text-caption font-bold uppercase text-paper hover:bg-blue hover:border-blue"
        >
          Send
        </button>
      </form>
    </div>
  );
}
