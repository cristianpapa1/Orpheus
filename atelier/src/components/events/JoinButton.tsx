"use client";

import { useState } from "react";
import { toggleEventParticipation } from "@/app/(shell)/events/actions";
import { useT } from "@/lib/i18n/context";

/** "I'm going" toggle with a live participant count. Optimistic. */
export function JoinButton({
  eventId,
  initialGoing,
  initialCount,
  canJoin,
}: {
  eventId: string;
  initialGoing: boolean;
  initialCount: number;
  canJoin: boolean;
}) {
  const t = useT().events;
  const [going, setGoing] = useState(initialGoing);
  const [count, setCount] = useState(initialCount);
  const [busy, setBusy] = useState(false);

  const toggle = async () => {
    if (!canJoin || busy) return;
    setBusy(true);
    const next = !going;
    setGoing(next);
    setCount((c) => Math.max(0, c + (next ? 1 : -1)));
    const r = await toggleEventParticipation(eventId);
    if (r.ok) {
      setGoing(r.going);
      setCount(r.count);
    }
    setBusy(false);
  };

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={toggle}
        disabled={!canJoin || busy}
        aria-pressed={going}
        data-join
        className={`border-2 border-ink px-4 py-1 text-caption font-bold uppercase disabled:opacity-50 ${
          going ? "bg-ink text-paper" : "hover:bg-yellow"
        }`}
      >
        {going ? `✓ ${t.joined}` : t.join}
      </button>
      <span data-going-count className="text-caption font-bold uppercase">
        {count} {t.goingCount}
      </span>
    </div>
  );
}
