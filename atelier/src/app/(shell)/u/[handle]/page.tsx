import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FollowButton, type FollowState } from "@/components/profile/FollowButton";
import { MessageButton } from "@/components/chat/MessageButton";
import { ProfileCanvas } from "@/components/profile/ProfileCanvas";
import {
  getProfileByHandle,
  getViewerId,
  isFollowing,
} from "@/lib/profile/queries";
import { getPostsByAuthor } from "@/lib/posts/queries";
import { getEventsByProfile } from "@/lib/events/queries";
import { getJobsByProfile } from "@/lib/jobs/queries";
import { ReportControl } from "@/components/moderation/ReportControl";
import { blockUser, unblockUser } from "@/lib/moderation/actions";
import { isBlocked } from "@/lib/moderation/queries";
import { isSupabaseConfigured } from "@/lib/supabase/config";

interface Props {
  params: Promise<{ handle: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params;
  const profile = await getProfileByHandle(handle);
  if (!profile) return { title: "Not found — Atelier" };
  return {
    title: `${profile.display_name} — Atelier`,
    description: profile.bio || `@${profile.handle} on Atelier`,
  };
}

export default async function PublicProfilePage({ params }: Props) {
  const { handle } = await params;
  const profile = await getProfileByHandle(handle);
  if (!profile) notFound();

  const posts = await getPostsByAuthor(profile.id, 6);
  const events = await getEventsByProfile(profile.id);
  const jobs = await getJobsByProfile(profile.id);
  const blocked = await isBlocked(profile.id);

  let state: FollowState;
  if (!isSupabaseConfigured()) {
    state = "preview";
  } else {
    const viewerId = await getViewerId();
    if (!viewerId) state = "signed-out";
    else if (viewerId === profile.id) state = "self";
    else state = (await isFollowing(profile.id)) ? "following" : "can-follow";
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <h1 className="text-h1 font-bold uppercase">{profile.display_name}</h1>
        <span data-follower-count className="text-caption font-bold uppercase">
          {profile.follower_count}{" "}
          {profile.follower_count === 1 ? "follower" : "followers"}
        </span>
        <FollowButton
          targetId={profile.id}
          handle={profile.handle}
          initialState={state}
        />
        {state !== "self" && state !== "preview" && state !== "signed-out" ? (
          <>
            <MessageButton targetHandle={profile.handle} />
            <ReportControl
              subjectType="profile"
              subjectId={profile.id}
              backTo={`/u/${profile.handle}`}
            />
            <form action={blocked ? unblockUser : blockUser}>
              <input type="hidden" name="handle" value={profile.handle} />
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
