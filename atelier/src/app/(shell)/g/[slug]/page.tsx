import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PostCard } from "@/components/posts/PostCard";
import { Window } from "@/components/ui/Window";
import { WindowGrid } from "@/components/ui/WindowGrid";
import {
  getGroupBySlug,
  getGroupMembers,
  getGroupPosts,
  getGroupsForPosts,
  getViewerGroupRelation,
} from "@/lib/groups/queries";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  acceptInvite,
  approveRequest,
  followGroup,
  inviteToGroup,
  requestToJoin,
  unfollowGroup,
} from "../../groups/actions";
import { createServerSupabase } from "@/lib/supabase/server";
import { getFavoritesForPosts } from "@/lib/favorites/queries";
import { getFollowingRanked, isViewerQualityStamped, getViewerId } from "@/lib/profile/queries";
import { disciplineLabel } from "@atelier/core/taxonomy/disciplines";
import { getGroupThreads, discussionAccess } from "@/lib/groups/discussion";
import { GroupThreadList } from "@/components/groups/GroupThreadList";
import { updateGroupDiscussion } from "../../groups/discussion-actions";
import { getI18n } from "@/lib/i18n/server";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const group = await getGroupBySlug(slug);
  return { title: group ? `${group.name} — Atelier` : "Not found — Atelier" };
}

async function getPendingRequests(groupId: string) {
  const supabase = await createServerSupabase();
  if (!supabase) return [];
  const { data } = await supabase
    .from("group_join_requests")
    .select("requester_id, profile:profiles(handle, display_name)")
    .eq("group_id", groupId);
  return ((data ?? []) as unknown as {
    requester_id: string;
    profile: { handle: string | null; display_name: string | null } | null;
  }[]).map((r) => ({
    requester_id: r.requester_id,
    handle: r.profile?.handle ?? "",
    display_name: r.profile?.display_name ?? r.profile?.handle ?? "Unnamed",
  }));
}

export default async function GroupPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const flags = await searchParams;
  const group = await getGroupBySlug(slug);
  if (!group) notFound();

  const relation = await getViewerGroupRelation(group.id);
  const isMember = relation === "owner" || relation === "member";
  const canSeeFeed = !group.is_private || isMember;
  const members = await getGroupMembers(group.id);
  const posts = canSeeFeed ? await getGroupPosts(group) : [];
  const postGroupTags = canSeeFeed
    ? await getGroupsForPosts(posts.map((p) => p.id))
    : new Map();
  const [favs, following, stamped] = canSeeFeed
    ? await Promise.all([
        getFavoritesForPosts(posts.map((p) => p.id)),
        getFollowingRanked(),
        isViewerQualityStamped(),
      ])
    : [null, [], false];
  const requests = relation === "owner" ? await getPendingRequests(group.id) : [];
  const viewerId = await getViewerId();
  const access = discussionAccess(group.discussion_read, group.discussion_mode, relation);
  const threads = access.canRead ? await getGroupThreads(group.id) : [];
  const configured = isSupabaseConfigured();
  const { t: dict } = await getI18n();
  const t = dict.groups;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <h1 className="text-h1 font-bold uppercase">{group.name}</h1>
        {group.is_private ? (
          <span data-private-badge className="border-2 border-ink bg-yellow px-2 py-1 text-caption font-bold uppercase">
            {t.privateBadge}
          </span>
        ) : null}
        <span className="text-caption font-bold uppercase">
          {group.member_count} {t.members} · {group.follower_count} {t.followers}
        </span>
      </div>

      {flags.error ? (
        <p role="alert" className="mb-4 border-2 border-red px-3 py-2 text-caption font-bold uppercase text-red">
          {t.somethingWrong}
        </p>
      ) : null}
      {flags.invited ? (
        <p role="status" className="mb-4 border-2 border-ink px-3 py-2 text-caption font-bold uppercase">
          {t.inviteSent}
        </p>
      ) : null}

      <WindowGrid className="mb-4">
        <Window title={t.about} accent="blue" span="col-span-12 md:col-span-5">
          <p className="text-body">{group.description}</p>
          {group.interests.length > 0 ? (
            <p data-group-disciplines className="mt-3 flex flex-wrap gap-1">
              {group.interests.map((t) => (
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

          {/* Viewer controls by relation */}
          <div className="mt-5 flex flex-wrap gap-2" data-relation={relation}>
            {relation === "invited" ? (
              <form action={acceptInvite}>
                <input type="hidden" name="group_id" value={group.id} />
                <input type="hidden" name="slug" value={group.slug} />
                <button className="border-2 border-ink bg-ink px-4 py-1 text-caption font-bold uppercase text-paper hover:bg-blue hover:border-blue">
                  {t.acceptInvite}
                </button>
              </form>
            ) : null}
            {relation === "none" ? (
              <>
                <form action={followGroup}>
                  <input type="hidden" name="group_id" value={group.id} />
                  <input type="hidden" name="slug" value={group.slug} />
                  <button
                    data-follow-group
                    disabled={!configured}
                    className="border-2 border-ink px-4 py-1 text-caption font-bold uppercase hover:bg-blue hover:border-blue hover:text-paper disabled:opacity-50"
                  >
                    {t.followGroup}
                  </button>
                </form>
                <form action={requestToJoin}>
                  <input type="hidden" name="group_id" value={group.id} />
                  <input type="hidden" name="slug" value={group.slug} />
                  <button
                    data-request-join
                    disabled={!configured}
                    className="border-2 border-ink px-4 py-1 text-caption font-bold uppercase hover:bg-yellow disabled:opacity-50"
                  >
                    {t.requestJoin}
                  </button>
                </form>
              </>
            ) : null}
            {relation === "requested" ? (
              <p className="text-caption font-bold uppercase">{t.joinPending}</p>
            ) : null}
            {relation === "follower" ? (
              <form action={unfollowGroup}>
                <input type="hidden" name="group_id" value={group.id} />
                <input type="hidden" name="slug" value={group.slug} />
                <button className="border-2 border-ink bg-ink px-4 py-1 text-caption font-bold uppercase text-paper hover:bg-red hover:border-red">
                  {t.unfollow}
                </button>
              </form>
            ) : null}
            {isMember ? (
              <p className="text-caption font-bold uppercase">{t.memberBadge}</p>
            ) : null}
          </div>
        </Window>

        <Window title={t.membersTitle} accent="yellow" span="col-span-12 md:col-span-4">
          <ul data-member-list className="flex flex-col gap-2">
            {members.map((m) => (
              <li key={m.profile_id} className="flex items-baseline justify-between gap-2">
                <Link href={`/u/${m.handle || m.profile_id}`} className="text-body font-bold hover:text-blue">
                  {m.display_name}{m.handle ? ` · @${m.handle}` : ""}
                </Link>
                <span className="text-caption uppercase opacity-70">{m.role}</span>
              </li>
            ))}
          </ul>
        </Window>

        <Window title={t.inviteCreator} accent="red" span="col-span-12 md:col-span-3">
          {isMember ? (
            <form action={inviteToGroup} data-invite-form className="flex flex-col gap-3">
              <input type="hidden" name="group_id" value={group.id} />
              <input type="hidden" name="slug" value={group.slug} />
              <label htmlFor="handle" className="text-caption font-bold uppercase">
                {t.theirHandle}
              </label>
              <input
                id="handle"
                name="handle"
                required
                placeholder="handle"
                className="border-2 border-ink bg-paper px-3 py-2 text-body outline-none focus:border-blue"
              />
              <button className="self-start border-2 border-ink bg-ink px-4 py-1 text-caption font-bold uppercase text-paper hover:bg-blue hover:border-blue">
                {t.invite}
              </button>
            </form>
          ) : (
            <p className="text-body opacity-70">
              Members invite each other — that&apos;s how groups grow here.
            </p>
          )}
        </Window>

        {relation === "owner" && requests.length > 0 ? (
          <Window title={t.joinRequests} accent="red" span="col-span-12">
            <ul className="flex flex-col gap-2">
              {requests.map((r) => (
                <li key={r.requester_id} className="flex items-center gap-3">
                  <span className="text-body font-bold">
                    {r.display_name} · @{r.handle}
                  </span>
                  <form action={approveRequest}>
                    <input type="hidden" name="group_id" value={group.id} />
                    <input type="hidden" name="slug" value={group.slug} />
                    <input type="hidden" name="requester_id" value={r.requester_id} />
                    <button className="border-2 border-ink px-3 py-1 text-caption font-bold uppercase hover:bg-yellow">
                      {t.admit}
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          </Window>
        ) : null}
      </WindowGrid>

      <div className="mb-4 mt-8 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-h2 font-bold uppercase">{t.discussion}</h2>
        {relation === "owner" ? (
          <details className="relative">
            <summary className="cursor-pointer border-2 border-ink px-3 py-1 text-caption font-bold uppercase hover:bg-yellow">
              {t.settings}
            </summary>
            <form
              action={updateGroupDiscussion}
              className="absolute right-0 z-20 mt-1 flex w-64 flex-col gap-3 border-2 border-ink bg-paper p-3"
            >
              <input type="hidden" name="group_id" value={group.id} />
              <input type="hidden" name="slug" value={group.slug} />
              <label className="text-caption font-bold uppercase">{t.whoCanRead}</label>
              <select name="discussion_read" defaultValue={group.discussion_read} className="border-2 border-ink bg-paper px-2 py-1 text-body">
                <option value="members">{t.membersOnly}</option>
                <option value="public">{t.anyone}</option>
              </select>
              <label className="text-caption font-bold uppercase">{t.whoCanPost}</label>
              <select name="discussion_mode" defaultValue={group.discussion_mode} className="border-2 border-ink bg-paper px-2 py-1 text-body">
                <option value="open">{t.openMode}</option>
                <option value="announce">{t.announceMode}</option>
                <option value="broadcast">{t.broadcastMode}</option>
              </select>
              <button className="self-start border-2 border-ink bg-ink px-3 py-1 text-caption font-bold uppercase text-paper hover:bg-blue hover:border-blue">
                {t.save}
              </button>
            </form>
          </details>
        ) : null}
      </div>
      <WindowGrid>
        {access.canRead ? (
          <Window title={t.discussion} accent="blue" span="col-span-12 md:col-span-8">
            <GroupThreadList
              threads={threads}
              access={access}
              groupId={group.id}
              slug={group.slug}
            />
          </Window>
        ) : (
          <Window title={t.membersOnlyTitle} accent="yellow" span="col-span-12 md:col-span-6">
            <p className="text-body opacity-70">{t.discussionMembersOnly}</p>
          </Window>
        )}
      </WindowGrid>

      <h2 className="mb-4 mt-8 text-h2 font-bold uppercase">{t.groupFeed}</h2>
      {!canSeeFeed ? (
        <WindowGrid>
          <Window title={t.privateGroup} accent="yellow" span="col-span-12 md:col-span-6">
            <p data-private-notice className="text-body">{t.privateFeedBody}</p>
          </Window>
        </WindowGrid>
      ) : posts.length === 0 ? (
        <WindowGrid>
          <Window title={t.empty} accent="blue" span="col-span-12 md:col-span-6">
            <p className="text-body">{t.noPosts}</p>
          </Window>
        </WindowGrid>
      ) : (
        <WindowGrid>
          {posts.map((post, i) => (
            <PostCard
              key={post.id}
              post={post}
              index={i}
              groups={postGroupTags.get(post.id) ?? []}
              fav={favs?.get(post.id)}
              following={following}
              canReportQuality={stamped}
              viewerId={viewerId}
            />
          ))}
        </WindowGrid>
      )}
    </div>
  );
}
