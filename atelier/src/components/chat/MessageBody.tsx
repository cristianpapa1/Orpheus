import type { ReactNode } from "react";

// Render a chat message body as text with tappable links. Shared posts arrive as
// plain text like `Shared "Low Tide": https://atelier.aunflaneur.com/p/<id>`, and on a
// phone a bare URL isn't tappable — this turns any http(s) URL into an <a>.
//
// Safe by construction: we only ever build <a href> from a matched http(s) token and
// let React escape every text segment. No dangerouslySetInnerHTML, so message text can
// never inject markup.

const URL_RE = /https?:\/\/[^\s<]+/g;

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

  for (const match of body.matchAll(URL_RE)) {
    const start = match.index;
    const raw = match[0];
    const [url, trailing] = splitTrailingPunct(raw);

    if (start > last) parts.push(body.slice(last, start));

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
    last = start + raw.length;
  }

  if (last < body.length) parts.push(body.slice(last));
  return <>{parts}</>;
}
