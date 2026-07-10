import { Window } from "@/components/ui/Window";
import { WindowGrid } from "@/components/ui/WindowGrid";
import {
  SCHOOLS,
  SCHOOL_FIGURE,
  SCHOOL_LABEL,
} from "@/lib/design/schools";
import { getOwnProfile } from "@/lib/profile/queries";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { redirect } from "next/navigation";
import Link from "next/link";
import { saveAppearance } from "../actions";

export const metadata = { title: "Settings — Atelier" };

const ACCENTS = [
  { value: "red", cls: "bg-red" },
  { value: "blue", cls: "bg-blue" },
  { value: "yellow", cls: "bg-yellow" },
] as const;

export default async function ProfileSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const { saved, error } = await searchParams;
  const configured = isSupabaseConfigured();
  const profile = await getOwnProfile();
  if (!profile) redirect("/login");

  return (
    <div>
      <h1 className="mb-6 text-h1 font-bold uppercase">Settings</h1>

      {saved ? (
        <p role="status" className="mb-4 border-2 border-ink px-3 py-2 text-caption font-bold uppercase">
          Saved — your space now converges to the new look.
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="mb-4 border-2 border-red px-3 py-2 text-caption font-bold uppercase text-red">
          {error === "unavailable"
            ? "Preview mode — settings need Supabase configured."
            : "That didn't save. Try again."}
        </p>
      ) : null}

      <WindowGrid>
        <Window title="Appearance" accent={profile.accent} span="col-span-12 md:col-span-8">
          <form action={saveAppearance} data-appearance-form className="flex flex-col gap-5">
            <fieldset className="flex flex-col gap-3">
              <legend className="text-caption font-bold uppercase">
                Artistic school — what your space converges to
              </legend>
              <div className="flex flex-col gap-2">
                {SCHOOLS.map((s) => (
                  <label
                    key={s}
                    data-school-choice={s}
                    className="flex cursor-pointer items-baseline gap-3 border-2 border-ink px-3 py-2 has-checked:bg-ink has-checked:text-paper"
                  >
                    <input
                      type="radio"
                      name="school"
                      value={s}
                      defaultChecked={profile.school === s}
                      disabled={!configured}
                      className="accent-ink"
                    />
                    <span className="text-body font-bold uppercase">{SCHOOL_LABEL[s]}</span>
                    <span className="text-caption uppercase opacity-70">
                      {SCHOOL_FIGURE[s]}
                    </span>
                  </label>
                ))}
              </div>
              <p className="text-caption uppercase opacity-70">
                Preview any school on the{" "}
                <Link href="/design" className="border-b-2 border-current font-bold">
                  styleguide
                </Link>{" "}
                before committing
              </p>
            </fieldset>

            <fieldset className="flex flex-col gap-3">
              <legend className="text-caption font-bold uppercase">Accent</legend>
              <div className="flex gap-3">
                {ACCENTS.map((a) => (
                  <label key={a.value} data-accent-choice={a.value} className="cursor-pointer">
                    <input
                      type="radio"
                      name="accent"
                      value={a.value}
                      defaultChecked={profile.accent === a.value}
                      disabled={!configured}
                      className="peer sr-only"
                    />
                    <span
                      aria-label={`${a.value} accent`}
                      className={`block size-10 border-2 border-ink/30 ${a.cls} peer-checked:border-ink peer-checked:ring-2 peer-checked:ring-ink peer-checked:ring-offset-2`}
                    />
                  </label>
                ))}
              </div>
            </fieldset>

            <button
              type="submit"
              disabled={!configured}
              className="self-start border-2 border-ink bg-ink px-6 py-2 text-caption font-bold uppercase text-paper hover:bg-blue hover:border-blue disabled:opacity-50"
            >
              Save appearance
            </button>
            {!configured ? (
              <p data-setup-notice className="text-caption uppercase opacity-70">
                Preview mode — connect Supabase to persist settings
              </p>
            ) : null}
          </form>
        </Window>

        <Window title="Everything else" accent="blue" span="col-span-12 md:col-span-4">
          <ul className="flex flex-col gap-3">
            <li>
              <Link href="/profile/edit" className="border-b-2 border-ink text-body font-bold hover:text-blue">
                Layout & identity editor →
              </Link>
            </li>
            <li>
              <Link href="/profile/events" className="border-b-2 border-ink text-body font-bold hover:text-blue">
                Your events →
              </Link>
            </li>
            <li>
              <Link href="/profile/jobs" className="border-b-2 border-ink text-body font-bold hover:text-blue">
                Your job posts →
              </Link>
            </li>
          </ul>
        </Window>
      </WindowGrid>
    </div>
  );
}
