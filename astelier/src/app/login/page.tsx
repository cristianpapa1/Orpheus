import { Window } from "@/components/ui/Window";
import { WindowGrid } from "@/components/ui/WindowGrid";
import { Nav } from "@/components/Nav";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getI18n } from "@/lib/i18n/server";
import { signInWithEmail, signInWithGoogle, verifyEmailCode } from "./actions";

export const metadata = { title: "Sign in — Astelier" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; error?: string; email?: string }>;
}) {
  const { sent, error, email } = await searchParams;
  const configured = isSupabaseConfigured();
  const { t: dict } = await getI18n();
  const t = dict.login;
  const errMap: Record<string, string> = {
    unconfigured: t.errUnconfigured,
    email: t.errEmail,
    otp: t.errOtp,
    "rate-limit": t.errRateLimit,
    oauth: t.errOauth,
    auth: t.errAuth,
  };

  return (
    <>
      <Nav signedIn={false} />
      <main id="main" className="mx-auto w-full max-w-4xl grow px-6 py-16">
        <WindowGrid>
          <Window title="Astelier" accent="red" span="col-span-12 md:col-span-7">
            <h1 className="text-display font-bold uppercase">{t.heroTitle}</h1>
            <p className="mt-6 max-w-sm text-body">{t.heroLead}</p>
            <div className="mt-8 flex gap-2" aria-hidden>
              <span className="size-6 bg-red" />
              <span className="size-6 bg-blue" />
              <span className="size-6 bg-yellow" />
            </div>
          </Window>

          <Window title={t.signIn} accent="blue" span="col-span-12 md:col-span-5">
            {sent ? (
              <div className="flex flex-col gap-3">
                <p className="text-body">
                  <strong>{t.checkEmail}</strong> We also sent a 6-digit code
                  {email ? ` to ${email}` : ""}. Tap the link, or enter the code below.
                </p>
                {error === "code" ? (
                  <p className="border-2 border-red p-3 text-caption font-bold uppercase text-red">
                    That code didn&apos;t match — check the email and try again.
                  </p>
                ) : null}
                <form action={verifyEmailCode} className="flex flex-col gap-3">
                  <input type="hidden" name="email" value={email ?? ""} />
                  <label htmlFor="code" className="text-caption font-bold uppercase">
                    Enter your code
                  </label>
                  <input
                    id="code"
                    name="code"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    required
                    placeholder="123456"
                    maxLength={8}
                    className="border-2 border-ink bg-paper px-3 py-2 text-body tracking-[0.4em] outline-none focus:border-blue"
                  />
                  <button
                    type="submit"
                    className="border-2 border-ink bg-ink px-4 py-2 text-caption font-bold uppercase text-paper hover:bg-blue hover:border-blue"
                  >
                    Verify code
                  </button>
                </form>
                <a href="/login" className="text-caption font-bold uppercase underline">
                  Use a different email
                </a>
              </div>
            ) : (
              <>
                {error ? (
                  <p role="alert" className="mb-4 border-2 border-red px-3 py-2 text-caption font-bold uppercase text-red">
                    {errMap[error] ?? t.errGeneric}
                  </p>
                ) : null}

                <form action={signInWithEmail} className="flex flex-col gap-3">
                  <label className="text-caption font-bold uppercase" htmlFor="email">
                    {t.email}
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    disabled={!configured}
                    placeholder="you@example.com"
                    className="border-2 border-ink bg-paper px-3 py-2 text-body outline-none focus:border-blue disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={!configured}
                    className="border-2 border-ink bg-ink px-4 py-2 text-caption font-bold uppercase text-paper hover:bg-blue hover:border-blue disabled:opacity-50"
                  >
                    {t.sendMagicLink}
                  </button>
                </form>

                <div className="my-4 border-t-2 border-ink" />

                <form action={signInWithGoogle}>
                  <button
                    type="submit"
                    disabled={!configured}
                    className="w-full border-2 border-ink px-4 py-2 text-caption font-bold uppercase hover:bg-yellow disabled:opacity-50"
                  >
                    {t.continueGoogle}
                  </button>
                </form>

                {!configured ? (
                  <p className="mt-4 text-caption uppercase opacity-70">{t.previewMode}</p>
                ) : null}
              </>
            )}
          </Window>
        </WindowGrid>
      </main>
    </>
  );
}
