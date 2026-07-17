import { Window } from "@/components/ui/Window";
import { WindowGrid } from "@/components/ui/WindowGrid";
import { getOwnProfile } from "@/lib/profile/queries";
import { getI18n } from "@/lib/i18n/server";
import { LanguagePicker } from "@/components/i18n/LanguagePicker";
import { redirect } from "next/navigation";
import Link from "next/link";

export const metadata = { title: "Settings — Atelier" };

export default async function ProfileSettingsPage() {
  const profile = await getOwnProfile();
  if (!profile) redirect("/login");
  const { locale, t } = await getI18n();

  return (
    <div>
      <h1 className="mb-6 text-h1 font-bold uppercase">{t.settings.title}</h1>

      <WindowGrid>
        <Window title={t.settings.languageTitle} accent="yellow" span="col-span-12 md:col-span-8">
          <p className="mb-4 text-body">{t.settings.languageHint}</p>
          <LanguagePicker current={locale} />
        </Window>

        <Window title={t.settings.manageTitle} accent="blue" span="col-span-12 md:col-span-8">
          <ul className="flex flex-col gap-3">
            <li>
              <Link href="/profile/edit" className="border-b-2 border-ink text-body font-bold hover:text-blue">
                {t.settings.layoutEditor} →
              </Link>
            </li>
            <li>
              <Link href="/profile/events" className="border-b-2 border-ink text-body font-bold hover:text-blue">
                {t.settings.yourEvents} →
              </Link>
            </li>
            <li>
              <Link href="/profile/jobs" className="border-b-2 border-ink text-body font-bold hover:text-blue">
                {t.settings.yourJobs} →
              </Link>
            </li>
          </ul>
        </Window>
      </WindowGrid>
    </div>
  );
}
