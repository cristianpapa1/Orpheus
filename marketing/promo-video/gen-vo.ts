// Generate the promo narration for every language with ElevenLabs, using the
// native voice per language. Output: public/audio/vo/<locale>/01..12.mp3
// Run:  ELEVENLABS_API_KEY=… bun gen-vo.ts            (all languages)
//       ELEVENLABS_API_KEY=… bun gen-vo.ts fr pt      (a subset)
import { mkdirSync } from "node:fs";
import { LOCALES, VO_LINES, VOICE_BY_LOCALE, TTS_MODEL, type Locale } from "./src/strings";

const KEY = process.env.ELEVENLABS_API_KEY;
if (!KEY) throw new Error("ELEVENLABS_API_KEY not set");

const only = process.argv.slice(2) as Locale[];
const langs = (only.length ? only : [...LOCALES]) as Locale[];

const failures: string[] = [];

for (const locale of langs) {
  const voice = VOICE_BY_LOCALE[locale];
  mkdirSync(`public/audio/vo/${locale}`, { recursive: true });
  for (const { f, text } of VO_LINES[locale]) {
    try {
      const res = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voice}?output_format=mp3_44100_192`,
        {
          method: "POST",
          headers: { "xi-api-key": KEY, "Content-Type": "application/json" },
          body: JSON.stringify({
            text,
            model_id: TTS_MODEL,
            voice_settings: { stability: 0.5, similarity_boost: 0.85, style: 0.1, use_speaker_boost: true },
          }),
        },
      );
      if (!res.ok) {
        console.error(`${locale}/${f} FAILED ${res.status}: ${(await res.text()).slice(0, 200)}`);
        failures.push(`${locale}/${f}`);
        continue;
      }
      await Bun.write(`public/audio/vo/${locale}/${f}.mp3`, await res.arrayBuffer());
      console.log(`${locale}/${f} ok`);
    } catch (e) {
      console.error(`${locale}/${f} ERROR ${(e as Error).message}`);
      failures.push(`${locale}/${f}`);
    }
  }
}

if (failures.length) {
  console.log(`\nDONE with ${failures.length} failures: ${failures.join(", ")}`);
  process.exit(2);
}
console.log("\nDONE — all clips generated.");
