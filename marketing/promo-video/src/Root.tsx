import { Composition, Still } from "remotion";
import { Promo, FPS, promoDuration } from "./Promo";
import { Logo } from "./Logo";
import { LOCALES } from "./strings";

// One composition per language: Promo-en, Promo-fr, … Duration is derived from
// that language's narration timings. Plus brand-logo stills.
export const RemotionRoot = () => (
  <>
    <Still id="Logo-square" component={Logo} width={1080} height={1080} defaultProps={{ variant: "square" as const, wordmark: true }} />
    <Still id="Logo-banner" component={Logo} width={1500} height={500} defaultProps={{ variant: "banner" as const, wordmark: true }} />
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
