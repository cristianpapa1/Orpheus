"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { SUPABASE_URL } from "@/lib/supabase/config";
import type { DisciplineChip } from "@/lib/taxonomy";
import {
  PRODUCT_STATUSES,
  PRODUCT_STATUS_LABEL,
  MAX_PRODUCT_IMAGES,
  type Product,
} from "@atelier/core/commerce/products";
import { saveProduct } from "@/app/sell/products/actions";
import { useT } from "@/lib/i18n/context";

const PREFIX = `${SUPABASE_URL}/storage/v1/object/public/media/`;
const mediaUrl = (path: string) => `${PREFIX}${path}`;
const toPath = (url: string) => (url.startsWith(PREFIX) ? url.slice(PREFIX.length) : url);

const FIELD = "border-2 border-ink bg-paper px-3 py-2 text-body outline-none focus:border-blue";
const LABEL = "text-caption font-bold uppercase";

export function ProductEditor({
  initial,
  prefillTitle,
  categoryOptions,
}: {
  initial: Product | null;
  prefillTitle?: string;
  /** Localized category chips (value "cat:<id>"), built server-side. */
  categoryOptions: DisciplineChip[];
}) {
  const router = useRouter();
  const dict = useT();
  const t = dict.productEditor;
  const [title, setTitle] = useState(initial?.title ?? prefillTitle ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [price, setPrice] = useState(
    initial ? (initial.price_cents / 100).toString() : "",
  );
  const [images, setImages] = useState<string[]>(
    initial ? initial.image_urls.map(toPath) : [],
  );
  const [disciplines, setDisciplines] = useState<string[]>(initial?.disciplines ?? []);
  const [externalUrl, setExternalUrl] = useState(initial?.external_url ?? "");
  const [status, setStatus] = useState<string>(initial?.status ?? "draft");
  const [msg, setMsg] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [pending, start] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  const toggleDiscipline = (v: string) =>
    setDisciplines((d) => (d.includes(v) ? d.filter((x) => x !== v) : [...d, v]));

  const onPickImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!files.length) return;
    const supabase = createClient();
    if (!supabase) {
      setMsg("Supabase is not configured.");
      return;
    }
    setUploading(true);
    setMsg(null);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setMsg(t.signInUpload);
        return;
      }
      const room = MAX_PRODUCT_IMAGES - images.length;
      for (const file of files.slice(0, room)) {
        if (!file.type.startsWith("image/") || file.size > 8_000_000) continue;
        const ext = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
        const path = `${user.id}/products/${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage
          .from("media")
          .upload(path, file, { contentType: file.type, upsert: true });
        if (error) {
          setMsg(`Upload failed: ${error.message}`);
          return;
        }
        setImages((prev) => [...prev, path]);
      }
    } finally {
      setUploading(false);
    }
  };

  const onSave = () => {
    setMsg(null);
    start(async () => {
      const r = await saveProduct({
        id: initial?.id,
        title,
        description,
        price,
        images,
        disciplines,
        external_url: externalUrl,
        status,
      });
      // New products land on their own edit page (which offers "Post on Atelier");
      // edits return to the store.
      if (r.ok) router.push(initial ? "/sell" : `/sell/products/${r.id}`);
      else setMsg(r.error ?? dict.common.saveFailed);
    });
  };

  return (
    <div className="flex flex-col gap-5 border-2 border-ink bg-paper p-5">
      <div className="flex flex-col gap-2">
        <label className={LABEL} htmlFor="p-title">{t.title}</label>
        <input id="p-title" value={title} maxLength={120} onChange={(e) => setTitle(e.target.value)} className={FIELD} />
      </div>

      <div className="flex flex-col gap-2">
        <label className={LABEL} htmlFor="p-price">{t.priceUsd}</label>
        <input id="p-price" value={price} inputMode="decimal" placeholder="24.99" onChange={(e) => setPrice(e.target.value)} className={FIELD} />
      </div>

      <div className="flex flex-col gap-2">
        <label className={LABEL} htmlFor="p-desc">{t.description}</label>
        <textarea id="p-desc" rows={4} value={description} maxLength={2000} onChange={(e) => setDescription(e.target.value)} className={FIELD} />
      </div>

      <div className="flex flex-col gap-2">
        <span className={LABEL}>{t.images} ({images.length}/{MAX_PRODUCT_IMAGES})</span>
        {images.length ? (
          <div className="flex flex-wrap gap-2">
            {images.map((path) => (
              <div key={path} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={mediaUrl(path)} alt="" className="size-20 border-2 border-ink object-cover" />
                <button
                  type="button"
                  aria-label="Remove image"
                  onClick={() => setImages((prev) => prev.filter((p) => p !== path))}
                  className="absolute -right-2 -top-2 size-6 border-2 border-ink bg-paper text-caption font-bold hover:bg-red hover:text-paper"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        ) : null}
        {images.length < MAX_PRODUCT_IMAGES ? (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="self-start border-2 border-ink px-3 py-1 text-caption font-bold uppercase hover:bg-blue hover:border-blue hover:text-paper disabled:opacity-50"
          >
            {uploading ? dict.common.uploading : t.addImages}
          </button>
        ) : null}
        <input ref={fileRef} type="file" accept="image/*" multiple onChange={onPickImages} className="hidden" />
      </div>

      <div className="flex flex-col gap-2">
        <span className={LABEL}>{t.disciplines}</span>
        <div className="flex flex-wrap gap-2">
          {categoryOptions.map((c) => (
            <label
              key={c.value}
              className={`cursor-pointer border-2 border-ink px-3 py-1 text-caption font-bold uppercase ${
                disciplines.includes(c.value) ? "bg-ink text-paper" : ""
              }`}
            >
              <input type="checkbox" checked={disciplines.includes(c.value)} onChange={() => toggleDiscipline(c.value)} className="sr-only" />
              {c.label}
            </label>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className={LABEL} htmlFor="p-url">{t.buyLink}</label>
        <input id="p-url" value={externalUrl} placeholder="https://your-shop.com/item" onChange={(e) => setExternalUrl(e.target.value)} className={FIELD} />
        <p className="text-caption uppercase opacity-70">{t.buyLinkNote}</p>
      </div>

      <div className="flex flex-col gap-2">
        <label className={LABEL} htmlFor="p-status">{t.status}</label>
        <select id="p-status" value={status} onChange={(e) => setStatus(e.target.value)} className={FIELD}>
          {PRODUCT_STATUSES.map((s) => (
            <option key={s} value={s}>{PRODUCT_STATUS_LABEL[s]}</option>
          ))}
        </select>
        <p className="text-caption uppercase opacity-70">{t.statusNote}</p>
      </div>

      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onSave}
          disabled={pending || uploading || !title.trim()}
          className="border-2 border-ink bg-ink px-6 py-2 text-caption font-bold uppercase text-paper hover:bg-blue hover:border-blue disabled:opacity-50"
        >
          {pending ? dict.common.saving : initial ? t.saveProduct : t.addProduct}
        </button>
        <button
          type="button"
          onClick={() => router.push("/sell")}
          className="border-2 border-ink px-6 py-2 text-caption font-bold uppercase hover:bg-yellow"
        >
          {dict.common.cancel}
        </button>
      </div>

      {msg ? (
        <p role="status" className="border-2 border-red px-3 py-2 text-caption font-bold uppercase text-red">
          {msg}
        </p>
      ) : null}
    </div>
  );
}
