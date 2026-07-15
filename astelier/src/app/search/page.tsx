import Link from "next/link";
import { Nav } from "@/components/Nav";
import { ProductGrid } from "@/components/ProductGrid";
import { getGateState } from "@/lib/gate";
import { searchAstelier } from "@/lib/discovery/queries";

export const metadata = { title: "Search — Astelier" };

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const query = q.trim();
  const [gate, results] = await Promise.all([
    getGateState(),
    query ? searchAstelier(query) : Promise.resolve({ stores: [], products: [] }),
  ]);

  return (
    <>
      <Nav signedIn={gate.signedIn} />
      <main id="main" className="mx-auto w-full max-w-6xl grow px-6 py-10">
        <h1 className="mb-6 text-h1 font-bold uppercase">Search</h1>

        <form action="/search" className="flex gap-2">
          <input
            name="q"
            defaultValue={query}
            autoFocus
            placeholder="Stores and products…"
            className="min-w-0 flex-1 border-2 border-ink bg-paper px-3 py-2 text-body outline-none focus:border-blue"
          />
          <button className="border-2 border-ink bg-ink px-4 py-2 text-caption font-bold uppercase text-paper hover:bg-blue hover:border-blue">
            Search
          </button>
        </form>

        {query ? (
          <>
            {results.stores.length ? (
              <section className="mt-8">
                <h2 className="mb-3 text-caption font-bold uppercase opacity-70">Stores</h2>
                <ul className="flex flex-col gap-2">
                  {results.stores.map((s) => (
                    <li key={s.slug}>
                      <Link
                        href={`/store/${s.slug}`}
                        className="block border-2 border-ink px-4 py-2 hover:bg-yellow"
                      >
                        <span className="text-body font-bold">{s.name}</span>
                        {s.description ? (
                          <span className="ml-2 text-caption opacity-70">{s.description.slice(0, 80)}</span>
                        ) : null}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            <section className="mt-8">
              <h2 className="mb-3 text-caption font-bold uppercase opacity-70">
                Products
              </h2>
              <ProductGrid products={results.products} />
            </section>

            {!results.stores.length && !results.products.length ? (
              <p className="mt-8 text-body opacity-70">
                No stores or products match “{query}”.
              </p>
            ) : null}
          </>
        ) : (
          <p className="mt-8 text-body opacity-70">
            Search makers&apos; stores and the work they sell.
          </p>
        )}
      </main>
    </>
  );
}
