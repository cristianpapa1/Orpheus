import { Window } from "@/components/ui/Window";
import { WindowGrid } from "@/components/ui/WindowGrid";

export default function GroupsPage() {
  return (
    <WindowGrid>
      <Window title="Groups" accent="blue" span="col-span-12 md:col-span-5">
        <p className="text-h2 font-bold uppercase">No groups yet.</p>
        <p className="mt-4 text-body">
          Creators form groups by inviting each other. Each group has its own
          feed, woven back into your main feed.
        </p>
      </Window>
      <Window title="Coming in phase 4" accent="yellow" span="col-span-12 md:col-span-7">
        <p className="text-body">
          Invite-based membership, request-to-join, group feeds, and the
          &ldquo;also in [group]&rdquo; marker on cross-posted work.
        </p>
      </Window>
    </WindowGrid>
  );
}
