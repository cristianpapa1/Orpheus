import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Nav } from "@/components/Nav";
import { ViewBeacon } from "@/components/ViewBeacon";
import { getGateState } from "@/lib/gate";
import { getStoreBySlug } from "@/lib/stores/queries";
import { getLiveProductsByStore } from "@/lib/products/queries";
import { formatMoney } from "@atelier/core/commerce/money";
import { getI18n } from "@/lib/i18n/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const store = await getStoreBySlug(slug);
  return { title: store ? `${store.name} — Astelier` : "Store — Astelier" };
}

const ACCENT_BG: Record<string, string> = {
  red: "bg-red",
  blue: "bg-blue",
  yellow: "bg-yellow",
};

export default async function StorePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const store = await getStoreBySlug(slug);
  if (!store) notFound();

  const [gate, products, { t: dict }] = await Promise.all([
    getGateState(),
    getLiveProductsByStore(store.id),
    getI18n(),
  ]);
  const t = dict.store;

  return (
    <>
      <Nav signedIn={gate.signedIn} />
      <ViewBeacon kind="store" id={store.id} />
      <main
        id="main"
        data-school={store.school}
        className="mx-auto w-full max-w-6xl grow px-6 py-10"
      >
        {/* storefront header */}
        <header className="border-2 border-ink">
          <div className={`h-40 ${ACCENT_BG[store.accent] ?? "bg-red"}`}>
            {store.banner_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={store.banner_url}
                alt=""
                aria-hidden
                className="h-full w-full object-cover"
              />
            ) : null}
          </div>
          <div className="border-t-2 border-ink p-5">
            <h1 className="text-h1 font-bold uppercase">{store.name}</h1>
            {store.description ? (
              <p className="mt-3 max-w-2xl text-body">{store.description}</p>
            ) : null}
          </div>
        </header>

        {/* catalog */}
        <section className="mt-8">
          <h2 className="mb-4 text-caption font-bold uppercase opacity-70">{t.catalog}</h2>
          {products.length ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              {products.map((p) => (
                <Link
                  key={p.id}
                  href={`/product/${p.id}`}
                  className="group flex flex-col border-2 border-ink"
                >
                  <div className="aspect-square overflow-hidden border-b-2 border-ink bg-paper">
                    {p.image_urls[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.image_urls[0]}
                        alt=""
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <div className="grid h-full place-items-center text-caption uppercase opacity-40">
                        {dict.common.noImage}
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="truncate text-body font-bold">{p.title}</p>
                    <p className="text-caption font-bold uppercase">
                      {formatMoney(p.price_cents, p.currency)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="border-2 border-dashed border-ink/40 px-4 py-8 text-center text-body opacity-70">
              {t.noProducts}
            </p>
          )}
        </section>
      </main>
    </>
  );
}
