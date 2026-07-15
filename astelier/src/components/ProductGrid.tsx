import Link from "next/link";
import { formatMoney } from "@atelier/core/commerce/money";
import type { BrowseProduct } from "@/lib/discovery/queries";

export function ProductGrid({ products }: { products: BrowseProduct[] }) {
  if (!products.length) {
    return (
      <p className="border-2 border-dashed border-ink/40 px-4 py-8 text-center text-body opacity-70">
        Nothing here yet.
      </p>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {products.map((p) => (
        <Link
          key={p.id}
          href={`/product/${p.id}`}
          className="group flex flex-col border-2 border-ink"
        >
          <div className="aspect-square overflow-hidden border-b-2 border-ink bg-paper">
            {p.image_urls[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={p.image_urls[0]}
                alt=""
                className="h-full w-full object-cover transition-transform group-hover:scale-105"
              />
            ) : (
              <div className="grid h-full place-items-center text-caption uppercase opacity-40">
                No image
              </div>
            )}
          </div>
          <div className="p-3">
            <p className="truncate text-body font-bold">{p.title}</p>
            <p className="truncate text-caption uppercase opacity-70">{p.store_name}</p>
            <p className="text-caption font-bold uppercase">
              {formatMoney(p.price_cents, p.currency)}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}
