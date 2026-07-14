import { redirect } from "next/navigation";
import { Nav } from "@/components/Nav";
import { StoreEditor } from "@/components/StoreEditor";
import { getGateState } from "@/lib/gate";
import { getMyStore } from "@/lib/stores/queries";

export const metadata = { title: "Your store — Astelier" };

export default async function SellPage() {
  const gate = await getGateState();
  if (!gate.signedIn) redirect("/login");
  if (!gate.unlocked) redirect("/"); // the landing shows the follow-gate

  const store = await getMyStore();

  return (
    <>
      <Nav signedIn />
      <main id="main" className="mx-auto w-full max-w-3xl grow px-6 py-12">
        <h1 className="mb-2 text-h1 font-bold uppercase">
          {store ? "Your store" : "Open your store"}
        </h1>
        <p className="mb-6 max-w-xl text-body">
          {store
            ? "Edit your storefront. Products come next."
            : "Name your storefront and claim its handle. You can add products once it's open."}
        </p>
        <StoreEditor initial={store} />
      </main>
    </>
  );
}
