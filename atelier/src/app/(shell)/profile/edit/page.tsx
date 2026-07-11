import { redirect } from "next/navigation";
import type { PublicProfile } from "@atelier/core/profile/types";
import { ProfileEditor } from "@/components/profile/ProfileEditor";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  getOwnProfile,
  getProfileByHandle,
  getProfileClaimState,
  getViewerId,
} from "@/lib/profile/queries";

export const metadata = { title: "Edit your space — Atelier" };

export default async function ProfileEditPage({
  searchParams,
}: {
  searchParams: Promise<{ as?: string }>;
}) {
  const configured = isSupabaseConfigured();
  const { as } = await searchParams;

  let profile: PublicProfile | null = null;
  let targetId: string | undefined;
  let title = "Build your space";

  if (as && configured) {
    // Editing a profile by handle — allowed only for the owner or a manager.
    const target = await getProfileByHandle(as);
    if (!target) redirect("/profile");
    const viewerId = await getViewerId();
    if (!viewerId) redirect("/login");
    if (target.id !== viewerId) {
      const claim = await getProfileClaimState(target.id);
      if (claim.managed_by !== viewerId) redirect("/profile");
      targetId = target.id;
      title = `Edit ${target.display_name}`;
    }
    profile = target;
  } else {
    profile = await getOwnProfile();
  }
  if (!profile) redirect("/login");

  return (
    <div>
      <h1 className="mb-6 text-h1 font-bold uppercase">{title}</h1>
      <ProfileEditor
        initialIdentity={{
          display_name: profile.display_name,
          handle: profile.handle,
          bio: profile.bio,
          contacts: profile.contacts,
          accent: profile.accent,
          school: profile.school,
          account_type: profile.account_type,
          institution_kind: profile.institution_kind,
          interests: profile.interests,
        }}
        initialLayout={profile.layout}
        canPersist={configured}
        targetId={targetId}
      />
    </div>
  );
}
