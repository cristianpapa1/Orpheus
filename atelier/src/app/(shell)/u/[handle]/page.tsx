import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FollowButton, type FollowState } from "@/components/profile/FollowButton";
import { ProfileCanvas } from "@/components/profile/ProfileCanvas";
import {
  getProfileByHandle,
  getViewerId,
  isFollowing,
} from "@/lib/profile/queries";
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
      </div>
      <ProfileCanvas profile={profile} />
    </div>
  );
}
