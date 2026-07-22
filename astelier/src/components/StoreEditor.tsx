"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { SUPABASE_URL } from "@/lib/supabase/config";
import { slugify, type Store } from "@atelier/core/commerce/stores";
import { saveStore } from "@/app/sell/actions";
import { StoreLogo } from "@/components/StoreLogo";
import { useT } from "@/lib/i18n/context";

const ACCENTS = [
  { value: "red", cls: "bg-red" },
  { value: "blue", cls: "bg-blue" },
  { value: "yellow", cls: "bg-yellow" },
] as const;

const FIELD =
  "border-2 border-ink bg-paper px-3 py-2 text-body outline-none focus:border-blue";
const LABEL = "text-caption font-bold uppercase";

const PREFIX = `${SUPABASE_URL}/storage/v1/object/public/media/`;
const mediaUrl = (path: string) => `${PREFIX}${path}`;

export function StoreEditor({
  initial,
  ownerAvatarUrl,
  atelierUrl,
}: {
  initial: Store | null;
  /** The owner's Atelier profile picture, reused as the store logo. */
  ownerAvatarUrl: string | null;
  atelierUrl: string;
}) {
  const dict = useT();
  const t = dict.storeEditor;
  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [accent, setAccent] = useState<string>(initial?.accent ?? "red");
  // Artistic-school personalization is deferred; keep the stored value untouched.
  const school = initial?.school ?? "bauhaus";

  // Banner: `bannerUrl` drives the preview; `bannerPath` is what we save —
  // `undefined` means "unchanged", `null` means "clear it", a string sets it.
  const [bannerUrl, setBannerUrl] = useState<string | null>(initial?.banner_url ?? null);
  const [bannerPath, setBannerPath] = useState<string | null | undefined>(undefined);
  const [uploading, setUploading] = useState(false);
  const bannerRef = useRef<HTMLInputElement>(null);

  const [status, setStatus] = useState<string | null>(null);
  const [savedSlug, setSavedSlug] = useState<string | null>(initial?.slug ?? null);
  const [pending, start] = useTransition();

  const preview = slug.trim() ? slugify(slug) : slugify(name) || "your-store";
  const accentBg = accent === "blue" ? "bg-blue" : accent === "yellow" ? "bg-yellow" : "bg-red";

  const onPickBanner = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 8_000_000) {
      setStatus("Pick an image under 8 MB.");
      return;
    }
    const supabase = createClient();
    if (!supabase) {
      setStatus("Supabase is not configured.");
      return;
    }
    setUploading(true);
    setStatus(null);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setStatus("Sign in to upload.");
        return;
      }
      const ext = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
      const path = `${user.id}/store/banner-${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage
        .from("media")
        .upload(path, file, { contentType: file.type, upsert: true });
      if (error) {
        setStatus(`Upload failed: ${error.message}`);
        return;
      }
      setBannerPath(path);
      setBannerUrl(mediaUrl(path));
    } finally {
      setUploading(false);
    }
  };

  const removeBanner = () => {
    setBannerPath(null);
    setBannerUrl(null);
  };

  const onSave = () => {
    setStatus(null);
    start(async () => {
      const r = await saveStore({ name, slug, description, accent, school, banner_path: bannerPath });
      if (r.ok) {
        setStatus(dict.common.saved);
        setSavedSlug(r.slug ?? null);
        if (r.slug) setSlug(r.slug);
      } else {
        setStatus(r.error ?? dict.common.saveFailed);
      }
    });
  };

  return (
    <div className="flex flex-col gap-5 border-2 border-ink bg-paper p-5">
      <div className="flex flex-col gap-2">
        <label className={LABEL} htmlFor="store-name">{t.storeName}</label>
        <input
          id="store-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={60}
          className={FIELD}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className={LABEL} htmlFor="store-slug">{t.handle}</label>
        <input
          id="store-slug"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder={slugify(name) || "your-store"}
          className={FIELD}
        />
        <p className="text-caption uppercase opacity-70">
          astelier.aunflaneur.com/store/<strong>{preview}</strong>
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <label className={LABEL} htmlFor="store-desc">{t.description}</label>
        <textarea
          id="store-desc"
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={600}
          className={FIELD}
        />
      </div>

      {/* Banner — a wide image across the top of the storefront. */}
      <div className="flex flex-col gap-2">
        <span className={LABEL}>{t.banner}</span>
        <div className={`h-32 border-2 border-ink ${accentBg}`}>
          {bannerUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={bannerUrl} alt="" aria-hidden className="h-full w-full object-cover" />
          ) : null}
        </div>
        <p className="text-caption uppercase opacity-70">{t.bannerHint}</p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => bannerRef.current?.click()}
            disabled={uploading}
            className="border-2 border-ink px-4 py-2 text-caption font-bold uppercase hover:bg-yellow disabled:opacity-50"
          >
            {uploading ? dict.common.uploading : t.addBanner}
          </button>
          {bannerUrl ? (
            <button
              type="button"
              onClick={removeBanner}
              className="border-2 border-ink px-4 py-2 text-caption font-bold uppercase hover:bg-red hover:border-red hover:text-paper"
            >
              {t.removeBanner}
            </button>
          ) : null}
        </div>
        <input ref={bannerRef} type="file" accept="image/*" onChange={onPickBanner} className="hidden" />
      </div>

      {/* Logo — reused from the owner's Atelier profile picture, never re-uploaded. */}
      <div className="flex flex-col gap-2">
        <span className={LABEL}>{t.logo}</span>
        <div className="flex items-center gap-4">
          <StoreLogo url={ownerAvatarUrl} name={name || "?"} />
          <div className="min-w-0">
            <p className="text-caption uppercase opacity-70">{t.logoHint}</p>
            <a
              href={`${atelierUrl}/profile/edit`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-block border-b-2 border-ink text-caption font-bold uppercase hover:text-blue"
            >
              {t.changeOnAtelier}
            </a>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className={LABEL}>{t.accent}</span>
        <div className="flex gap-3">
          {ACCENTS.map((a) => (
            <button
              key={a.value}
              type="button"
              aria-label={`${a.value} accent`}
              aria-pressed={accent === a.value}
              onClick={() => setAccent(a.value)}
              className={`size-10 border-2 ${a.cls} ${
                accent === a.value ? "border-ink ring-2 ring-ink ring-offset-2" : "border-ink/30"
              }`}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={onSave}
          disabled={pending || uploading || !name.trim()}
          className="border-2 border-ink bg-ink px-6 py-2 text-caption font-bold uppercase text-paper hover:bg-blue hover:border-blue disabled:opacity-50"
        >
          {pending ? dict.common.saving : initial ? t.saveStore : t.openStore}
        </button>
        {savedSlug ? (
          <Link
            href={`/store/${savedSlug}`}
            className="border-b-2 border-ink text-caption font-bold uppercase hover:text-blue"
          >
            {t.viewYourStore} /store/{savedSlug}
          </Link>
        ) : null}
      </div>

      {status ? (
        <p role="status" className="border-2 border-ink px-3 py-2 text-caption font-bold uppercase">
          {status}
        </p>
      ) : null}
    </div>
  );
}
