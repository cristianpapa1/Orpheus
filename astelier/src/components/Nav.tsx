import Link from "next/link";
import { signOut } from "@/app/login/actions";
import { getI18n } from "@/lib/i18n/server";
import { LanguagePicker } from "@/components/LanguagePicker";

const ATELIER_URL = "https://atelier.aunflaneur.com";

export async function Nav({ signedIn }: { signedIn: boolean }) {
  const { locale, t } = await getI18n();
  const n = t.nav;
  return (
    <header className="border-b-2 border-ink bg-paper">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex items-center gap-1" aria-hidden>
            <span className="size-3 bg-red" />
            <span className="size-3 bg-blue [clip-path:polygon(50%_0%,100%_100%,0%_100%)]" />
            <span className="size-3 rounded-full bg-yellow" />
          </span>
          <span className="text-h2 font-bold uppercase tracking-tight">Astelier</span>
        </Link>

        <nav aria-label="Discover" className="hidden items-center gap-4 md:flex">
          <Link href="/browse" className="text-caption font-bold uppercase hover:text-blue">
            {n.browse}
          </Link>
          <form action="/search">
            <input
              name="q"
              placeholder={n.searchPlaceholder}
              aria-label={n.searchPlaceholder}
              className="w-28 border-2 border-ink bg-paper px-2 py-1 text-caption uppercase outline-none transition-all focus:w-44 focus:border-blue"
            />
          </form>
        </nav>

        <div className="flex items-center gap-3">
          <LanguagePicker current={locale} />
          <a
            href={ATELIER_URL}
            className="text-caption font-bold uppercase hover:text-blue"
          >
            {n.backToAtelier}
          </a>
          {signedIn ? (
            <form action={signOut}>
              <button className="border-2 border-ink px-3 py-1 text-caption font-bold uppercase hover:bg-red hover:border-red hover:text-paper">
                {n.signOut}
              </button>
            </form>
          ) : (
            <Link
              href="/login"
              className="border-2 border-ink px-3 py-1 text-caption font-bold uppercase hover:bg-blue hover:border-blue hover:text-paper"
            >
              {n.signIn}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
