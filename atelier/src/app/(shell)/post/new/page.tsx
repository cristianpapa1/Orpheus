import { Window } from "@/components/ui/Window";
import { WindowGrid } from "@/components/ui/WindowGrid";
import { PostComposer } from "@/components/posts/PostComposer";
import { CreatorGate } from "@/components/creator/CreatorGate";
import { getOwnMemberGroups } from "@/lib/groups/queries";
import { getMutualFollows, getViewerCreatorStatus } from "@/lib/profile/queries";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata = { title: "New post — Atelier" };

export default async function NewPostPage({
  searchParams,
}: {
  searchParams: Promise<{ caption?: string; checkout_url?: string }>;
}) {
  const creatorStatus = await getViewerCreatorStatus();
  // Only approved creators publish — the DB (0026) enforces this too.
  if (creatorStatus !== "approved") {
    return (
      <WindowGrid>
        <Window title="Publish work" accent="yellow" span="col-span-12 md:col-span-7">
          <CreatorGate status={creatorStatus} action="publish work" />
        </Window>
      </WindowGrid>
    );
  }

  const [{ caption, checkout_url }, memberGroups, mutuals] = await Promise.all([
    searchParams,
    getOwnMemberGroups(),
    getMutualFollows(),
  ]);
  return (
    <WindowGrid>
      <Window title="Publish work" accent="red" span="col-span-12 md:col-span-8">
        <PostComposer
          canPublish={isSupabaseConfigured()}
          memberGroups={memberGroups}
          mutuals={mutuals}
          initialCaption={caption?.slice(0, 200)}
          initialCheckoutUrl={checkout_url?.slice(0, 300)}
        />
      </Window>
      <Window title="House rules" accent="blue" span="col-span-12 md:col-span-4">
        <p className="text-body">
          Your work reaches everyone who follows you — in order, every time.
          Nothing you can buy changes that.
        </p>
      </Window>
    </WindowGrid>
  );
}
