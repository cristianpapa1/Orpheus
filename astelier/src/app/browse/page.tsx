import Link from "next/link";
import { Nav } from "@/components/Nav";
import { ProductGrid } from "@/components/ProductGrid";
import { getGateState } from "@/lib/gate";
import { browseProducts, type BrowseSort } from "@/lib/discovery/queries";
import { browseStores } from "@/lib/stores/queries";
import { getI18n } from "@/lib/i18n/server";
import { categoryChips } from "@/lib/taxonomy";

export const metadata = { title: "Browse — Astelier" };

const SORT_VALUES: BrowseSort[] = ["new", "price-asc", "price-desc"];

const chip = (active: boolean) =>
  `border-2 border-ink px-3 py-1 text-caption font-bold uppercase ${
    active ? "bg-ink text-paper" : "hover:bg-yellow"
  }`;

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<{ discipline?: string; sort?: string; following?: string }>;
}) {
  const sp = await searchParams;
  const discipline = sp.discipline ?? null;
  const sort: BrowseSort =
    sp.sort === "price-asc" || sp.sort === "price-desc" ? sp.sort : "new";
  const following = sp.following === "1";

  const [gate, products, stores, { t: dict, locale }] = await Promise.all([
    getGateState(),
    browseProducts({ discipline, sort }),
    browseStores(following ? { following: true } : undefined),
    getI18n(),
  ]);
  const t = dict.browse;
  const CATEGORIES = categoryChips(locale);
  const sortLabel: Record<BrowseSort, string> = {
    new: t.newest,
    "price-asc": t.priceUp,
    "price-desc": t.priceDown,
  };

  const hrefWith = (patch: Record<string, string | null>) => {
    const merged: Record<string, string | null> = {
      discipline,
      sort,
      following: following ? "1" : null,
      ...patch,
    };
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(merged)) if (v) params.set(k, v);
    const qs = params.toString();
    return `/browse${qs ? `?${qs}` : ""}`;
  };

  return (
    <>
      <Nav signedIn={gate.signedIn} />
      <main id="main" className="mx-auto w-full max-w-6xl grow px-6 py-10">
        <h1 className="mb-6 text-h1 font-bold uppercase">{t.title}</h1>

        {/* filters */}
        <div className="flex flex-col gap-3 border-2 border-ink p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-caption font-bold uppercase opacity-60">{t.discipline}</span>
            <Link href={hrefWith({ discipline: null })} className={chip(!discipline)}>{t.all}</Link>
            {CATEGORIES.map((c) => (
              <Link key={c.value} href={hrefWith({ discipline: c.value })} className={chip(discipline === c.value)}>
                {c.label}
              </Link>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-caption font-bold uppercase opacity-60">{t.sort}</span>
            {SORT_VALUES.map((v) => (
              <Link key={v} href={hrefWith({ sort: v })} className={chip(sort === v)}>
                {sortLabel[v]}
              </Link>
            ))}
          </div>
        </div>

        {/* stores */}
        {gate.signedIn || stores.length ? (
          <section className="mt-8">
            <div className="mb-3 flex flex-wrap items-center gap-3">
              <h2 className="text-caption font-bold uppercase opacity-70">{t.stores}</h2>
              {gate.signedIn ? (
                <div data-store-scope className="flex flex-wrap gap-2">
                  <Link href={hrefWith({ following: "1" })} className={chip(following)}>
                    {t.peopleYouFollow}
                  </Link>
                  <Link href={hrefWith({ following: null })} className={chip(!following)}>
                    {t.allStores}
                  </Link>
                </div>
              ) : null}
            </div>
            {stores.length ? (
              <div className="flex flex-wrap gap-2">
                {stores.map((s) => (
                  <Link
                    key={s.id}
                    href={`/store/${s.slug}`}
                    className="border-2 border-ink px-3 py-1 text-caption font-bold uppercase hover:bg-blue hover:border-blue hover:text-paper"
                  >
                    {s.name}
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-body opacity-70">
                {following ? (
                  <>
                    {t.noneFollowed}{" "}
                    <Link href={hrefWith({ following: null })} className="border-b-2 border-ink font-bold hover:text-blue">
                      {t.seeAllStores}
                    </Link>
                    .
                  </>
                ) : (
                  t.noStores
                )}
              </p>
            )}
          </section>
        ) : null}

        {/* products */}
        <section className="mt-8">
          <h2 className="mb-3 text-caption font-bold uppercase opacity-70">
            {products.length} {products.length === 1 ? t.piece : t.pieces}
          </h2>
          <ProductGrid products={products} />
        </section>
      </main>
    </>
  );
}
