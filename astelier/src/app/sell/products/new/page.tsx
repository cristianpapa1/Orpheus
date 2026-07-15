import { redirect } from "next/navigation";
import { Nav } from "@/components/Nav";
import { ProductEditor } from "@/components/ProductEditor";
import { getGateState } from "@/lib/gate";
import { getMyStore } from "@/lib/stores/queries";

export const metadata = { title: "New product — Astelier" };

export default async function NewProductPage() {
  const gate = await getGateState();
  if (!gate.signedIn) redirect("/login");
  if (!gate.unlocked) redirect("/");
  const store = await getMyStore();
  if (!store) redirect("/sell");

  return (
    <>
      <Nav signedIn />
      <main id="main" className="mx-auto w-full max-w-3xl grow px-6 py-12">
        <h1 className="mb-6 text-h1 font-bold uppercase">New product</h1>
        <ProductEditor initial={null} />
      </main>
    </>
  );
}
