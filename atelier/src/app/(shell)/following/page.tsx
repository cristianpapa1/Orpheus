import Link from "next/link";
import { Window } from "@/components/ui/Window";
import { WindowGrid } from "@/components/ui/WindowGrid";
import { getFollowing } from "@/lib/profile/queries";
import { getFollowedGroups } from "@/lib/groups/queries";
import { INSTITUTION_KIND_LABEL } from "@atelier/core/profile/types";

export const metadata = { title: "Following — Atelier" };

export default async function FollowingPage() {
  const [people, groups] = await Promise.all([
    getFollowing(),
    getFollowedGroups(),
  ]);
  const individuals = people.filter((p) => p.account_type === "individual");
  const institutions = people.filter((p) => p.account_type === "institution");
  const total = people.length + groups.length;

  return (
    <div>
      <h1 className="mb-6 text-h1 font-bold uppercase">Following</h1>
      {total === 0 ? (
        <WindowGrid>
          <Window title="Nobody yet" accent="red" span="col-span-12 md:col-span-8">
            <p className="text-body">
              Follow creators and institutions, and follow groups — everything
              you follow collects here, and their work fills your{" "}
              <Link href="/feed" className="border-b-2 border-ink font-bold hover:text-blue">
                feed
              </Link>
              .
            </p>
          </Window>
        </WindowGrid>
      ) : (
        <WindowGrid>
          {institutions.length > 0 ? (
            <Window title={`Institutions (${institutions.length})`} accent="red" span="col-span-12 md:col-span-4">
              <ul className="flex flex-col gap-2">
                {institutions.map((p) => (
                  <li key={p.id}>
                    <Link href={`/u/${p.handle || p.id}`} className="text-body font-bold hover:text-blue">
                      {p.display_name}
                    </Link>
                    {p.institution_kind ? (
                      <span className="ml-2 text-caption uppercase opacity-70">
                        {INSTITUTION_KIND_LABEL[p.institution_kind]}
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </Window>
          ) : null}

          {individuals.length > 0 ? (
            <Window title={`People (${individuals.length})`} accent="blue" span="col-span-12 md:col-span-4">
              <ul className="flex flex-col gap-2">
                {individuals.map((p) => (
                  <li key={p.id}>
                    <Link href={`/u/${p.handle || p.id}`} className="text-body font-bold hover:text-blue">
                      {p.display_name}
                      {p.handle ? ` · @${p.handle}` : ""}
                    </Link>
                  </li>
                ))}
              </ul>
            </Window>
          ) : null}

          {groups.length > 0 ? (
            <Window title={`Groups (${groups.length})`} accent="yellow" span="col-span-12 md:col-span-4">
              <ul className="flex flex-col gap-2">
                {groups.map((g) => (
                  <li key={g.id}>
                    <Link href={`/g/${g.slug}`} className="text-body font-bold hover:text-blue">
                      {g.name}
                    </Link>
                    <span className="ml-2 text-caption uppercase opacity-70">
                      {g.member_count} members
                    </span>
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
