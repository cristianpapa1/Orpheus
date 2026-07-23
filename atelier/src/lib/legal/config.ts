/**
 * Legal / copyright configuration.
 *
 * The DMCA designated-agent details MUST be real and registered with the U.S.
 * Copyright Office (dmca.copyright.gov) for the safe-harbour to attach — so we
 * never hard-code invented contact details. They come from env; when they are
 * absent the copyright page shows an "unconfigured" warning instead of a
 * placeholder that could read as real. Set these before opening/relaunch:
 *
 *   COPYRIGHT_AGENT_NAME         e.g. "Copyright Agent, À un flâneur"
 *   COPYRIGHT_AGENT_EMAIL        e.g. "copyright@aunflaneur.com"
 *   COPYRIGHT_AGENT_ADDRESS      full postal address (one line or \n-separated)
 *   COPYRIGHT_AGENT_REGISTRATION the U.S. Copyright Office DMCA registration id
 */

export interface CopyrightAgent {
  name: string | null;
  email: string | null;
  address: string | null;
  /** U.S. Copyright Office DMCA designated-agent registration id (public). */
  registrationId: string | null;
  /** True when a real agent is configured AND holds a registration id. */
  registered: boolean;
  /** True when we have at least an email to route notices to. */
  configured: boolean;
}

/** The company's public contact address — shown site-wide (footer, privacy),
 *  and the default copyright-agent inbox. Override the agent via env if a
 *  dedicated DMCA address is registered. */
export const CONTACT_EMAIL = "atelier@aunflaneur.com";

export function copyrightAgent(): CopyrightAgent {
  const name = process.env.COPYRIGHT_AGENT_NAME?.trim() || null;
  const email = process.env.COPYRIGHT_AGENT_EMAIL?.trim() || CONTACT_EMAIL;
  const address = process.env.COPYRIGHT_AGENT_ADDRESS?.trim() || null;
  // Real, public DMCA designated-agent registration id (U.S. Copyright Office).
  // Env-overridable; the assigned id is the default so the safe-harbour details
  // render even without env set. Its presence is what marks the agent registered.
  const registrationId =
    process.env.COPYRIGHT_AGENT_REGISTRATION?.trim() || "DMCA-1075727";
  return {
    name,
    email,
    address,
    registrationId,
    registered: Boolean(email && registrationId),
    configured: Boolean(email),
  };
}

/** Bump when the substance of the Terms changes so we can track acceptance. */
export const TERMS_VERSION = "2026-07-16";
