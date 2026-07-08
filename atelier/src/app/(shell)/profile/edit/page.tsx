import { redirect } from "next/navigation";
import { ProfileEditor } from "@/components/profile/ProfileEditor";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getOwnProfile } from "@/lib/profile/queries";

export const metadata = { title: "Edit your space — Atelier" };

export default async function ProfileEditPage() {
  const configured = isSupabaseConfigured();
  const profile = await getOwnProfile();
  if (!profile) redirect("/login");

  return (
    <div>
      <h1 className="mb-6 text-h1 font-bold uppercase">Build your space</h1>
      <ProfileEditor
        initialIdentity={{
          display_name: profile.display_name,
          handle: profile.handle,
          bio: profile.bio,
          links: profile.links,
        }}
        initialLayout={profile.layout}
        canPersist={configured}
      />
    </div>
  );
}
