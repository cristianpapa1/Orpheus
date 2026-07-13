import Link from "next/link";
import { Window } from "@/components/ui/Window";
import { WindowGrid } from "@/components/ui/WindowGrid";
import { getGroups, getViewerGroupSets } from "@/lib/groups/queries";
import { getOwnProfile } from "@/lib/profile/queries";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { suggestGroupsByInterests } from "@atelier/core/groups/discovery";
import {
  DISCIPLINE_OPTIONS,
  disciplineLabel,
  disciplinesMatch,
} from "@atelier/core/taxonomy/disciplines";
import { POST_CATEGORIES, CATEGORY_LABEL } from "@atelier/core/posts/types";
import { createGroup, followGroup } from "./actions";

const ERRORS: Record<string, string> = {
  unavailable: "Preview mode — creating groups needs Supabase configured.",
  name: "Group names are 3–60 characters.",
  taken: "That group name is taken.",
  create: "Couldn't create the group. Try again.",
};

const CATEGORY_TAGS = DISCIPLINE_OPTIONS.filter((o) => o.isCategory);

export default async function GroupsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; tag?: string; q?: string }>;
}) {
  const { error, tag, q } = await searchParams;
  const [groups, { followed, member }, own] = await Promise.all([
    getGroups(),
    getViewerGroupSets(),
    getOwnProfile(),
  ]);
  const followedSet = new Set(followed);
  const memberSet = new Set(member);
  const configured = isSupabaseConfigured();

  // Filter by discipline tag and/or a name/description query.
  let list = groups;
  if (tag) list = list.filter((g) => disciplinesMatch(g.interests, tag));
  if (q) {
    const needle = q.toLowerCase();
    list = list.filter(
      (g) =>
        g.name.toLowerCase().includes(needle) ||
        g.description.toLowerCase().includes(needle),
    );
  }

  const suggested =
    tag || q
      ? []
      : suggestGroupsByInterests(groups, own?.interests ?? [], {
          exclude: [...followed, ...member],
          limit: 3,
        });

  const chipCls = (active: boolean) =>
    `border-2 px-3 py-1 text-caption font-bold uppercase ${
      active ? "border-ink bg-ink text-paper" : "border-ink hover:bg-yellow"
    }`;

  return (
    <div>
      <h1 className="mb-4 text-h1 font-bold uppercase">Groups</h1>

      {/* Discipline filter + name search */}
      <div className="mb-6 flex flex-col gap-3">
        <form action="/groups" className="flex flex-wrap gap-2">
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="Search groups…"
            className="border-2 border-ink bg-paper px-3 py-1 text-body outline-none focus:border-blue"
          />
          {tag ? <input type="hidden" name="tag" value={tag} /> : null}
          <button className="border-2 border-ink px-3 py-1 text-caption font-bold uppercase hover:bg-yellow">
            Search
          </button>
        </form>
        <div className="flex flex-wrap gap-2" data-discipline-filter>
          <Link href="/groups" data-tag="all" className={chipCls(!tag)}>
            All
          </Link>
          {CATEGORY_TAGS.map((o) => (
            <Link
              key={o.value}
              href={`/groups?tag=${encodeURIComponent(o.value)}`}
              data-tag={o.value}
              className={chipCls(tag === o.value)}
            >
              {o.label}
            </Link>
          ))}
        </div>
      </div>

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

            <p className="text-caption font-bold uppercase">
              What&apos;s this group for?
            </p>
            <p className="text-caption uppercase opacity-70">
              Pick the disciplines — painters, journalists, woodworkers… — so the
              right people can find it.
            </p>
            <div
              data-discipline-picker
              className="flex max-h-56 flex-col gap-2 overflow-auto border-2 border-ink p-2"
            >
              {POST_CATEGORIES.map((c) => (
                <fieldset key={c} className="flex flex-col gap-1">
                  <legend className="text-caption font-bold uppercase opacity-70">
                    {CATEGORY_LABEL[c]}
                  </legend>
                  <div className="flex flex-wrap gap-x-3 gap-y-1">
                    {DISCIPLINE_OPTIONS.filter((o) => o.category === c).map((o) => (
                      <label key={o.value} className="flex items-center gap-1 text-caption">
                        <input
                          type="checkbox"
                          name="interests"
                          value={o.value}
                          disabled={!configured}
                          className="size-3 accent-ink"
                        />
                        {o.label}
                      </label>
                    ))}
                  </div>
                </fieldset>
              ))}
            </div>

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

        {list.length === 0 ? (
          <Window title="No groups" accent="blue" span="col-span-12 md:col-span-8">
            <p className="text-body">
              Nothing matches that filter.{" "}
              <Link href="/groups" className="border-b-2 border-ink font-bold hover:text-blue">
                Clear it
              </Link>
              .
            </p>
          </Window>
        ) : (
          list.map((group, i) => (
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
                {group.interests.length > 0 ? (
                  <p data-group-disciplines className="mt-3 flex flex-wrap gap-1">
                    {group.interests.slice(0, 5).map((t) => (
                      <Link
                        key={t}
                        href={`/groups?tag=${encodeURIComponent(t)}`}
                        className="border-2 border-ink px-2 py-0.5 text-caption font-bold uppercase hover:bg-yellow"
                      >
                        {disciplineLabel(t)}
                      </Link>
                    ))}
                  </p>
                ) : null}
                <p className="mt-3 text-caption font-bold uppercase">
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
          ))
        )}
      </WindowGrid>
    </div>
  );
}
