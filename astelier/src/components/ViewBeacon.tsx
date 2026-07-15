"use client";

import { useEffect } from "react";
import { bumpView } from "@/lib/analytics/actions";

/** Fires a single view increment on mount (client-side, so route prefetches
 *  don't inflate the count). Renders nothing. */
export function ViewBeacon({ kind, id }: { kind: "product" | "store"; id: string }) {
  useEffect(() => {
    void bumpView(kind, id);
  }, [kind, id]);
  return null;
}
