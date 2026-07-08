import Link from "next/link";
import { Window } from "@/components/ui/Window";
import { WindowGrid } from "@/components/ui/WindowGrid";
import { getGroups } from "@/lib/groups/queries";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createGroup } from "./actions";

const ERRORS: Record<string, string> = {
  unavailable: "Preview mode — creating groups needs Supabase configured.",
  name: "Group names are 3–60 characters.",
  taken: "That group name is taken.",
  create: "Couldn't create the group. Try again.",
};

export default async function GroupsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const groups = await getGroups();
  const configured = isSupabaseConfigured();

  return (
    <div>
      <h1 className="mb-6 text-h1 font-bold uppercase">Groups</h1>
      <WindowGrid>
        <Window title="Start a group" accent="red" span="col-span-12 md:col-span-4">
          {error ? (
            <p role="alert" className="mb-3 border-2 border-red px-3 py-2 text-caption font-bold uppercase text-red">
              {ERRORS[error] ?? "Something went wrong."}
            </p>
          ) : null}
          <form action={createGroup} data-create-group className="flex flex-col gap-3">
            <label htmlFor="name" className="text-caption font-bold uppercase">
              Name
            </label>
            <input
              id="name"
              name="name"
              required
              minLength={3}
              maxLength={60}
              disabled={!configured}
              className="border-2 border-ink bg-paper px-3 py-2 text-body outline-none focus:border-blue disabled:opacity-50"
            />
            <label htmlFor="description" className="text-caption font-bold uppercase">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              maxLength={600}
              disabled={!configured}
              className="border-2 border-ink bg-paper px-3 py-2 text-body outline-none focus:border-blue disabled:opacity-50"
            />
            <label className="flex items-center gap-2 text-caption font-bold uppercase">
              <input type="checkbox" name="is_private" disabled={!configured} className="size-4 accent-ink" />
              Private feed (members share; others must be admitted)
            </label>
            <button
              type="submit"
              disabled={!configured}
              className="self-start border-2 border-ink bg-ink px-4 py-2 text-caption font-bold uppercase text-paper hover:bg-blue hover:border-blue disabled:opacity-50"
            >
              Create group
            </button>
            {!configured ? (
              <p className="text-caption uppercase opacity-70">
                Preview mode — browse the demo groups meanwhile
              </p>
            ) : null}
          </form>
        </Window>

        {groups.map((group, i) => (
          <div key={group.id} data-group={group.slug} className="col-span-12 flex flex-col md:col-span-4">
            <Window
              title={group.is_private ? "Private group" : "Group"}
              accent={(["blue", "yellow", "red"] as const)[i % 3]}
              className="h-full"
            >
              <Link href={`/g/${group.slug}`} className="text-h2 font-bold uppercase hover:text-blue">
                {group.name}
              </Link>
              <p className="mt-2 text-body">{group.description}</p>
              <p className="mt-4 text-caption font-bold uppercase">
                {group.member_count} members · {group.follower_count} followers
              </p>
              <Link
                href={`/g/${group.slug}`}
                className="mt-4 inline-block border-2 border-ink px-3 py-1 text-caption font-bold uppercase hover:bg-yellow"
              >
                Open group →
              </Link>
            </Window>
          </div>
        ))}
      </WindowGrid>
    </div>
  );
}
