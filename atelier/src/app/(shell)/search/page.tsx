import Link from "next/link";
import { Window } from "@/components/ui/Window";
import { WindowGrid } from "@/components/ui/WindowGrid";
import { searchAll } from "@/lib/search/queries";
import { INSTITUTION_KIND_LABEL } from "@atelier/core/profile/types";

export const metadata = { title: "Search — Atelier" };

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();
  const results = query ? await searchAll(query) : null;
  const total = results
    ? results.profiles.length + results.groups.length + results.posts.length
    : 0;

  return (
    <div>
      <h1 className="mb-4 text-h1 font-bold uppercase">Search</h1>
      <form action="/search" className="mb-6 flex flex-wrap gap-2">
        <input
          name="q"
          defaultValue={query}
          autoFocus
          placeholder="People, groups, work…"
          className="grow border-2 border-ink bg-paper px-3 py-2 text-body outline-none focus:border-blue"
        />
        <button className="border-2 border-ink bg-ink px-4 py-2 text-caption font-bold uppercase text-paper hover:bg-blue hover:border-blue">
          Search
        </button>
      </form>

      {!results ? (
        <p className="text-body opacity-70">
          Search people, institutions, groups, and work by name or text.
        </p>
      ) : total === 0 ? (
        <p className="text-body opacity-70">
          Nothing matches &ldquo;{query}&rdquo;.
        </p>
      ) : (
        <WindowGrid>
          {results.profiles.length > 0 ? (
            <Window title={`People & institutions (${results.profiles.length})`} accent="red" span="col-span-12 md:col-span-4">
              <ul className="flex flex-col gap-2">
                {results.profiles.map((p) => (
                  <li key={p.id}>
                    <Link href={`/u/${p.handle}`} className="text-body font-bold hover:text-blue">
                      {p.display_name} · @{p.handle}
                    </Link>
                    {p.account_type === "institution" && p.institution_kind ? (
                      <span className="ml-2 border-2 border-ink px-1 text-caption font-bold uppercase">
                        {INSTITUTION_KIND_LABEL[p.institution_kind]}
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </Window>
          ) : null}

          {results.groups.length > 0 ? (
            <Window title={`Groups (${results.groups.length})`} accent="blue" span="col-span-12 md:col-span-4">
              <ul className="flex flex-col gap-2">
                {results.groups.map((g) => (
                  <li key={g.id}>
                    <Link href={`/g/${g.slug}`} className="text-body font-bold hover:text-blue">
                      {g.name}
                    </Link>
                    <p className="text-caption uppercase opacity-70">
                      {g.description.slice(0, 80)}
                    </p>
                  </li>
                ))}
              </ul>
            </Window>
          ) : null}

          {results.posts.length > 0 ? (
            <Window title={`Work (${results.posts.length})`} accent="yellow" span="col-span-12 md:col-span-4">
              <ul className="flex flex-col gap-2">
                {results.posts.map((p) => (
                  <li key={p.id}>
                    <Link href={`/p/${p.id}`} className="text-body font-bold hover:text-blue">
                      {p.caption || (p.body ? p.body.slice(0, 60) : "Untitled work")}
                    </Link>
                    <p className="text-caption uppercase opacity-70">
                      by {p.author_name}
                    </p>
                  </li>
                ))}
              </ul>
            </Window>
          ) : null}
        </WindowGrid>
      )}
    </div>
  );
}
