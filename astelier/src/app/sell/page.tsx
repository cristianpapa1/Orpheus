import { redirect } from "next/navigation";
import Link from "next/link";
import { Nav } from "@/components/Nav";
import { StoreEditor } from "@/components/StoreEditor";
import { getGateState } from "@/lib/gate";
import { getMyStore } from "@/lib/stores/queries";
import { getProductsForStore } from "@/lib/products/queries";
import { deleteProductForm } from "@/app/sell/products/actions";
import { formatMoney } from "@atelier/core/commerce/money";
import { PRODUCT_STATUS_LABEL } from "@atelier/core/commerce/products";

export const metadata = { title: "Your store — Astelier" };

export default async function SellPage() {
  const gate = await getGateState();
  if (!gate.signedIn) redirect("/login");
  if (!gate.unlocked) redirect("/"); // the landing shows the follow-gate

  const store = await getMyStore();
  const products = store ? await getProductsForStore(store.id) : [];

  return (
    <>
      <Nav signedIn />
      <main id="main" className="mx-auto w-full max-w-3xl grow px-6 py-12">
        <h1 className="mb-2 text-h1 font-bold uppercase">
          {store ? "Your store" : "Open your store"}
        </h1>
        <p className="mb-6 max-w-xl text-body">
          {store
            ? "Edit your storefront, then add the work you make."
            : "Name your storefront and claim its handle. You can add products once it's open."}
        </p>

        <StoreEditor initial={store} />

        {store ? (
          <section className="mt-10">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-h2 font-bold uppercase">Products</h2>
              <Link
                href="/sell/products/new"
                className="border-2 border-ink bg-ink px-4 py-2 text-caption font-bold uppercase text-paper hover:bg-blue hover:border-blue"
              >
                + Add product
              </Link>
            </div>

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
                        {formatMoney(p.price_cents, p.currency)} · {PRODUCT_STATUS_LABEL[p.status]}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/sell/products/${p.id}`}
                        className="border-2 border-ink px-2 py-1 text-caption font-bold uppercase hover:bg-yellow"
                      >
                        Edit
                      </Link>
                      <form action={deleteProductForm}>
                        <input type="hidden" name="id" value={p.id} />
                        <button className="border-2 border-ink px-2 py-1 text-caption font-bold uppercase hover:bg-red hover:border-red hover:text-paper">
                          Delete
                        </button>
                      </form>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-body opacity-70">
                No products yet — add your first.
              </p>
            )}
          </section>
        ) : null}
      </main>
    </>
  );
}
