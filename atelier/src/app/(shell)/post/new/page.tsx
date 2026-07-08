import { Window } from "@/components/ui/Window";
import { WindowGrid } from "@/components/ui/WindowGrid";
import { PostComposer } from "@/components/posts/PostComposer";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata = { title: "New post — Atelier" };

export default function NewPostPage() {
  return (
    <WindowGrid>
      <Window title="Publish work" accent="red" span="col-span-12 md:col-span-8">
        <PostComposer canPublish={isSupabaseConfigured()} />
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
