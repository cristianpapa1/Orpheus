import Link from "next/link";
import { Window } from "@/components/ui/Window";
import { WindowGrid } from "@/components/ui/WindowGrid";
import { getGroups, getViewerGroupSets } from "@/lib/groups/queries";
import { getOwnProfile } from "@/lib/profile/queries";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { suggestGroups } from "@atelier/core/groups/discovery";
import { interestLabels } from "@atelier/core/profile/types";
import { createGroup, followGroup } from "./actions";

const ERRORS: Record<string, string> = {
  unavailable: "Preview mode — creating groups needs Supabase configured.",
  name: "Group names are 3–60 characters.",
  taken: "That group name is taken.",
  create: "Couldn't create the group. Try again.",
};

export default async function GroupsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const [groups, { followed, member }, own] = await Promise.all([
    getGroups(),
    getViewerGroupSets(),
    getOwnProfile(),
  ]);
  const followedSet = new Set(followed);
  const memberSet = new Set(member);
  const configured = isSupabaseConfigured();

  // Interest-based discovery: point new members at groups they'll care about.
  const suggested = suggestGroups(groups, interestLabels(own?.interests ?? []), {
    exclude: [...followed, ...member],
    limit: 3,
  });

  return (
    <div>
      <h1 className="mb-6 text-h1 font-bold uppercase">Groups</h1>

      {suggested.length > 0 ? (
        <section data-suggested-groups className="mb-8">
          <h2 className="mb-4 text-h2 font-bold uppercase">Suggested for you</h2>
          <WindowGrid>
            {suggested.map((group, i) => (
              <div key={group.id} className="col-span-12 flex flex-col md:col-span-4">
                <Window
                  title="Because of your interests"
                  accent={(["red", "blue", "yellow"] as const)[i % 3]}
                  className="h-full"
                >
                  <Link href={`/g/${group.slug}`} className="text-h2 font-bold uppercase hover:text-blue">
                    {group.name}
                  </Link>
                  <p className="mt-2 text-body">{group.description}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <form action={followGroup}>
                      <input type="hidden" name="group_id" value={group.id} />
                      <input type="hidden" name="slug" value={group.slug} />
                      <button className="border-2 border-ink bg-ink px-3 py-1 text-caption font-bold uppercase text-paper hover:bg-blue hover:border-blue">
                        Follow
                      </button>
                    </form>
                    <Link
                      href={`/g/${group.slug}`}
                      className="border-2 border-ink px-3 py-1 text-caption font-bold uppercase hover:bg-yellow"
                    >
                      Open group →
                    </Link>
                  </div>
                </Window>
              </div>
            ))}
          </WindowGrid>
        </section>
      ) : null}

      <WindowGrid>
        <Window title="Start a group" accent="red" span="col-span-12 md:col-span-4">
          {error ? (
            <p role="alert" className="mb-3 border-2 border-red px-3 py-2 text-caption font-bold uppercase text-red">
              {ERRORS[error] ?? "Something went wrong."}
            </p>
          ) : null}
          <form action={createGroup} data-create-group className="flex flex-col gap-3">
            <label htmlFor="name" className="text-caption font-bold uppercase">
              Name
            </label>
            <input
              id="name"
              name="name"
              required
              minLength={3}
              maxLength={60}
              disabled={!configured}
              className="border-2 border-ink bg-paper px-3 py-2 text-body outline-none focus:border-blue disabled:opacity-50"
            />
            <label htmlFor="description" className="text-caption font-bold uppercase">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              maxLength={600}
              disabled={!configured}
              className="border-2 border-ink bg-paper px-3 py-2 text-body outline-none focus:border-blue disabled:opacity-50"
            />
            <label className="flex items-center gap-2 text-caption font-bold uppercase">
              <input type="checkbox" name="is_private" disabled={!configured} className="size-4 accent-ink" />
              Private feed (members share; others must be admitted)
            </label>
            <button
              type="submit"
              disabled={!configured}
              className="self-start border-2 border-ink bg-ink px-4 py-2 text-caption font-bold uppercase text-paper hover:bg-blue hover:border-blue disabled:opacity-50"
            >
              Create group
            </button>
            {!configured ? (
              <p className="text-caption uppercase opacity-70">
                Preview mode — browse the demo groups meanwhile
              </p>
            ) : null}
          </form>
        </Window>

        {groups.map((group, i) => (
          <div key={group.id} data-group={group.slug} className="col-span-12 flex flex-col md:col-span-4">
            <Window
              title={group.is_private ? "Private group" : "Group"}
              accent={(["blue", "yellow", "red"] as const)[i % 3]}
              className="h-full"
            >
              <Link href={`/g/${group.slug}`} className="text-h2 font-bold uppercase hover:text-blue">
                {group.name}
              </Link>
              <p className="mt-2 text-body">{group.description}</p>
              <p className="mt-4 text-caption font-bold uppercase">
                {group.member_count} members · {group.follower_count} followers
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {configured && !memberSet.has(group.id) && !followedSet.has(group.id) ? (
                  <form action={followGroup}>
                    <input type="hidden" name="group_id" value={group.id} />
                    <input type="hidden" name="slug" value={group.slug} />
                    <button
                      data-follow-group={group.slug}
                      className="border-2 border-ink bg-ink px-3 py-1 text-caption font-bold uppercase text-paper hover:bg-blue hover:border-blue"
                    >
                      Follow
                    </button>
                  </form>
                ) : null}
                {memberSet.has(group.id) ? (
                  <span className="border-2 border-ink bg-yellow px-3 py-1 text-caption font-bold uppercase">
                    Member
                  </span>
                ) : followedSet.has(group.id) ? (
                  <span className="border-2 border-ink px-3 py-1 text-caption font-bold uppercase opacity-70">
                    Following
                  </span>
                ) : null}
                <Link
                  href={`/g/${group.slug}`}
                  className="border-2 border-ink px-3 py-1 text-caption font-bold uppercase hover:bg-yellow"
                >
                  Open group →
                </Link>
              </div>
            </Window>
          </div>
        ))}
      </WindowGrid>
    </div>
  );
}
