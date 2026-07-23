// One-off: generate the promo narration with ElevenLabs (Sarah, female).
// Run: ELEVENLABS_API_KEY=… bun gen-vo.ts
import { mkdirSync } from "node:fs";

const KEY = process.env.ELEVENLABS_API_KEY;
if (!KEY) throw new Error("ELEVENLABS_API_KEY not set");
const VOICE = "EXAVITQu4vr4xnSDxMaL"; // Sarah — mature, reassuring narration

// [filename, narration] — narration mirrors what's written on screen.
// Pass filenames as args to regenerate a subset, e.g. `bun gen-vo.ts 01 02`.
const only = process.argv.slice(2);
const LINES: [string, string][] = [
  ["01", "Tired of generic platforms like Instagram and Amazon to publish and sell your art?"],
  ["02", "Here, we're building a social community worthy of the talent and effort behind your creations."],
  ["03", "Atelier is a feed in order. Everyone who follows you sees your work. No ranking, no ads."],
  ["04", "Post art, writing, music, or film in seconds."],
  ["05", "Heroes live for just one day, tied to the events you attend."],
  ["06", "Three ways to belong. Member, creator, curator, with real moderation for quality."],
  ["07", "Gather in groups around what you love."],
  ["08", "Sell on your own storefront. The buy button sends collectors straight to you. Zero fees."],
  ["09", "Funded by donations, led by people from the arts. Never by ads."],
  ["10", "A un flaneur. Join us at atelier dot aunflaneur dot com."],
  ["11", "Events live here too. The organizer confirms who attended, and only they can post a Hero, tied to that event."],
  ["12", "On your phone, or full-width on the web. The same room, everywhere."],
];

mkdirSync("public/audio/vo", { recursive: true });

for (const [name, text] of LINES) {
  if (only.length && !only.includes(name)) continue;
  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${VOICE}?output_format=mp3_44100_128`,
    {
      method: "POST",
      headers: { "xi-api-key": KEY, "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2",
        voice_settings: { stability: 0.45, similarity_boost: 0.8, style: 0.05, use_speaker_boost: true },
      }),
    },
  );
  if (!res.ok) {
    console.error(`${name} FAILED ${res.status}: ${await res.text()}`);
    process.exit(1);
  }
  await Bun.write(`public/audio/vo/${name}.mp3`, await res.arrayBuffer());
  console.log(`${name} ok`);
}
console.log("done");
