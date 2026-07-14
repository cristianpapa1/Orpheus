import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Nav } from "@/components/Nav";
import { getGateState } from "@/lib/gate";
import { getStoreBySlug } from "@/lib/stores/queries";

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

  const gate = await getGateState();

  return (
    <>
      <Nav signedIn={gate.signedIn} />
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

        {/* catalog — Phase C */}
        <section className="mt-8">
          <h2 className="text-caption font-bold uppercase opacity-70">Catalog</h2>
          <p className="mt-3 border-2 border-dashed border-ink/40 px-4 py-8 text-center text-body opacity-70">
            No products yet — this maker is setting up.
          </p>
        </section>
      </main>
    </>
  );
}
