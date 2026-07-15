import { notFound, redirect } from "next/navigation";
import { Nav } from "@/components/Nav";
import { ProductEditor } from "@/components/ProductEditor";
import { getGateState } from "@/lib/gate";
import { getMyStore } from "@/lib/stores/queries";
import { getProductById } from "@/lib/products/queries";

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

  return (
    <>
      <Nav signedIn />
      <main id="main" className="mx-auto w-full max-w-3xl grow px-6 py-12">
        <h1 className="mb-6 text-h1 font-bold uppercase">Edit product</h1>
        <ProductEditor initial={product} />
      </main>
    </>
  );
}
