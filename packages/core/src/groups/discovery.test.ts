import { describe, expect, it } from "bun:test";
import { suggestGroups, suggestGroupsByInterests } from "./discovery";

const GROUPS = [
  { id: "a", name: "Jazz Collective", description: "Late-night improv sessions" },
  { id: "b", name: "Analogue Photography", description: "Film shooters, darkroom talk" },
  { id: "c", name: "Poetry Circle", description: "Weekly readings and critique" },
  { id: "d", name: "Woodworkers", description: "Hand tools, no screws" },
];

describe("suggestGroups", () => {
  it("returns nothing without interests", () => {
    expect(suggestGroups(GROUPS, [])).toEqual([]);
  });

  it("matches interest labels against name and description", () => {
    const out = suggestGroups(GROUPS, ["Photography"]);
    expect(out.map((g) => g.id)).toEqual(["b"]);
  });

  it("ranks by number of matching terms", () => {
    const out = suggestGroups(GROUPS, ["Poetry", "Jazz"]);
    // both single-match; tie broken alphabetically (Jazz… before Poetry…)
    expect(out.map((g) => g.id)).toEqual(["a", "c"]);
  });

  it("honors the exclude set (already-joined groups)", () => {
    const out = suggestGroups(GROUPS, ["Photography"], { exclude: ["b"] });
    expect(out).toEqual([]);
  });

  it("respects the limit", () => {
    const out = suggestGroups(GROUPS, ["Jazz", "Photography", "Poetry"], {
      limit: 2,
    });
    expect(out).toHaveLength(2);
  });

  it("is case-insensitive", () => {
    expect(suggestGroups(GROUPS, ["jazz"]).map((g) => g.id)).toEqual(["a"]);
  });
});

const TAGGED = [
  { id: "m", name: "Jazz", description: "", interests: ["cat:music", "sub:music:jazz"] },
  { id: "p", name: "Painters", description: "", interests: ["cat:visual", "sub:visual:painting"] },
  { id: "w", name: "Woodworkers", description: "", interests: ["sub:handmade:woodwork"] },
];

describe("suggestGroupsByInterests", () => {
  it("matches by shared base category (cat: interest → sub: group tag)", () => {
    // user likes music → the Jazz group (tagged sub:music:jazz) matches
    expect(
      suggestGroupsByInterests(TAGGED, ["cat:music"]).map((g) => g.id),
    ).toEqual(["m"]);
  });

  it("matches a sub-only group via its base category", () => {
    expect(
      suggestGroupsByInterests(TAGGED, ["cat:handmade"]).map((g) => g.id),
    ).toEqual(["w"]);
  });

  it("returns nothing without interests", () => {
    expect(suggestGroupsByInterests(TAGGED, [])).toEqual([]);
  });

  it("ignores non-discipline interests (schools)", () => {
    expect(suggestGroupsByInterests(TAGGED, ["school:bauhaus"])).toEqual([]);
  });
});
