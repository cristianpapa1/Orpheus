import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FollowButton, type FollowState } from "@/components/profile/FollowButton";
import { MessageButton } from "@/components/chat/MessageButton";
import { ProfileCanvas } from "@/components/profile/ProfileCanvas";
import {
  getProfileByHandleOrId,
  getProfileClaimState,
  getViewerId,
  isCreatorProfile,
  isFollowing,
  isViewerQualityStamped,
} from "@/lib/profile/queries";
import { coerceLayoutForCreator } from "@atelier/core/profile/layout";
import { getI18n } from "@/lib/i18n/server";
import { getPostsByAuthor } from "@/lib/posts/queries";
import { getFavoritesByProfile } from "@/lib/favorites/queries";
import { getRatingsForPosts } from "@/lib/ratings/queries";
import { getCuratedByProfile } from "@/lib/curations/queries";
import { isCurator } from "@/lib/curator/eligibility";
import { FavoritesGallery } from "@/components/profile/FavoritesGallery";
import { CuratedGallery } from "@/components/profile/CuratedGallery";
import { Window } from "@/components/ui/Window";
import { getStoreLinkForOwner } from "@/lib/commerce/stores";
import { getEventsByProfile } from "@/lib/events/queries";
import { getJobsByProfile } from "@/lib/jobs/queries";
import { ReportControl } from "@/components/moderation/ReportControl";
import { blockUser, unblockUser } from "@/lib/moderation/actions";
import { requestClaim } from "../actions";
import { isBlocked } from "@/lib/moderation/queries";
import { isSupabaseConfigured } from "@/lib/supabase/config";

interface Props {
  params: Promise<{ handle: string }>;
  searchParams: Promise<{ claim?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params;
  const profile = await getProfileByHandleOrId(handle);
  if (!profile) return { title: "Not found — Atelier" };
  return {
    title: `${profile.display_name} — Atelier`,
    description: profile.bio || `@${profile.handle} on Atelier`,
  };
}

export default async function PublicProfilePage({ params, searchParams }: Props) {
  const { handle } = await params;
  const { claim: claimFlag } = await searchParams;
  const profile = await getProfileByHandleOrId(handle);
  if (!profile) notFound();

  // A user who hasn't chosen a handle is still reachable by their id.
  const slug = profile.handle || profile.id;

  const posts = await getPostsByAuthor(profile.id, 6);
  const events = await getEventsByProfile(profile.id);
  const jobs = await getJobsByProfile(profile.id);
  const blocked = await isBlocked(profile.id);
  const claim = await getProfileClaimState(profile.id);
  const storeLink = await getStoreLinkForOwner(profile.id);
  const [curator, favorites, curated, creatorProfile] = await Promise.all([
    isCurator(profile.id),
    getFavoritesByProfile(profile.id, 12),
    getCuratedByProfile(profile.id, 12),
    isCreatorProfile(profile.id),
  ]);
  const favRatings = await getRatingsForPosts(
    profile.id,
    favorites.map((p) => p.id),
  );

  // A common member (not an approved creator) can't publish work/events/jobs,
  // so their canvas shows identity + a Liked shelf instead of empty windows.
  const layout = coerceLayoutForCreator(profile.layout, creatorProfile);
  const hasLikedBlock = layout.blocks.some((b) => b.type === "liked");

  const configured = isSupabaseConfigured();
  const viewerId = configured ? await getViewerId() : null;
  const viewerStamped = configured ? await isViewerQualityStamped() : false;
  const { t: dict } = await getI18n();
  const t = dict.profile;

  let state: FollowState;
  if (!configured) state = "preview";
  else if (!viewerId) state = "signed-out";
  else if (viewerId === profile.id) state = "self";
  else state = (await isFollowing(profile.id)) ? "following" : "can-follow";

  const isManager = Boolean(viewerId && claim.managed_by === viewerId);
  const canEdit = state === "self" || isManager;
  const canClaim = Boolean(
    claim.is_seed &&
      !claim.claimed &&
      viewerId &&
      viewerId !== profile.id &&
      !isManager,
  );

  return (
    <div data-school={profile.school} className="-m-2 p-2">
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <h1 className="min-w-0 max-w-full break-words text-h1 font-bold uppercase">{profile.display_name}</h1>
        {claim.claimed ? (
          <span
            data-verified
            title="Claimed by its owner"
            className="border-2 border-ink bg-ink px-2 py-1 text-caption font-bold uppercase text-paper"
          >
            {t.verified}
          </span>
        ) : null}
        {claim.quality_stamped ? (
          <span
            data-quality
            title="Quality member — a trusted reviewer"
            className="border-2 border-ink bg-yellow px-2 py-1 text-caption font-bold uppercase"
          >
            {t.quality}
          </span>
        ) : null}
        {curator ? (
          <span
            data-curator
            title="Curator — a tastemaker who reposts work as curated"
            className="border-2 border-ink bg-blue px-2 py-1 text-caption font-bold uppercase text-paper"
          >
            {t.curatorBadge}
          </span>
        ) : null}
        <span data-follower-count className="text-caption font-bold uppercase">
          {profile.follower_count}{" "}
          {profile.follower_count === 1 ? t.follower : t.followers}
        </span>
        <FollowButton targetId={profile.id} handle={slug} initialState={state} />
        {canEdit ? (
          <Link
            href={isManager ? `/profile/edit?as=${profile.handle}` : "/profile/edit"}
            data-edit-profile
            className="border-2 border-ink bg-ink px-3 py-1 text-caption font-bold uppercase text-paper hover:bg-blue hover:border-blue"
          >
            {isManager ? t.editThisProfile : t.editYourSpace}
          </Link>
        ) : null}
        {state !== "self" && state !== "preview" && state !== "signed-out" ? (
          <>
            <MessageButton targetHandle={slug} />
            <ReportControl
              subjectType="profile"
              subjectId={profile.id}
              backTo={`/u/${slug}`}
              canReportQuality={viewerStamped}
            />
            <form action={blocked ? unblockUser : blockUser}>
              <input type="hidden" name="handle" value={slug} />
              <input type="hidden" name="target_id" value={profile.id} />
              <button
                data-block-button
                className="border-2 border-ink px-3 py-1 text-caption font-bold uppercase hover:bg-red hover:border-red hover:text-paper"
              >
                {blocked ? t.unblock : t.block}
              </button>
            </form>
          </>
        ) : null}
      </div>

      {storeLink ? (
        <a
          href={storeLink.url}
          data-astelier-store
          className="mb-6 inline-flex items-center gap-2 border-2 border-ink bg-yellow px-4 py-2 text-caption font-bold uppercase hover:bg-ink hover:text-paper"
        >
          {t.shopAt} {storeLink.name}
        </a>
      ) : null}

      {isManager ? (
        <p data-manages className="mb-6 border-2 border-ink bg-yellow px-3 py-2 text-caption font-bold uppercase">
          {t.youManage}
        </p>
      ) : null}

      {claim.is_seed && !claim.claimed ? (
        <div data-claimable className="mb-6 border-2 border-ink p-4">
          <p className="text-caption font-bold uppercase">{t.communityProfile}</p>
          <p className="mt-2 text-body">{t.communityBody}</p>
          {claimFlag === "sent" ? (
            <p role="status" className="mt-3 border-2 border-ink px-3 py-2 text-caption font-bold uppercase">
              {t.claimSubmitted}
            </p>
          ) : claimFlag === "error" ? (
            <p role="alert" className="mt-3 border-2 border-red px-3 py-2 text-caption font-bold uppercase text-red">
              {t.claimError}
            </p>
          ) : null}
          {canClaim ? (
            <details className="mt-3">
              <summary className="cursor-pointer border-2 border-ink bg-ink px-3 py-1 text-caption font-bold uppercase text-paper hover:bg-blue hover:border-blue inline-block">
                {t.claimThis}
              </summary>
              <form action={requestClaim} className="mt-3 flex flex-col gap-2">
                <input type="hidden" name="handle" value={slug} />
                <input type="hidden" name="profile_id" value={profile.id} />
                <label htmlFor="claim-message" className="text-caption font-bold uppercase">
                  {t.howVerify}
                </label>
                <textarea
                  id="claim-message"
                  name="message"
                  rows={3}
                  maxLength={1000}
                  className="border-2 border-ink bg-paper px-3 py-2 text-body outline-none focus:border-blue"
                />
                <button className="self-start border-2 border-ink bg-ink px-4 py-1 text-caption font-bold uppercase text-paper hover:bg-blue hover:border-blue">
                  {t.submitClaim}
                </button>
              </form>
            </details>
          ) : !viewerId ? (
            <p className="mt-3 text-caption font-bold uppercase">
              <Link href="/login" className="border-b-2 border-ink hover:text-blue">
                {t.signInToClaim}
              </Link>
            </p>
          ) : null}
        </div>
      ) : null}

      <ProfileCanvas
        profile={{ ...profile, layout }}
        posts={posts}
        events={events}
        jobs={jobs}
        liked={favorites}
        likedRatings={favRatings}
        now={new Date().toISOString()}
        ownerView={viewerId === profile.id}
      />

      {curator ? (
        <section data-curated-section className="mt-8">
          <Window title={t.curatedTitle} accent="blue">
            <p className="mb-4 text-body opacity-70">
              Work {profile.display_name} has reposted as curated.
            </p>
            <CuratedGallery picks={curated} />
          </Window>
        </section>
      ) : null}

      {favorites.length > 0 && !hasLikedBlock ? (
        <section data-favorites-section className="mt-8">
          <Window title={t.favoritesTitle} accent="yellow">
            <p className="mb-4 text-body opacity-70">
              Work {profile.display_name} favorited{viewerId === profile.id ? " — tap the stars to rate" : ""}.
            </p>
            <FavoritesGallery
              posts={favorites}
              ratings={favRatings}
              editable={viewerId === profile.id}
            />
          </Window>
        </section>
      ) : null}
    </div>
  );
}
