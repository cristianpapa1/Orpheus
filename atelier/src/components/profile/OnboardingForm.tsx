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
import { useT } from "@/lib/i18n/context";

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

export function OnboardingForm({ initial }: Props) {
  const t = useT().onboarding;
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
  const [wantsCreator, setWantsCreator] = useState(false);
  const [creatorStatement, setCreatorStatement] = useState("");
  const [creatorLinks, setCreatorLinks] = useState("");
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
      wants_creator: wantsCreator,
      creator_statement: wantsCreator ? creatorStatement : "",
      creator_links: wantsCreator ? creatorLinks.split("\n") : [],
    };
    startTransition(async () => {
      const result = await completeOnboarding(payload);
      if (result.ok) router.push("/feed");
      else setError(result.error ?? t.somethingWrong);
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
          {t.publicName}
        </label>
        <input
          id="display_name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          maxLength={80}
          placeholder={t.publicNamePlaceholder}
          className="border-2 border-ink bg-paper px-3 py-2 text-body outline-none focus:border-blue"
        />

        <label htmlFor="handle" className="text-caption font-bold uppercase">
          {t.handle}
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
          {t.handleHint} /u/{handle || "yourname"}
        </p>
      </section>

      {/* Account type */}
      <section className="flex flex-col gap-3">
        <p className="text-caption font-bold uppercase">{t.spaceQuestion}</p>
        <div className="flex flex-wrap gap-2" data-account-type={accountType}>
          {(["individual", "institution"] as const).map((value) => (
            <button
              key={value}
              type="button"
              data-account-option={value}
              onClick={() => setAccountType(value)}
              className={chip(accountType === value)}
            >
              {value === "individual" ? t.aPerson : t.anInstitution}
            </button>
          ))}
        </div>
        <p className="text-caption uppercase opacity-70">{t.institutionHint}</p>
        {accountType === "institution" ? (
          <>
            <label htmlFor="institution_kind" className="text-caption font-bold uppercase">
              {t.institutionKind}
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
                {t.pickOne}
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
        <p className="text-caption font-bold uppercase">{t.interestsQuestion}</p>
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
      </section>

      {/* Member vs creator */}
      <section className="flex flex-col gap-3">
        <p className="text-caption font-bold uppercase">{t.useQuestion}</p>
        <div className="flex flex-wrap gap-2" data-use-mode={wantsCreator ? "creator" : "member"}>
          <button
            type="button"
            data-use-option="member"
            onClick={() => setWantsCreator(false)}
            className={chip(!wantsCreator)}
          >
            {t.loveArt}
          </button>
          <button
            type="button"
            data-use-option="creator"
            onClick={() => setWantsCreator(true)}
            className={chip(wantsCreator)}
          >
            {t.imCreator}
          </button>
        </div>
        <p className="text-caption uppercase opacity-70">{t.useHint}</p>

        {wantsCreator ? (
          <div className="flex flex-col gap-3 border-2 border-ink bg-ink/5 p-4">
            <label htmlFor="creator_statement" className="text-caption font-bold uppercase">
              {t.whatPost}
            </label>
            <textarea
              id="creator_statement"
              value={creatorStatement}
              onChange={(e) => setCreatorStatement(e.target.value)}
              rows={4}
              maxLength={2000}
              data-creator-statement
              placeholder={t.whatPostPlaceholder}
              className="border-2 border-ink bg-paper px-3 py-2 text-body outline-none focus:border-blue"
            />
            <label htmlFor="creator_links" className="text-caption font-bold uppercase">
              {t.linksProof}
            </label>
            <textarea
              id="creator_links"
              value={creatorLinks}
              onChange={(e) => setCreatorLinks(e.target.value)}
              rows={3}
              data-creator-links
              placeholder={t.linksPlaceholder}
              className="border-2 border-ink bg-paper px-3 py-2 font-mono text-caption outline-none focus:border-blue"
            />
            <p className="text-caption uppercase opacity-70">{t.creatorNote}</p>
          </div>
        ) : null}
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
        {pending ? t.saving : t.enterAtelier}
      </button>
    </div>
  );
}
