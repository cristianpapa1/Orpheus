"use client";

import { useEffect } from "react";
import { recordEventView } from "@/app/(shell)/events/actions";

/** Records the viewer's event view once on mount (idempotent per viewer). */
export function EventViewRecorder({ eventId }: { eventId: string }) {
  useEffect(() => {
    void recordEventView(eventId);
  }, [eventId]);
  return null;
}
