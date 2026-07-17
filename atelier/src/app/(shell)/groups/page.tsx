import Link from "next/link";
import { Window } from "@/components/ui/Window";
import { WindowGrid } from "@/components/ui/WindowGrid";
import { getGroups, getViewerGroupSets } from "@/lib/groups/queries";
import { getOwnProfile, getViewerCreatorStatus } from "@/lib/profile/queries";
import { CreatorGate } from "@/components/creator/CreatorGate";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { suggestGroupsByInterests } from "@atelier/core/groups/discovery";
import {
  DISCIPLINE_OPTIONS,
  disciplineLabel,
  disciplinesMatch,
} from "@atelier/core/taxonomy/disciplines";
import { DisciplineDropdown } from "@/components/groups/DisciplineDropdown";
import { getI18n } from "@/lib/i18n/server";
import { createGroup, followGroup } from "./actions";

const CATEGORY_TAGS = DISCIPLINE_OPTIONS.filter((o) => o.isCategory);

export default async function GroupsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; tag?: string; q?: string }>;
}) {
  const { error, tag, q } = await searchParams;
  const [groups, { followed, member }, own, creatorStatus] = await Promise.all([
    getGroups(),
    getViewerGroupSets(),
    getOwnProfile(),
    getViewerCreatorStatus(),
  ]);
  const followedSet = new Set(followed);
  const memberSet = new Set(member);
  const configured = isSupabaseConfigured();
  const { t: dict } = await getI18n();
  const t = dict.groups;
  const errMap: Record<string, string> = {
    unavailable: t.errUnavailable,
    name: t.errName,
    taken: t.errTaken,
    create: t.errCreate,
    "protected-name": t.errProtected,
  };

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
      <h1 className="mb-4 text-h1 font-bold uppercase">{t.title}</h1>

      {/* Discipline filter + name search */}
      <div className="mb-6 flex flex-col gap-3">
        <form action="/groups" className="flex flex-wrap gap-2">
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder={t.searchPlaceholder}
            className="border-2 border-ink bg-paper px-3 py-1 text-body outline-none focus:border-blue"
          />
          {tag ? <input type="hidden" name="tag" value={tag} /> : null}
          <button className="border-2 border-ink px-3 py-1 text-caption font-bold uppercase hover:bg-yellow">
            {t.search}
          </button>
        </form>
        <div className="flex flex-wrap gap-2" data-discipline-filter>
          <Link href="/groups" data-tag="all" className={chipCls(!tag)}>
            {t.all}
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
          <h2 className="mb-4 text-h2 font-bold uppercase">{t.suggestedForYou}</h2>
          <WindowGrid>
            {suggested.map((group, i) => (
              <div key={group.id} className="col-span-12 flex flex-col md:col-span-4">
                <Window
                  title={t.becauseInterests}
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
                        {t.follow}
                      </button>
                    </form>
                    <Link
                      href={`/g/${group.slug}`}
                      className="border-2 border-ink px-3 py-1 text-caption font-bold uppercase hover:bg-yellow"
                    >
                      {t.openGroup}
                    </Link>
                  </div>
                </Window>
              </div>
            ))}
          </WindowGrid>
        </section>
      ) : null}

      <WindowGrid>
        <Window title={t.startGroup} accent="red" span="col-span-12 md:col-span-4">
          {creatorStatus !== "approved" ? (
            <CreatorGate status={creatorStatus} />
          ) : (
          <>
          {error ? (
            <p role="alert" className="mb-3 border-2 border-red px-3 py-2 text-caption font-bold uppercase text-red">
              {errMap[error] ?? t.somethingWrong}
            </p>
          ) : null}
          <form action={createGroup} data-create-group className="flex flex-col gap-3">
            <label htmlFor="name" className="text-caption font-bold uppercase">
              {t.name}
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
              {t.description}
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              maxLength={600}
              disabled={!configured}
              className="border-2 border-ink bg-paper px-3 py-2 text-body outline-none focus:border-blue disabled:opacity-50"
            />

            <p className="text-caption font-bold uppercase">{t.whatFor}</p>
            <p className="text-caption uppercase opacity-70">{t.disciplinesHint}</p>
            <DisciplineDropdown disabled={!configured} />

            <p className="text-caption font-bold uppercase">{t.discussion}</p>
            <div className="flex flex-wrap gap-3">
              <label className="flex flex-col gap-1 text-caption font-bold uppercase">
                {t.whoCanRead}
                <select
                  name="discussion_read"
                  defaultValue="members"
                  disabled={!configured}
                  className="border-2 border-ink bg-paper px-2 py-1 text-body normal-case disabled:opacity-50"
                >
                  <option value="members">{t.membersOnly}</option>
                  <option value="public">{t.anyone}</option>
                </select>
              </label>
              <label className="flex flex-col gap-1 text-caption font-bold uppercase">
                {t.whoCanPost}
                <select
                  name="discussion_mode"
                  defaultValue="open"
                  disabled={!configured}
                  className="border-2 border-ink bg-paper px-2 py-1 text-body normal-case disabled:opacity-50"
                >
                  <option value="open">{t.openMode}</option>
                  <option value="announce">{t.announceMode}</option>
                  <option value="broadcast">{t.broadcastMode}</option>
                </select>
              </label>
            </div>

            <label className="flex items-center gap-2 text-caption font-bold uppercase">
              <input type="checkbox" name="is_private" disabled={!configured} className="size-4 accent-ink" />
              {t.privateFeed}
            </label>
            <button
              type="submit"
              disabled={!configured}
              className="self-start border-2 border-ink bg-ink px-4 py-2 text-caption font-bold uppercase text-paper hover:bg-blue hover:border-blue disabled:opacity-50"
            >
              {t.createGroup}
            </button>
            {!configured ? (
              <p className="text-caption uppercase opacity-70">
                Preview mode — browse the demo groups meanwhile
              </p>
            ) : null}
          </form>
          </>
          )}
        </Window>

        {list.length === 0 ? (
          <Window title={t.noGroups} accent="blue" span="col-span-12 md:col-span-8">
            <p className="text-body">
              {t.nothingMatches}{" "}
              <Link href="/groups" className="border-b-2 border-ink font-bold hover:text-blue">
                {t.clearIt}
              </Link>
              .
            </p>
          </Window>
        ) : (
          list.map((group, i) => (
            <div key={group.id} data-group={group.slug} className="col-span-12 flex flex-col md:col-span-4">
              <Window
                title={group.is_private ? t.privateGroup : t.group}
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
                  {group.member_count} {t.members} · {group.follower_count} {t.followers}
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
                        {t.follow}
                      </button>
                    </form>
                  ) : null}
                  {memberSet.has(group.id) ? (
                    <span className="border-2 border-ink bg-yellow px-3 py-1 text-caption font-bold uppercase">
                      {t.memberBadge}
                    </span>
                  ) : followedSet.has(group.id) ? (
                    <span className="border-2 border-ink px-3 py-1 text-caption font-bold uppercase opacity-70">
                      {t.following}
                    </span>
                  ) : null}
                  <Link
                    href={`/g/${group.slug}`}
                    className="border-2 border-ink px-3 py-1 text-caption font-bold uppercase hover:bg-yellow"
                  >
                    {t.openGroup}
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
