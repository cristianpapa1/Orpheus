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
  isFollowing,
} from "@/lib/profile/queries";
import { getPostsByAuthor } from "@/lib/posts/queries";
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

  const configured = isSupabaseConfigured();
  const viewerId = configured ? await getViewerId() : null;

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
        <h1 className="text-h1 font-bold uppercase">{profile.display_name}</h1>
        {claim.claimed ? (
          <span
            data-verified
            title="Claimed by its owner"
            className="border-2 border-ink bg-ink px-2 py-1 text-caption font-bold uppercase text-paper"
          >
            ✓ Verified
          </span>
        ) : null}
        <span data-follower-count className="text-caption font-bold uppercase">
          {profile.follower_count}{" "}
          {profile.follower_count === 1 ? "follower" : "followers"}
        </span>
        <FollowButton targetId={profile.id} handle={slug} initialState={state} />
        {canEdit ? (
          <Link
            href={isManager ? `/profile/edit?as=${profile.handle}` : "/profile/edit"}
            data-edit-profile
            className="border-2 border-ink bg-ink px-3 py-1 text-caption font-bold uppercase text-paper hover:bg-blue hover:border-blue"
          >
            {isManager ? "Edit this profile" : "Edit your space"}
          </Link>
        ) : null}
        {state !== "self" && state !== "preview" && state !== "signed-out" ? (
          <>
            <MessageButton targetHandle={slug} />
            <ReportControl
              subjectType="profile"
              subjectId={profile.id}
              backTo={`/u/${slug}`}
            />
            <form action={blocked ? unblockUser : blockUser}>
              <input type="hidden" name="handle" value={slug} />
              <input type="hidden" name="target_id" value={profile.id} />
              <button
                data-block-button
                className="border-2 border-ink px-3 py-1 text-caption font-bold uppercase hover:bg-red hover:border-red hover:text-paper"
              >
                {blocked ? "Unblock" : "Block"}
              </button>
            </form>
          </>
        ) : null}
      </div>

      {isManager ? (
        <p data-manages className="mb-6 border-2 border-ink bg-yellow px-3 py-2 text-caption font-bold uppercase">
          You manage this profile.
        </p>
      ) : null}

      {claim.is_seed && !claim.claimed ? (
        <div data-claimable className="mb-6 border-2 border-ink p-4">
          <p className="text-caption font-bold uppercase">Community profile</p>
          <p className="mt-2 text-body">
            This is an unofficial, community-run profile. If you represent{" "}
            {profile.display_name}, you can claim it.
          </p>
          {claimFlag === "sent" ? (
            <p role="status" className="mt-3 border-2 border-ink px-3 py-2 text-caption font-bold uppercase">
              Claim submitted — an admin will review it.
            </p>
          ) : claimFlag === "error" ? (
            <p role="alert" className="mt-3 border-2 border-red px-3 py-2 text-caption font-bold uppercase text-red">
              That didn&apos;t work. Try again.
            </p>
          ) : null}
          {canClaim ? (
            <details className="mt-3">
              <summary className="cursor-pointer border-2 border-ink bg-ink px-3 py-1 text-caption font-bold uppercase text-paper hover:bg-blue hover:border-blue inline-block">
                Claim this profile
              </summary>
              <form action={requestClaim} className="mt-3 flex flex-col gap-2">
                <input type="hidden" name="handle" value={slug} />
                <input type="hidden" name="profile_id" value={profile.id} />
                <label htmlFor="claim-message" className="text-caption font-bold uppercase">
                  How can we verify you? (official email, socials…)
                </label>
                <textarea
                  id="claim-message"
                  name="message"
                  rows={3}
                  maxLength={1000}
                  className="border-2 border-ink bg-paper px-3 py-2 text-body outline-none focus:border-blue"
                />
                <button className="self-start border-2 border-ink bg-ink px-4 py-1 text-caption font-bold uppercase text-paper hover:bg-blue hover:border-blue">
                  Submit claim
                </button>
              </form>
            </details>
          ) : !viewerId ? (
            <p className="mt-3 text-caption font-bold uppercase">
              <Link href="/login" className="border-b-2 border-ink hover:text-blue">
                Sign in
              </Link>{" "}
              to claim this profile.
            </p>
          ) : null}
        </div>
      ) : null}

      <ProfileCanvas
        profile={profile}
        posts={posts}
        events={events}
        jobs={jobs}
        now={new Date().toISOString()}
      />
    </div>
  );
}
