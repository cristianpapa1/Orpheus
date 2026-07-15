import Link from "next/link";
import { Nav } from "@/components/Nav";
import { ProductGrid } from "@/components/ProductGrid";
import { getGateState } from "@/lib/gate";
import { browseProducts, type BrowseSort } from "@/lib/discovery/queries";
import { browseStores } from "@/lib/stores/queries";
import { DISCIPLINE_OPTIONS } from "@atelier/core/taxonomy/disciplines";
import { SCHOOLS, SCHOOL_LABEL } from "@atelier/core/design/schools";

export const metadata = { title: "Browse — Astelier" };

const CATEGORIES = DISCIPLINE_OPTIONS.filter((o) => o.isCategory);
const SORTS: { value: BrowseSort; label: string }[] = [
  { value: "new", label: "Newest" },
  { value: "price-asc", label: "Price ↑" },
  { value: "price-desc", label: "Price ↓" },
];

const chip = (active: boolean) =>
  `border-2 border-ink px-3 py-1 text-caption font-bold uppercase ${
    active ? "bg-ink text-paper" : "hover:bg-yellow"
  }`;

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<{ discipline?: string; school?: string; sort?: string }>;
}) {
  const sp = await searchParams;
  const discipline = sp.discipline ?? null;
  const school = sp.school ?? null;
  const sort: BrowseSort =
    sp.sort === "price-asc" || sp.sort === "price-desc" ? sp.sort : "new";

  const [gate, products, stores] = await Promise.all([
    getGateState(),
    browseProducts({ discipline, school, sort }),
    browseStores(school),
  ]);

  const hrefWith = (patch: Record<string, string | null>) => {
    const merged: Record<string, string | null> = { discipline, school, sort, ...patch };
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(merged)) if (v) params.set(k, v);
    const qs = params.toString();
    return `/browse${qs ? `?${qs}` : ""}`;
  };

  return (
    <>
      <Nav signedIn={gate.signedIn} />
      <main id="main" className="mx-auto w-full max-w-6xl grow px-6 py-10">
        <h1 className="mb-6 text-h1 font-bold uppercase">Browse</h1>

        {/* filters */}
        <div className="flex flex-col gap-3 border-2 border-ink p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-caption font-bold uppercase opacity-60">Discipline</span>
            <Link href={hrefWith({ discipline: null })} className={chip(!discipline)}>All</Link>
            {CATEGORIES.map((c) => (
              <Link key={c.value} href={hrefWith({ discipline: c.value })} className={chip(discipline === c.value)}>
                {c.label}
              </Link>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-caption font-bold uppercase opacity-60">School</span>
            <Link href={hrefWith({ school: null })} className={chip(!school)}>All</Link>
            {SCHOOLS.map((s) => (
              <Link key={s} href={hrefWith({ school: s })} className={chip(school === s)}>
                {SCHOOL_LABEL[s]}
              </Link>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-caption font-bold uppercase opacity-60">Sort</span>
            {SORTS.map((s) => (
              <Link key={s.value} href={hrefWith({ sort: s.value })} className={chip(sort === s.value)}>
                {s.label}
              </Link>
            ))}
          </div>
        </div>

        {/* stores */}
        {stores.length ? (
          <section className="mt-8">
            <h2 className="mb-3 text-caption font-bold uppercase opacity-70">Stores</h2>
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
          </section>
        ) : null}

        {/* products */}
        <section className="mt-8">
          <h2 className="mb-3 text-caption font-bold uppercase opacity-70">
            {products.length} {products.length === 1 ? "piece" : "pieces"}
          </h2>
          <ProductGrid products={products} />
        </section>
      </main>
    </>
  );
}
