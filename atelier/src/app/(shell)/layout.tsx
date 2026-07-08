import { Nav } from "@/components/Nav";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createServerSupabase } from "@/lib/supabase/server";

export default async function ShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerSupabase();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;

  return (
    <div className="flex min-h-dvh flex-col">
      <Nav email={user?.email ?? null} />
      {!isSupabaseConfigured() ? (
        <p
          data-setup-notice
          className="border-b-2 border-ink bg-yellow px-6 py-2 text-center text-caption font-bold uppercase"
        >
          Preview mode — add Supabase keys to .env.local to enable sign-in
        </p>
      ) : null}
      <main className="mx-auto w-full max-w-6xl grow px-6 py-10">
        {children}
      </main>
      <footer className="border-t-2 border-ink px-6 py-4 text-center text-caption uppercase">
        Atelier — funded by donations, never by ads
      </footer>
    </div>
  );
}
