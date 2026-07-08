import { describe, expect, test } from "bun:test";
import { VARIANT_WIDTHS, variantWidthsFor } from "./media";

describe("variantWidthsFor", () => {
  test("typical high-res photo gets every display width", () => {
    expect(variantWidthsFor(6000)).toEqual([...VARIANT_WIDTHS]);
  });

  test("never upscales — widths at or above the original are dropped", () => {
    expect(variantWidthsFor(1600)).toEqual([480, 960]);
    expect(variantWidthsFor(1000)).toEqual([480, 960].filter((w) => w < 1000));
  });

  test("small original yields a single natural-size variant", () => {
    expect(variantWidthsFor(300)).toEqual([300]);
  });

  test("zero-width input yields nothing", () => {
    expect(variantWidthsFor(0)).toEqual([]);
  });
});
