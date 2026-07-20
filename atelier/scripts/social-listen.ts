/**
 * Social listening — surfaces Reddit conversations where Atelier is genuinely
 * relevant, so a HUMAN can join authentically. Read-only: it never posts,
 * upvotes, or automates engagement (that would be spam + against Reddit's
 * content policy). Uses Reddit's PUBLIC search JSON (no API key, low volume,
 * descriptive User-Agent) — legitimate monitoring of public data.
 *
 * Run:   bun scripts/social-listen.ts                  (pretty report)
 *        bun scripts/social-listen.ts --json           (machine-readable)
 *        bun scripts/social-listen.ts --days 3 --limit 40
 *
 * Auth (recommended — Reddit now 403s public JSON from datacenter IPs): register
 * a FREE app at https://www.reddit.com/prefs/apps (type "script"), then set
 * REDDIT_CLIENT_ID + REDDIT_CLIENT_SECRET. The script gets an app-only OAuth
 * token (client_credentials, free tier ~100 req/min) and queries oauth.reddit.com.
 * Without creds it falls back to public JSON (works from a normal residential IP).
 * Set REDDIT_USER_AGENT to identify you, e.g. "atelier-listen/1.0 (by /u/yourname)".
 */

// Communities where makers actually discuss where + how to share their work.
const SUBREDDITS = [
  "Art", "ArtistLounge", "artbusiness", "learnart", "DigitalArt", "painting",
  "photography", "photocritique", "handmade", "crafts", "poetry", "writing",
  "somethingimade", "IMadeThis",
];

// Intent phrases that signal an Atelier-relevant conversation (someone looking
// for a home for their work / frustrated with the status quo).
const QUERIES = [
  "instagram alternative for artists",
  "where to post my art",
  "social media for artists",
  "sick of the instagram algorithm",
  "platform to share art",
  "art community online",
  "portfolio site for artists",
  "no algorithm art platform",
  "sell my art online",
];

interface Hit {
  title: string;
  subreddit: string;
  url: string;
  score: number;
  comments: number;
  createdUtc: number;
  matched: string;
  selftext: string;
}

const UA = process.env.REDDIT_USER_AGENT ?? "atelier-social-listen/1.0 (contact: atelier@aunflaneur.com)";
const CLIENT_ID = process.env.REDDIT_CLIENT_ID;
const CLIENT_SECRET = process.env.REDDIT_CLIENT_SECRET;

interface Auth {
  base: string;
  headers: Record<string, string>;
}

/** App-only OAuth token (free tier) when creds are set; else public JSON. */
async function resolveAuth(): Promise<Auth> {
  if (CLIENT_ID && CLIENT_SECRET) {
    try {
      const basic = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64");
      const res = await fetch("https://www.reddit.com/api/v1/access_token", {
        method: "POST",
        headers: {
          Authorization: `Basic ${basic}`,
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": UA,
        },
        body: "grant_type=client_credentials",
      });
      if (res.ok) {
        const j = (await res.json()) as { access_token?: string };
        if (j.access_token) {
          if (!JSON_OUT) console.log("  (using Reddit OAuth — free tier)\n");
          return {
            base: "https://oauth.reddit.com",
            headers: { Authorization: `Bearer ${j.access_token}`, "User-Agent": UA },
          };
        }
      }
      if (!JSON_OUT) console.warn(`  (OAuth token failed HTTP ${res.status} — falling back to public JSON)`);
    } catch (err) {
      if (!JSON_OUT) console.warn(`  (OAuth error: ${err instanceof Error ? err.message : "?"} — public JSON)`);
    }
  } else if (!JSON_OUT) {
    console.warn("  (no REDDIT_CLIENT_ID/SECRET — using public JSON; Reddit may 403 from some IPs)\n");
  }
  return { base: "https://www.reddit.com", headers: { "User-Agent": UA } };
}

function arg(name: string, fallback: number): number {
  const i = process.argv.indexOf(`--${name}`);
  if (i !== -1 && process.argv[i + 1]) {
    const n = Number(process.argv[i + 1]);
    if (Number.isFinite(n)) return n;
  }
  return fallback;
}

const DAYS = arg("days", 7);
const LIMIT = arg("limit", 30);
const JSON_OUT = process.argv.includes("--json");
const CUTOFF = Date.now() / 1000 - DAYS * 86400;

async function search(query: string, auth: Auth): Promise<Hit[]> {
  // oauth.reddit.com paths omit ".json"; www.reddit.com needs it.
  const path = auth.base.includes("oauth.reddit.com") ? "/search" : "/search.json";
  const url =
    `${auth.base}${path}?` +
    new URLSearchParams({ q: query, sort: "new", limit: "25", t: "month", type: "link" });
  try {
    const res = await fetch(url, { headers: auth.headers });
    if (!res.ok) {
      if (!JSON_OUT) console.warn(`  (skip "${query}" — HTTP ${res.status})`);
      return [];
    }
    const json = (await res.json()) as {
      data?: { children?: { data?: Record<string, unknown> }[] };
    };
    const out: Hit[] = [];
    for (const child of json.data?.children ?? []) {
      const d = child.data ?? {};
      const createdUtc = Number(d.created_utc ?? 0);
      if (createdUtc < CUTOFF) continue;
      out.push({
        title: String(d.title ?? ""),
        subreddit: String(d.subreddit ?? ""),
        url: `https://www.reddit.com${String(d.permalink ?? "")}`,
        score: Number(d.score ?? 0),
        comments: Number(d.num_comments ?? 0),
        createdUtc,
        matched: query,
        selftext: String(d.selftext ?? "").slice(0, 240),
      });
    }
    return out;
  } catch (err) {
    if (!JSON_OUT) console.warn(`  (skip "${query}" — ${err instanceof Error ? err.message : "error"})`);
    return [];
  }
}

function ageLabel(createdUtc: number): string {
  const hours = Math.round((Date.now() / 1000 - createdUtc) / 3600);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

async function main() {
  const auth = await resolveAuth();
  const seen = new Set<string>();
  const hits: Hit[] = [];
  for (const q of QUERIES) {
    const results = await search(q, auth);
    for (const h of results) {
      if (seen.has(h.url)) continue;
      // Prefer posts in maker communities, but keep strong site-wide matches too.
      const inTargetSub = SUBREDDITS.some((s) => s.toLowerCase() === h.subreddit.toLowerCase());
      if (!inTargetSub && h.comments < 3) continue; // filter low-signal off-topic noise
      seen.add(h.url);
      hits.push(h);
    }
    await new Promise((r) => setTimeout(r, 1200)); // be polite to Reddit
  }

  // Rank: recency + a little engagement weight.
  hits.sort((a, b) => b.createdUtc - a.createdUtc || b.comments - a.comments);
  const top = hits.slice(0, LIMIT);

  if (JSON_OUT) {
    process.stdout.write(JSON.stringify(top, null, 2) + "\n");
    return;
  }

  console.log(`\n🎧 Atelier social listening — Reddit, last ${DAYS}d — ${top.length} relevant threads\n`);
  console.log(`   (Read-only. Engage as a human, disclosed. Never auto-post.)\n`);
  if (top.length === 0) {
    console.log("   Nothing matched right now — widen QUERIES/SUBREDDITS or --days.\n");
    return;
  }
  for (const h of top) {
    console.log(`• r/${h.subreddit} · ${ageLabel(h.createdUtc)} · ▲${h.score} · 💬${h.comments}`);
    console.log(`  ${h.title}`);
    if (h.selftext) console.log(`  “${h.selftext.replace(/\s+/g, " ").trim()}”`);
    console.log(`  matched: "${h.matched}"`);
    console.log(`  ${h.url}\n`);
  }
  console.log(
    "How to engage well: reply to the person's actual question first, be helpful,\n" +
      "and only mention Atelier if it genuinely fits — disclosed as your project.\n",
  );
}

void main();
