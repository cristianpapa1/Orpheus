import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Window } from "@/components/ui/Window";
import { WindowGrid } from "@/components/ui/WindowGrid";
import { getGroupBySlug, getViewerGroupRelation } from "@/lib/groups/queries";
import { getViewerId } from "@/lib/profile/queries";
import {
  getGroupThread,
  discussionAccess,
} from "@/lib/groups/discussion";
import { GroupThreadView } from "@/components/groups/GroupThreadView";

interface Props {
  params: Promise<{ slug: string; id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, id } = await params;
  const group = await getGroupBySlug(slug);
  if (!group) return { title: "Not found — Atelier" };
  const detail = await getGroupThread(group.id, id);
  const subject = detail?.thread.title || detail?.thread.body.slice(0, 60);
  return {
    title: subject ? `${subject} — ${group.name}` : `${group.name} — Atelier`,
  };
}

export default async function ThreadPage({ params }: Props) {
  const { slug, id } = await params;
  const group = await getGroupBySlug(slug);
  if (!group) notFound();

  const relation = await getViewerGroupRelation(group.id);
  const access = discussionAccess(group.discussion_read, group.discussion_mode, relation);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Link
          href={`/g/${group.slug}`}
          className="border-2 border-ink px-3 py-1 text-caption font-bold uppercase hover:bg-yellow"
        >
          ← {group.name}
        </Link>
        <h1 className="text-h2 font-bold uppercase opacity-70">Discussion</h1>
      </div>

      <WindowGrid>
        {!access.canRead ? (
          <Window title="Members only" accent="yellow" span="col-span-12 md:col-span-6">
            <p className="text-body opacity-70">
              This group&apos;s discussion is for members. Join to read and post.
            </p>
          </Window>
        ) : (
          <ThreadWindow
            groupId={group.id}
            slug={group.slug}
            threadId={id}
            relation={relation}
            access={access}
          />
        )}
      </WindowGrid>
    </div>
  );
}

async function ThreadWindow({
  groupId,
  slug,
  threadId,
  relation,
  access,
}: {
  groupId: string;
  slug: string;
  threadId: string;
  relation: Awaited<ReturnType<typeof getViewerGroupRelation>>;
  access: ReturnType<typeof discussionAccess>;
}) {
  const [detail, viewerId] = await Promise.all([
    getGroupThread(groupId, threadId),
    getViewerId(),
  ]);
  if (!detail) notFound();

  return (
    <Window title="Discussion" accent="blue" span="col-span-12 md:col-span-8">
      <GroupThreadView
        detail={detail}
        access={access}
        groupId={groupId}
        slug={slug}
        viewerId={viewerId}
        isOwner={relation === "owner"}
      />
    </Window>
  );
}
