import { Composition } from "remotion";
import { Promo, FPS, promoDuration } from "./Promo";
import { LOCALES } from "./strings";

// One composition per language: Promo-en, Promo-fr, … Duration is derived from
// that language's narration timings.
export const RemotionRoot = () => (
  <>
    {LOCALES.map((locale) => (
      <Composition
        key={locale}
        id={`Promo-${locale}`}
        component={Promo}
        durationInFrames={promoDuration(locale)}
        fps={FPS}
        width={1080}
        height={1920}
        defaultProps={{ locale }}
      />
    ))}
  </>
);
