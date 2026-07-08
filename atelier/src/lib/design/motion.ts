import type { Variants, Transition } from "framer-motion";

/** Shared easing — mechanical, decisive, Bauhaus. No bounce. */
export const windowEase: Transition = {
  duration: 0.28,
  ease: [0.2, 0, 0, 1],
};

/** A window panel opening into the facade. */
export const windowIn: Variants = {
  closed: { opacity: 0, y: 8, scaleY: 0.97 },
  open: { opacity: 1, y: 0, scaleY: 1, transition: windowEase },
};

/** A window panel closing out of the facade. */
export const windowOut: Variants = {
  open: { opacity: 1, y: 0, scaleY: 1 },
  closed: { opacity: 0, y: -8, scaleY: 0.97, transition: windowEase },
};

/** Stagger children windows like lights coming on in a building. */
export const facadeStagger: Variants = {
  closed: {},
  open: { transition: { staggerChildren: 0.06 } },
};
