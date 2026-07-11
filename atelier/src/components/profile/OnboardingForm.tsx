"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  INSTITUTION_KINDS,
  INSTITUTION_KIND_LABEL,
  INTEREST_OPTIONS,
  type AccountType,
  type InstitutionKind,
} from "@atelier/core/profile/types";
import {
  completeOnboarding,
  type OnboardingInput,
} from "@/app/onboarding/actions";

interface Props {
  initial: {
    display_name: string;
    handle: string;
    account_type: AccountType;
    institution_kind: InstitutionKind | null;
    interests: string[];
  };
}

const DISCIPLINES = INTEREST_OPTIONS.filter((o) => o.group === "Discipline");
const MOVEMENTS = INTEREST_OPTIONS.filter((o) => o.group === "Movement");

export function OnboardingForm({ initial }: Props) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(initial.display_name);
  const [handle, setHandle] = useState(initial.handle);
  const [accountType, setAccountType] = useState<AccountType>(
    initial.account_type,
  );
  const [institutionKind, setInstitutionKind] = useState<InstitutionKind | "">(
    initial.institution_kind ?? "",
  );
  const [interests, setInterests] = useState<string[]>(initial.interests);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const toggleInterest = (value: string) =>
    setInterests((cur) =>
      cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value],
    );

  const submit = () => {
    setError(null);
    const payload: OnboardingInput = {
      display_name: displayName,
      handle,
      account_type: accountType,
      institution_kind: accountType === "institution" ? institutionKind || null : null,
      interests,
    };
    startTransition(async () => {
      const result = await completeOnboarding(payload);
      if (result.ok) router.push("/feed");
      else setError(result.error ?? "Something went wrong.");
    });
  };

  const chip = (active: boolean) =>
    `border-2 px-3 py-1 text-caption font-bold uppercase ${
      active ? "border-ink bg-ink text-paper" : "border-ink hover:bg-yellow"
    }`;

  return (
    <div className="flex flex-col gap-6">
      {/* Identity */}
      <section className="flex flex-col gap-3">
        <label htmlFor="display_name" className="text-caption font-bold uppercase">
          Your public name
        </label>
        <input
          id="display_name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          maxLength={80}
          placeholder="How your name shows on your space"
          className="border-2 border-ink bg-paper px-3 py-2 text-body outline-none focus:border-blue"
        />

        <label htmlFor="handle" className="text-caption font-bold uppercase">
          Handle
        </label>
        <div className="flex items-center gap-2">
          <span className="text-body font-bold">@</span>
          <input
            id="handle"
            value={handle}
            onChange={(e) => setHandle(e.target.value.toLowerCase())}
            maxLength={30}
            placeholder="yourname"
            className="grow border-2 border-ink bg-paper px-3 py-2 text-body outline-none focus:border-blue"
          />
        </div>
        <p className="text-caption uppercase opacity-70">
          3–30 chars: lowercase letters, numbers, underscore. This is your URL:
          /u/{handle || "yourname"}
        </p>
      </section>

      {/* Account type */}
      <section className="flex flex-col gap-3">
        <p className="text-caption font-bold uppercase">What is this space?</p>
        <div className="flex flex-wrap gap-2" data-account-type={accountType}>
          {(
            [
              ["individual", "A person"],
              ["institution", "An institution"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              data-account-option={value}
              onClick={() => setAccountType(value)}
              className={chip(accountType === value)}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="text-caption uppercase opacity-70">
          Institutions are museums, galleries, publishers, journals, labels,
          theaters, festivals, podcasts, schools — profiles with more reach.
        </p>
        {accountType === "institution" ? (
          <>
            <label htmlFor="institution_kind" className="text-caption font-bold uppercase">
              Kind of institution
            </label>
            <select
              id="institution_kind"
              value={institutionKind}
              onChange={(e) =>
                setInstitutionKind(e.target.value as InstitutionKind | "")
              }
              className="border-2 border-ink bg-paper px-3 py-2 text-body outline-none focus:border-blue"
            >
              <option value="" disabled>
                Pick one…
              </option>
              {INSTITUTION_KINDS.map((k) => (
                <option key={k} value={k}>
                  {INSTITUTION_KIND_LABEL[k]}
                </option>
              ))}
            </select>
          </>
        ) : null}
      </section>

      {/* Interests */}
      <section className="flex flex-col gap-3">
        <p className="text-caption font-bold uppercase">
          What are you into? (helps us find your groups)
        </p>
        <p className="text-caption uppercase opacity-70">Disciplines</p>
        <div className="flex flex-wrap gap-2" data-interests-disciplines>
          {DISCIPLINES.map((o) => (
            <button
              key={o.value}
              type="button"
              data-interest={o.value}
              onClick={() => toggleInterest(o.value)}
              className={chip(interests.includes(o.value))}
            >
              {o.label}
            </button>
          ))}
        </div>
        <p className="text-caption uppercase opacity-70">Movements</p>
        <div className="flex flex-wrap gap-2" data-interests-movements>
          {MOVEMENTS.map((o) => (
            <button
              key={o.value}
              type="button"
              data-interest={o.value}
              onClick={() => toggleInterest(o.value)}
              className={chip(interests.includes(o.value))}
            >
              {o.label}
            </button>
          ))}
        </div>
      </section>

      {error ? (
        <p role="alert" className="border-2 border-red px-3 py-2 text-caption font-bold uppercase text-red">
          {error}
        </p>
      ) : null}

      <button
        type="button"
        onClick={submit}
        disabled={pending}
        data-onboarding-submit
        className="self-start border-2 border-ink bg-ink px-6 py-2 text-caption font-bold uppercase text-paper hover:bg-blue hover:border-blue disabled:opacity-50"
      >
        {pending ? "Saving…" : "Enter the atelier →"}
      </button>
    </div>
  );
}
