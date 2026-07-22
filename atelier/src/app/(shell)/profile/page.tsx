import Link from "next/link";
import { Window } from "@/components/ui/Window";
import { WindowGrid } from "@/components/ui/WindowGrid";
import {
  getManagedProfiles,
  getOwnProfile,
  getViewerCreatorStatus,
} from "@/lib/profile/queries";
import { isViewerAdmin } from "@/lib/donations/queries";
import { getUnreadCount } from "@/lib/notifications/queries";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { signOut } from "@/app/login/actions";
import {
  getCuratorProgress,
  CURATOR_INSTITUTIONS_REQUIRED,
  CURATOR_QUALITY_FOLLOWS_REQUIRED,
} from "@/lib/curator/eligibility";
import { getFavoritesByProfile } from "@/lib/favorites/queries";
import { getRatingsForPosts } from "@/lib/ratings/queries";
import { getCuratedByProfile } from "@/lib/curations/queries";
import { FavoritesGallery } from "@/components/profile/FavoritesGallery";
import { CuratedGallery } from "@/components/profile/CuratedGallery";
import { getI18n } from "@/lib/i18n/server";
import { getStoreLinkForOwner } from "@/lib/commerce/stores";

const ASTELIER_URL =
  process.env.NEXT_PUBLIC_ASTELIER_URL ?? "https://astelier.aunflaneur.com";

export default async function ProfilePage() {
  const profile = await getOwnProfile();
  const managed = await getManagedProfiles();
  const isAdmin = await isViewerAdmin();
  const unread = await getUnreadCount();
  const configured = isSupabaseConfigured();
  const isCreator = (await getViewerCreatorStatus()) === "approved";
  const { t: dict } = await getI18n();
  const t = dict.profile;
  // Astelier store link: open it if they have one, else a call to create.
  const storeLink = profile ? await getStoreLinkForOwner(profile.id) : null;

  const curatorProgress = profile ? await getCuratorProgress(profile.id) : null;
  const favorites = profile ? await getFavoritesByProfile(profile.id, 12) : [];
  const curated = profile ? await getCuratedByProfile(profile.id, 12) : [];
  const favRatings = profile
    ? await getRatingsForPosts(profile.id, favorites.map((p) => p.id))
    : new Map<string, number>();

  return (
    <WindowGrid>
      <Window title="Your space" accent="yellow" span="col-span-12">
        <p className="text-h2 font-bold uppercase">
          {profile ? profile.display_name : t.buildYourOwn}
        </p>
        {profile?.handle ? (
          <p className="mt-1 text-caption font-bold uppercase">
            @{profile.handle}
          </p>
        ) : null}
        <p className="mt-4 max-w-md text-body">
          {profile?.bio || t.bioPlaceholder}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/profile/edit"
            className="border-2 border-ink bg-ink px-4 py-2 text-caption font-bold uppercase text-paper hover:bg-blue hover:border-blue"
          >
            {t.openEditor}
          </Link>
          <Link
            href="/notifications"
            data-interactions-link
            className="relative border-2 border-ink px-4 py-2 text-caption font-bold uppercase hover:bg-yellow"
          >
            {t.interactions}
            {unread > 0 ? (
              <span
                data-unread
                className="ml-2 inline-block min-w-4 border-2 border-ink bg-red px-1 text-center text-caption font-bold text-paper"
              >
                {unread > 99 ? "99+" : unread}
              </span>
            ) : null}
          </Link>
          {storeLink ? (
            <a
              href={storeLink.url}
              data-astelier-store
              className="border-2 border-ink bg-yellow px-4 py-2 text-caption font-bold uppercase text-ink hover:bg-ink hover:text-paper"
            >
              Your shop on Astelier →
            </a>
          ) : (
            <a
              href={`${ASTELIER_URL}/sell`}
              data-astelier-store-cta
              className="border-2 border-ink px-4 py-2 text-caption font-bold uppercase hover:bg-yellow"
            >
              Open a shop on Astelier →
            </a>
          )}
          {isCreator ? (
            <>
              <Link
                href="/profile/events"
                data-manage-events
                className="border-2 border-ink px-4 py-2 text-caption font-bold uppercase hover:bg-blue hover:border-blue hover:text-paper"
              >
                {t.manageEvents}
              </Link>
              <Link
                href="/profile/jobs"
                data-manage-jobs
                className="border-2 border-ink px-4 py-2 text-caption font-bold uppercase hover:bg-blue hover:border-blue hover:text-paper"
              >
                {t.manageJobs}
              </Link>
            </>
          ) : null}
          <Link
            href="/saved"
            data-saved-link
            className="border-2 border-ink px-4 py-2 text-caption font-bold uppercase hover:bg-blue hover:border-blue hover:text-paper"
          >
            {t.saved}
          </Link>
          <Link
            href="/following"
            data-following-link
            className="border-2 border-ink px-4 py-2 text-caption font-bold uppercase hover:bg-blue hover:border-blue hover:text-paper"
          >
            {t.following}
          </Link>
          <Link
            href="/profile/settings"
            data-profile-settings
            className="border-2 border-ink px-4 py-2 text-caption font-bold uppercase hover:bg-blue hover:border-blue hover:text-paper"
          >
            {t.settings}
          </Link>
          {profile?.handle ? (
            <Link
              href={`/u/${profile.handle}`}
              className="border-2 border-ink px-4 py-2 text-caption font-bold uppercase hover:bg-yellow"
            >
              {t.viewPublic} /u/{profile.handle}
            </Link>
          ) : null}
        </div>
        <form action={signOut} className="mt-6 border-t-2 border-ink pt-4">
          <button
            data-sign-out
            className="border-2 border-red bg-red px-4 py-2 text-caption font-bold uppercase text-paper hover:opacity-80"
          >
            {t.signOut}
          </button>
        </form>
      </Window>

      <Window title={t.eventsJobsTitle} accent="yellow" span="col-span-12">
        <p className="text-body">{t.eventsJobsBody}</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/events?following=1"
            data-events-following
            className="border-2 border-ink bg-ink px-6 py-3 text-body font-bold uppercase text-paper hover:bg-blue hover:border-blue"
          >
            {t.eventsFromFollow}
          </Link>
          <Link
            href="/jobs?following=1"
            data-jobs-following
            className="border-2 border-ink bg-ink px-6 py-3 text-body font-bold uppercase text-paper hover:bg-red hover:border-red"
          >
            {t.jobsFromFollow}
          </Link>
        </div>
        <p className="mt-3 text-caption font-bold uppercase opacity-70">
          {t.orBrowse}{" "}
          <Link href="/events" className="border-b-2 border-ink hover:text-blue">{t.allEvents}</Link>
          {" · "}
          <Link href="/jobs" className="border-b-2 border-ink hover:text-blue">{t.allJobs}</Link>
        </p>
      </Window>

      {managed.length > 0 ? (
        <Window title={t.spacesYouManage} accent="blue" span="col-span-12 md:col-span-5">
          <p className="text-body">{t.spacesYouManageBody}</p>
          <ul data-managed-spaces className="mt-4 flex flex-col gap-2">
            {managed.map((m) => (
              <li key={m.id} className="flex items-baseline justify-between gap-2">
                <Link href={`/u/${m.handle || m.id}`} className="text-body font-bold hover:text-blue">
                  {m.display_name}
                  {m.handle ? ` · @${m.handle}` : ""}
                </Link>
                <Link
                  href={`/profile/edit?as=${m.handle}`}
                  className="border-2 border-ink px-2 py-0.5 text-caption font-bold uppercase hover:bg-blue hover:border-blue hover:text-paper"
                >
                  {t.edit}
                </Link>
              </li>
            ))}
          </ul>
        </Window>
      ) : null}

      {isAdmin ? (
        <Window title="Admin" accent="red" span="col-span-12 md:col-span-5">
          <p className="text-body">
            Moderate content, review reports, and resolve profile claims.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/admin"
              className="border-2 border-ink bg-ink px-4 py-2 text-caption font-bold uppercase text-paper hover:bg-red hover:border-red"
            >
              Admin console →
            </Link>
            <Link
              href="/admin/content"
              className="border-2 border-ink px-4 py-2 text-caption font-bold uppercase hover:bg-yellow"
            >
              Content
            </Link>
            <Link
              href="/admin/reports"
              className="border-2 border-ink px-4 py-2 text-caption font-bold uppercase hover:bg-yellow"
            >
              Reports
            </Link>
            <Link
              href="/admin/claims"
              className="border-2 border-ink px-4 py-2 text-caption font-bold uppercase hover:bg-yellow"
            >
              Claims
            </Link>
          </div>
        </Window>
      ) : null}

      {curatorProgress ? (
        <Window title="Curator" accent="blue" span="col-span-12 md:col-span-7">
          {curatorProgress.isCurator ? (
            <>
              <p data-curator-active className="text-h2 font-bold uppercase">
                ♺ You&apos;re a curator
              </p>
              <p className="mt-3 text-body">
                Your picks carry weight. Use <strong>Act ▾ → Repost as curated</strong>{" "}
                on any maker&apos;s work — it lands in your public Curated shelf and in
                your followers&apos; feeds. Note: curators can&apos;t own an Astelier shop.
              </p>
            </>
          ) : (
            <>
              <p className="text-h2 font-bold uppercase">Become a curator</p>
              <p className="mt-3 text-body">
                Curators repost work as &quot;curated&quot; — it surfaces in their
                followers&apos; feeds and on a public shelf. It unlocks automatically when:
              </p>
              <ul className="mt-4 flex flex-col gap-2">
                <li className="flex items-center justify-between gap-3 border-2 border-ink px-3 py-2">
                  <span className="text-caption font-bold uppercase">
                    Institutions following you back
                  </span>
                  <span className="text-caption font-bold uppercase tabular-nums">
                    {curatorProgress.mutualInstitutions} / {CURATOR_INSTITUTIONS_REQUIRED}
                  </span>
                </li>
                <li className="flex items-center justify-between gap-3 border-2 border-ink px-3 py-2">
                  <span className="text-caption font-bold uppercase">
                    Quality-stamped accounts you follow
                  </span>
                  <span className="text-caption font-bold uppercase tabular-nums">
                    {curatorProgress.qualityFollows} / {CURATOR_QUALITY_FOLLOWS_REQUIRED}
                  </span>
                </li>
              </ul>
            </>
          )}
        </Window>
      ) : null}

      {curatorProgress?.isCurator ? (
        <Window title="Your curated picks" accent="blue" span="col-span-12">
          <CuratedGallery picks={curated} />
        </Window>
      ) : null}

      {favorites.length > 0 ? (
        <Window title={t.yourFavorites} accent="yellow" span="col-span-12">
          <p className="mb-4 text-body opacity-70">{t.favoritesRateHint}</p>
          <FavoritesGallery posts={favorites} ratings={favRatings} editable />
        </Window>
      ) : null}

      <Window title={t.sharing} accent="red" span="col-span-12 md:col-span-5">
        <p className="text-body">{t.sharingBody}</p>
        {!configured ? (
          <p className="mt-3 text-caption font-bold uppercase">
            Preview mode: edits save to this browser. Try the demo spaces —{" "}
            <Link href="/u/ines" className="border-b-2 border-ink hover:text-blue">
              /u/ines
            </Link>{" "}
            ·{" "}
            <Link href="/u/theo" className="border-b-2 border-ink hover:text-blue">
              /u/theo
            </Link>
          </p>
        ) : null}
      </Window>
    </WindowGrid>
  );
}
