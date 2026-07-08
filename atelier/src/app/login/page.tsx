import { Window } from "@/components/ui/Window";
import { WindowGrid } from "@/components/ui/WindowGrid";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { signInWithEmail, signInWithGoogle } from "./actions";

const ERRORS: Record<string, string> = {
  unconfigured: "Sign-in is unavailable until Supabase is configured.",
  email: "Enter your email address to receive a sign-in link.",
  otp: "We couldn't send the link. Check the address and try again.",
  oauth: "Google sign-in failed. Try again or use email.",
  auth: "That sign-in link expired or was invalid. Request a fresh one.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; error?: string }>;
}) {
  const { sent, error } = await searchParams;
  const configured = isSupabaseConfigured();

  return (
    <main className="mx-auto w-full max-w-4xl grow px-6 py-16">
      <WindowGrid>
        <Window title="Atelier" accent="red" span="col-span-12 md:col-span-7">
          <h1 className="text-display font-bold uppercase">
            A place
            <br />
            for makers.
          </h1>
          <p className="mt-6 max-w-sm text-body">
            Art, handmade, photography, music. No ads, no pay-to-be-seen, no
            sellers — a community funded by the people in it.
          </p>
          <div className="mt-8 flex gap-2" aria-hidden>
            <span className="size-6 bg-red" />
            <span className="size-6 bg-blue" />
            <span className="size-6 bg-yellow" />
          </div>
        </Window>

        <Window title="Sign in" accent="blue" span="col-span-12 md:col-span-5">
          {!configured ? (
            <div data-setup-notice>
              <p className="text-body font-bold">Setup required</p>
              <p className="mt-2 text-body">
                Copy <code>.env.example</code> to <code>.env.local</code> and
                add your Supabase project URL and anon key to enable sign-in.
                The shell runs in preview mode meanwhile.
              </p>
              <a
                href="/feed"
                className="mt-6 inline-block border-2 border-ink px-4 py-2 text-caption font-bold uppercase"
              >
                Explore the shell →
              </a>
            </div>
          ) : sent ? (
            <p className="text-body">
              <strong>Check your inbox.</strong> We sent you a sign-in link.
            </p>
          ) : (
            <>
              {error ? (
                <p className="mb-4 border-2 border-red p-3 text-caption font-bold uppercase text-red">
                  {ERRORS[error] ?? "Something went wrong. Try again."}
                </p>
              ) : null}
              <form action={signInWithEmail} className="flex flex-col gap-3">
                <label
                  htmlFor="email"
                  className="text-caption font-bold uppercase"
                >
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="you@example.com"
                  className="border-2 border-ink bg-paper px-3 py-2 text-body outline-none focus:border-blue"
                />
                <button
                  type="submit"
                  className="mt-2 border-2 border-ink bg-ink px-4 py-2 text-caption font-bold uppercase text-paper hover:bg-blue hover:border-blue"
                >
                  Send magic link
                </button>
              </form>
              <div className="my-5 border-t-2 border-ink" />
              <form action={signInWithGoogle}>
                <button
                  type="submit"
                  className="w-full border-2 border-ink px-4 py-2 text-caption font-bold uppercase hover:bg-yellow"
                >
                  Continue with Google
                </button>
              </form>
            </>
          )}
        </Window>
      </WindowGrid>
    </main>
  );
}
