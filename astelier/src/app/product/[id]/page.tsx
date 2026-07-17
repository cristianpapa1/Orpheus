import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Nav } from "@/components/Nav";
import { ViewBeacon } from "@/components/ViewBeacon";
import { getGateState } from "@/lib/gate";
import { getProductById } from "@/lib/products/queries";
import { getStoreById } from "@/lib/stores/queries";
import { formatMoney } from "@atelier/core/commerce/money";
import { PRODUCT_STATUS_LABEL } from "@atelier/core/commerce/products";
import { disciplineLabel } from "@atelier/core/taxonomy/disciplines";
import { getI18n } from "@/lib/i18n/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const p = await getProductById(id);
  return { title: p ? `${p.title} — Astelier` : "Product — Astelier" };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getProductById(id);
  if (!product) notFound();

  const [gate, store, { t: dict }] = await Promise.all([
    getGateState(),
    getStoreById(product.store_id),
    getI18n(),
  ]);
  const t = dict.product;

  return (
    <>
      <Nav signedIn={gate.signedIn} />
      {product.status === "live" ? <ViewBeacon kind="product" id={product.id} /> : null}
      <main
        id="main"
        data-school={store?.school}
        className="mx-auto w-full max-w-5xl grow px-6 py-10"
      >
        {product.status !== "live" ? (
          <p className="mb-4 inline-block border-2 border-ink bg-yellow px-3 py-1 text-caption font-bold uppercase">
            {PRODUCT_STATUS_LABEL[product.status]} {t.onlyYouSee}
          </p>
        ) : null}

        <div className="grid gap-8 md:grid-cols-2">
          <div className="flex flex-col gap-3">
            {product.image_urls.length ? (
              product.image_urls.map((url, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={i}
                  src={url}
                  alt=""
                  className="w-full border-2 border-ink object-cover"
                />
              ))
            ) : (
              <div className="grid aspect-square place-items-center border-2 border-ink text-caption uppercase opacity-40">
                {dict.common.noImage}
              </div>
            )}
          </div>

          <div>
            {store ? (
              <Link
                href={`/store/${store.slug}`}
                className="text-caption font-bold uppercase hover:text-blue"
              >
                {store.name} →
              </Link>
            ) : null}
            <h1 className="mt-2 text-h1 font-bold uppercase">{product.title}</h1>
            <p className="mt-2 text-h2 font-bold">
              {formatMoney(product.price_cents, product.currency)}
            </p>

            {product.disciplines.length ? (
              <p className="mt-3 flex flex-wrap gap-2">
                {product.disciplines.map((d) => (
                  <span
                    key={d}
                    className="border-2 border-ink px-2 py-0.5 text-caption font-bold uppercase"
                  >
                    {disciplineLabel(d)}
                  </span>
                ))}
              </p>
            ) : null}

            {product.description ? (
              <p className="mt-4 whitespace-pre-wrap text-body">{product.description}</p>
            ) : null}

            <div className="mt-6">
              {product.external_url ? (
                <a
                  href={product.external_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block border-2 border-ink bg-ink px-6 py-3 text-caption font-bold uppercase text-paper hover:bg-blue hover:border-blue"
                >
                  {t.buy}
                </a>
              ) : store ? (
                <Link
                  href={`/store/${store.slug}`}
                  className="inline-block border-2 border-ink px-6 py-3 text-caption font-bold uppercase hover:bg-yellow"
                >
                  {t.visitStore}
                </Link>
              ) : null}
              <p className="mt-3 text-caption uppercase opacity-70">
                {product.external_url ? t.buyNote : t.noBuyLink}
              </p>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
