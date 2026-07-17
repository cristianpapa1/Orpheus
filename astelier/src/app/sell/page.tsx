import { redirect } from "next/navigation";
import Link from "next/link";
import { Nav } from "@/components/Nav";
import { StoreEditor } from "@/components/StoreEditor";
import { CrawlerNotice } from "@/components/CrawlerNotice";
import { getGateState } from "@/lib/gate";
import { getInstitutionValidation, isViewerCurator, isViewerCreator } from "@/lib/validation";
import { getMyStore } from "@/lib/stores/queries";
import { getProductsForStore } from "@/lib/products/queries";
import { deleteProductForm } from "@/app/sell/products/actions";
import {
  getProductViewCounts,
  getStoreViews,
  getFollowerReach,
} from "@/lib/analytics/queries";
import { formatMoney } from "@atelier/core/commerce/money";
import { PRODUCT_STATUS_LABEL } from "@atelier/core/commerce/products";
import { getI18n } from "@/lib/i18n/server";

export const metadata = { title: "Your store — Astelier" };

export default async function SellPage() {
  const gate = await getGateState();
  if (!gate.signedIn) redirect("/login");
  if (!gate.unlocked) redirect("/"); // the landing shows the follow-gate

  const [curator, creator, { t: dict }] = await Promise.all([
    isViewerCurator(),
    isViewerCreator(),
    getI18n(),
  ]);
  const t = dict.sell;
  const atelierUrl = process.env.NEXT_PUBLIC_ATELIER_URL ?? "https://atelier.aunflaneur.com";

  // A curator who is ALSO a creator can sell — only block a curator who isn't
  // a creator (a pure tastemaker).
  if (curator && !creator) {
    return (
      <>
        <Nav signedIn />
        <main id="main" className="mx-auto w-full max-w-3xl grow px-6 py-12">
          <h1 className="mb-2 text-h1 font-bold uppercase">{t.curatorsDontSellTitle}</h1>
          <div className="border-2 border-ink bg-yellow px-4 py-3">
            <p className="text-body">{t.curatorsDontSellBody}</p>
          </div>
        </main>
      </>
    );
  }

  if (!creator) {
    return (
      <>
        <Nav signedIn />
        <main id="main" className="mx-auto w-full max-w-3xl grow px-6 py-12">
          <h1 className="mb-2 text-h1 font-bold uppercase">{t.shopsForMakersTitle}</h1>
          <div className="border-2 border-ink bg-yellow px-4 py-3">
            <p className="text-body">{t.shopsForMakersBody}</p>
          </div>
          <a
            href={`${atelierUrl}/creator/apply`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-block border-2 border-ink bg-ink px-6 py-2 text-caption font-bold uppercase text-paper hover:border-blue hover:bg-blue"
          >
            {t.becomeCreator}
          </a>
        </main>
      </>
    );
  }

  const store = await getMyStore();
  const validation = await getInstitutionValidation();
  const products = store ? await getProductsForStore(store.id) : [];
  const [viewCounts, storeViews, reach] = store
    ? await Promise.all([
        getProductViewCounts(store.id),
        getStoreViews(store.id),
        getFollowerReach(store.owner_id),
      ])
    : [new Map<string, number>(), 0, 0];
  const liveProducts = products.filter((p) => p.status === "live");
  const catalogValue = liveProducts.reduce((s, p) => s + p.price_cents, 0);

  return (
    <>
      <Nav signedIn />
      <main id="main" className="mx-auto w-full max-w-3xl grow px-6 py-12">
        <h1 className="mb-2 text-h1 font-bold uppercase">
          {store ? t.yourStore : t.openStore}
        </h1>
        <p className="mb-6 max-w-xl text-body">
          {store ? t.editIntro : t.openIntro}
        </p>

        <StoreEditor initial={store} />

        {store ? (
          <section className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              { label: t.storeViews, value: storeViews.toLocaleString() },
              { label: t.followersReached, value: reach.toLocaleString() },
              { label: t.liveProducts, value: String(liveProducts.length) },
              { label: t.catalogValue, value: formatMoney(catalogValue) },
            ].map((s) => (
              <div key={s.label} className="border-2 border-ink p-4">
                <p className="text-h2 font-bold tabular-nums">{s.value}</p>
                <p className="mt-1 text-caption font-bold uppercase opacity-70">{s.label}</p>
              </div>
            ))}
          </section>
        ) : null}

        {store ? (
          <section className="mt-10">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-h2 font-bold uppercase">{t.products}</h2>
              <div className="flex items-center gap-2">
                <Link
                  href={`/store/${store.slug}`}
                  className="border-2 border-ink px-4 py-2 text-caption font-bold uppercase hover:bg-yellow"
                >
                  {t.viewStore}
                </Link>
                <Link
                  href="/sell/products/new"
                  className="border-2 border-ink bg-ink px-4 py-2 text-caption font-bold uppercase text-paper hover:bg-blue hover:border-blue"
                >
                  {t.addProduct}
                </Link>
              </div>
            </div>
            <p className="mt-2 text-caption font-bold uppercase opacity-70">
              {products.length} {t.total} ·{" "}
              {products.filter((p) => p.status === "live").length} {t.live} ·{" "}
              {products.filter((p) => p.status === "draft").length} {t.draft}
            </p>

            {products.length ? (
              <ul className="mt-4 flex flex-col gap-2">
                {products.map((p) => (
                  <li
                    key={p.id}
                    className="flex flex-wrap items-center justify-between gap-3 border-2 border-ink px-4 py-2"
                  >
                    <div className="min-w-0">
                      <Link
                        href={`/sell/products/${p.id}`}
                        className="text-body font-bold hover:text-blue"
                      >
                        {p.title}
                      </Link>
                      <span className="ml-2 text-caption uppercase opacity-70">
                        {formatMoney(p.price_cents, p.currency)} · {PRODUCT_STATUS_LABEL[p.status]} · {viewCounts.get(p.id) ?? 0} views
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/sell/products/${p.id}`}
                        className="border-2 border-ink px-2 py-1 text-caption font-bold uppercase hover:bg-yellow"
                      >
                        {t.edit}
                      </Link>
                      <form action={deleteProductForm}>
                        <input type="hidden" name="id" value={p.id} />
                        <button className="border-2 border-ink px-2 py-1 text-caption font-bold uppercase hover:bg-red hover:border-red hover:text-paper">
                          {t.delete}
                        </button>
                      </form>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-body opacity-70">{t.noProducts}</p>
            )}
          </section>
        ) : null}

        <CrawlerNotice validation={validation} hasStore={!!store} />
      </main>
    </>
  );
}
