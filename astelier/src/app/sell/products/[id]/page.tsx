import { notFound, redirect } from "next/navigation";
import { Nav } from "@/components/Nav";
import { ProductEditor } from "@/components/ProductEditor";
import { getGateState } from "@/lib/gate";
import { getMyStore } from "@/lib/stores/queries";
import { getProductById } from "@/lib/products/queries";
import { getI18n } from "@/lib/i18n/server";
import { categoryChips } from "@/lib/taxonomy";

export const metadata = { title: "Edit product — Astelier" };

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const gate = await getGateState();
  if (!gate.signedIn) redirect("/login");
  if (!gate.unlocked) redirect("/");
  const store = await getMyStore();
  if (!store) redirect("/sell");

  const { id } = await params;
  const product = await getProductById(id);
  if (!product || product.store_id !== store.id) notFound();

  const ATELIER_URL =
    process.env.NEXT_PUBLIC_ATELIER_URL ?? "https://atelier.aunflaneur.com";
  const ASTELIER_URL =
    process.env.NEXT_PUBLIC_ASTELIER_URL ?? "https://astelier.aunflaneur.com";
  const productUrl = `${ASTELIER_URL}/product/${product.id}`;
  const postOnAtelier = `${ATELIER_URL}/post/new?caption=${encodeURIComponent(
    product.title,
  )}&checkout_url=${encodeURIComponent(productUrl)}`;
  const { t, locale } = await getI18n();

  return (
    <>
      <Nav signedIn />
      <main id="main" className="mx-auto w-full max-w-3xl grow px-6 py-12">
        <h1 className="mb-6 text-h1 font-bold uppercase">{t.productEditor.editProduct}</h1>

        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-2 border-ink bg-yellow px-4 py-3">
          <p className="text-caption font-bold uppercase">{t.productEditor.shareBanner}</p>
          <a
            href={postOnAtelier}
            className="border-2 border-ink bg-ink px-4 py-2 text-caption font-bold uppercase text-paper hover:bg-blue hover:border-blue"
          >
            {t.productEditor.postOnAtelier}
          </a>
        </div>

        <ProductEditor initial={product} categoryOptions={categoryChips(locale)} />
      </main>
    </>
  );
}
