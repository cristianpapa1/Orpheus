"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import {
  BLOCK_LABEL,
  BLOCK_TYPES,
  GRID_COLS,
  addBlock,
  moveBlock,
  parseLayout,
  removeBlock,
  resizeBlock,
  serializeLayout,
  type LayoutBlock,
  type ProfileLayout,
} from "@atelier/core/profile/layout";
import type { ProfileIdentity, ProfileLink } from "@atelier/core/profile/types";
import { saveProfile } from "@/app/(shell)/profile/actions";

const ROW_H = 56;
const GAP = 8;
const PREVIEW_KEY = "atelier.profile.preview";

const ACCENTS = ["bg-red", "bg-blue", "bg-yellow"] as const;

interface DragState {
  id: string;
  mode: "move" | "resize";
  startX: number;
  startY: number;
  origin: LayoutBlock;
}

export function ProfileEditor({
  initialIdentity,
  initialLayout,
  canPersist,
}: {
  initialIdentity: ProfileIdentity;
  initialLayout: ProfileLayout;
  canPersist: boolean;
}) {
  const [layout, setLayout] = useState(initialLayout);
  const [identity, setIdentity] = useState(initialIdentity);
  const [status, setStatus] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const canvasRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  // Preview mode: restore browser-local edits (deferred — external system read).
  useEffect(() => {
    if (canPersist) return;
    const raw = window.localStorage.getItem(PREVIEW_KEY);
    if (!raw) return;
    const timer = setTimeout(() => {
      try {
        const saved = JSON.parse(raw) as {
          identity?: ProfileIdentity;
          layout?: unknown;
        };
        if (saved.identity) setIdentity(saved.identity);
        if (saved.layout) setLayout(parseLayout(saved.layout));
      } catch {
        // Corrupt preview data is discarded — never blocks the editor.
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [canPersist]);

  /** Convert a pointer delta in pixels into grid-cell deltas. */
  const cellDelta = useCallback((dxPx: number, dyPx: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { dx: 0, dy: 0 };
    const colW = (canvas.clientWidth - GAP * (GRID_COLS - 1)) / GRID_COLS;
    return {
      dx: Math.round(dxPx / (colW + GAP)),
      dy: Math.round(dyPx / (ROW_H + GAP)),
    };
  }, []);

  const onPointerMove = useCallback(
    (e: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag) return;
      const { dx, dy } = cellDelta(e.clientX - drag.startX, e.clientY - drag.startY);
      const { origin } = drag;
      setLayout((prev) =>
        drag.mode === "move"
          ? moveBlock(prev, drag.id, origin.x + dx, origin.y + dy)
          : resizeBlock(prev, drag.id, origin.w + dx, origin.h + dy),
      );
    },
    [cellDelta],
  );

  const beginDrag = useCallback(
    (e: React.PointerEvent, block: LayoutBlock, mode: DragState["mode"]) => {
      e.preventDefault();
      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;
      dragRef.current = {
        id: block.id,
        mode,
        startX: e.clientX,
        startY: e.clientY,
        origin: block,
      };
      window.addEventListener("pointermove", onPointerMove, {
        signal: controller.signal,
      });
      window.addEventListener(
        "pointerup",
        () => {
          dragRef.current = null;
          controller.abort();
        },
        { signal: controller.signal },
      );
    },
    [onPointerMove],
  );

  useEffect(() => () => controllerRef.current?.abort(), []);

  const save = () => {
    setStatus(null);
    if (!canPersist) {
      window.localStorage.setItem(
        PREVIEW_KEY,
        JSON.stringify({ identity, layout }),
      );
      setStatus("Saved to this browser (preview mode).");
      return;
    }
    startTransition(async () => {
      const result = await saveProfile({
        display_name: identity.display_name,
        handle: identity.handle,
        bio: identity.bio,
        links: identity.links,
        layout: serializeLayout(layout),
        accent: identity.accent,
        school: identity.school,
      });
      setStatus(result.ok ? "Saved." : (result.error ?? "Save failed."));
    });
  };

  const setLink = (i: number, patch: Partial<ProfileLink>) =>
    setIdentity((id) => ({
      ...id,
      links: id.links.map((l, j) => (j === i ? { ...l, ...patch } : l)),
    }));

  const missingTypes = BLOCK_TYPES.filter(
    (t) => !layout.blocks.some((b) => b.type === t),
  );
  const rows = Math.max(8, ...layout.blocks.map((b) => b.y + b.h + 1));

  return (
    <div className="grid grid-cols-12 gap-4">
      {/* Identity panel */}
      <section className="col-span-12 border-2 border-ink bg-paper lg:col-span-4">
        <header className="flex items-center gap-3 border-b-2 border-ink px-4 py-2">
          <span aria-hidden className="size-3 bg-red" />
          <h2 className="text-caption font-bold uppercase">Identity</h2>
        </header>
        <div className="flex flex-col gap-3 p-4">
          <label className="text-caption font-bold uppercase" htmlFor="display_name">
            Display name
          </label>
          <input
            id="display_name"
            value={identity.display_name}
            onChange={(e) =>
              setIdentity({ ...identity, display_name: e.target.value })
            }
            className="border-2 border-ink bg-paper px-3 py-2 text-body outline-none focus:border-blue"
          />
          <label className="text-caption font-bold uppercase" htmlFor="handle">
            Handle
          </label>
          <input
            id="handle"
            value={identity.handle}
            onChange={(e) => setIdentity({ ...identity, handle: e.target.value })}
            className="border-2 border-ink bg-paper px-3 py-2 text-body outline-none focus:border-blue"
          />
          <label className="text-caption font-bold uppercase" htmlFor="bio">
            Bio
          </label>
          <textarea
            id="bio"
            rows={4}
            value={identity.bio}
            onChange={(e) => setIdentity({ ...identity, bio: e.target.value })}
            className="border-2 border-ink bg-paper px-3 py-2 text-body outline-none focus:border-blue"
          />
          <p className="text-caption uppercase opacity-70">
            School &amp; accent moved to{" "}
            <a href="/profile/settings" className="border-b-2 border-ink font-bold">
              Settings
            </a>
          </p>
          <p className="text-caption font-bold uppercase">Links</p>
          {identity.links.map((link, i) => (
            <div key={i} className="flex gap-2">
              <input
                aria-label={`Link ${i + 1} label`}
                value={link.label}
                placeholder="Label"
                onChange={(e) => setLink(i, { label: e.target.value })}
                className="w-1/3 border-2 border-ink bg-paper px-2 py-1 text-body outline-none focus:border-blue"
              />
              <input
                aria-label={`Link ${i + 1} URL`}
                value={link.url}
                placeholder="https://…"
                onChange={(e) => setLink(i, { url: e.target.value })}
                className="grow border-2 border-ink bg-paper px-2 py-1 text-body outline-none focus:border-blue"
              />
              <button
                type="button"
                aria-label={`Remove link ${i + 1}`}
                onClick={() =>
                  setIdentity((id) => ({
                    ...id,
                    links: id.links.filter((_, j) => j !== i),
                  }))
                }
                className="border-2 border-ink px-2 font-bold hover:bg-red hover:border-red hover:text-paper"
              >
                ×
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              setIdentity((id) => ({
                ...id,
                links: [...id.links, { label: "", url: "" }],
              }))
            }
            className="self-start border-2 border-ink px-3 py-1 text-caption font-bold uppercase hover:bg-blue hover:border-blue hover:text-paper"
          >
            + Add link
          </button>
        </div>
      </section>

      {/* Canvas */}
      <section className="col-span-12 lg:col-span-8">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="text-caption font-bold uppercase">Add window:</span>
          {missingTypes.length === 0 ? (
            <span className="text-caption uppercase">all placed</span>
          ) : (
            missingTypes.map((t) => (
              <button
                key={t}
                type="button"
                data-palette={t}
                onClick={() => setLayout((l) => addBlock(l, t))}
                className="border-2 border-ink px-3 py-1 text-caption font-bold uppercase hover:bg-yellow"
              >
                + {BLOCK_LABEL[t]}
              </button>
            ))
          )}
          <button
            type="button"
            onClick={save}
            disabled={pending}
            className="ml-auto border-2 border-ink bg-ink px-4 py-1 text-caption font-bold uppercase text-paper hover:bg-blue hover:border-blue disabled:opacity-50"
          >
            {pending ? "Saving…" : "Save"}
          </button>
        </div>
        {status ? (
          <p role="status" className="mb-3 border-2 border-ink px-3 py-2 text-caption font-bold uppercase">
            {status}
          </p>
        ) : null}

        <div
          ref={canvasRef}
          data-editor-canvas
          className="border-2 border-ink bg-ink/5 p-2"
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)`,
            gridAutoRows: ROW_H,
            gap: GAP,
            minHeight: rows * (ROW_H + GAP),
          }}
        >
          {layout.blocks.map((block, i) => (
            <div
              key={block.id}
              data-block={block.id}
              className="relative flex flex-col border-2 border-ink bg-paper select-none"
              style={{
                gridColumn: `${block.x + 1} / span ${block.w}`,
                gridRow: `${block.y + 1} / span ${block.h}`,
              }}
            >
              <header
                data-drag-handle
                tabIndex={0}
                role="button"
                aria-label={`${BLOCK_LABEL[block.type]} window — arrows move, shift+arrows resize`}
                onPointerDown={(e) => beginDrag(e, block, "move")}
                onKeyDown={(e) => {
                  const dx = e.key === "ArrowLeft" ? -1 : e.key === "ArrowRight" ? 1 : 0;
                  const dy = e.key === "ArrowUp" ? -1 : e.key === "ArrowDown" ? 1 : 0;
                  if (dx === 0 && dy === 0) return;
                  e.preventDefault();
                  setLayout((l) =>
                    e.shiftKey
                      ? resizeBlock(l, block.id, block.w + dx, block.h + dy)
                      : moveBlock(l, block.id, block.x + dx, block.y + dy),
                  );
                }}
                className="flex cursor-grab items-center gap-2 border-b-2 border-ink px-3 py-1 active:cursor-grabbing"
              >
                <span aria-hidden className={`size-2 ${ACCENTS[i % ACCENTS.length]}`} />
                <span className="text-caption font-bold uppercase">
                  {BLOCK_LABEL[block.type]}
                </span>
                <button
                  type="button"
                  aria-label={`Remove ${BLOCK_LABEL[block.type]}`}
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={() => setLayout((l) => removeBlock(l, block.id))}
                  className="ml-auto px-1 font-bold hover:text-red"
                >
                  ×
                </button>
              </header>
              <div className="grow p-2 text-caption uppercase opacity-60">
                {block.w}×{block.h}
              </div>
              <span
                data-resize-handle
                onPointerDown={(e) => beginDrag(e, block, "resize")}
                className="absolute right-0 bottom-0 size-4 cursor-nwse-resize bg-ink"
                aria-hidden
              />
            </div>
          ))}
        </div>
        <p className="mt-2 text-caption uppercase opacity-70">
          Drag a window by its title bar · resize from the black corner ·
          windows snap to the 12-column grid
        </p>
      </section>
    </div>
  );
}
