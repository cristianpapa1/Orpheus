-- Phase D — an optional Astelier checkout link on a post. When set, the post's
-- Act menu shows "Checkout at Astelier" that deep-links to the seller's store or
-- product. User-initiated only; never promoted or ranked. Idempotent.

alter table public.posts add column if not exists checkout_url text;
