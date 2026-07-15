import type { ReactNode } from "react";

// Render a message body as text with tappable links AND @mentions. Shared posts
// arrive as plain text like `Shared "Low Tide": https://atelier.aunflaneur.com/p/<id>`
// and mentions as `@handle` — this turns both into links.
//
// Safe by construction: links are only ever built from a matched http(s) token or a
// @handle token, and every text segment is React-escaped. No dangerouslySetInnerHTML.

// URLs (group 1) or @mentions (group 2). Handles: 3–30 of [a-z0-9_], per profiles.
const TOKEN_RE = /(https?:\/\/[^\s<]+)|(@[A-Za-z0-9_]{3,30})/g;

// Our own hosts (Atelier on aunflaneur.com, plus crktic.com kept alive post-cutover).
// Links to these navigate in the same tab — tapping a shared post takes you to it.
const OUR_HOSTS = /(^|\.)(?:aunflaneur|crktic)\.com$/i;

function isInternal(url: string): boolean {
  try {
    return OUR_HOSTS.test(new URL(url).hostname);
  } catch {
    return false;
  }
}

// A trailing `.`/`,`/`)` etc. is almost always sentence punctuation, not part of the
// URL — peel it off so it renders as text and the link stays clean.
function splitTrailingPunct(token: string): [string, string] {
  const m = token.match(/[.,;:!?)\]}'"]+$/);
  return m ? [token.slice(0, -m[0].length), m[0]] : [token, ""];
}

export function MessageBody({ body }: { body: string }): ReactNode {
  const parts: ReactNode[] = [];
  let last = 0;
  let key = 0;

  for (const match of body.matchAll(TOKEN_RE)) {
    const start = match.index;
    const raw = match[0];
    if (start > last) parts.push(body.slice(last, start));

    if (match[1]) {
      // URL
      const [url, trailing] = splitTrailingPunct(raw);
      const external = !isInternal(url);
      parts.push(
        <a
          key={key++}
          href={url}
          {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          className="break-all underline underline-offset-2 hover:opacity-70"
        >
          {url}
        </a>,
      );
      if (trailing) parts.push(trailing);
    } else {
      // @mention → the person's public profile
      const handle = raw.slice(1);
      parts.push(
        <a
          key={key++}
          href={`/u/${handle.toLowerCase()}`}
          className="font-bold underline underline-offset-2 hover:text-blue"
        >
          @{handle}
        </a>,
      );
    }
    last = start + raw.length;
  }

  if (last < body.length) parts.push(body.slice(last));
  return <>{parts}</>;
}
