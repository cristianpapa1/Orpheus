import { describe, expect, test } from "bun:test";
import {
  attendeeStatus,
  bucketAttendees,
  canPostEventHero,
  type Participant,
} from "./participation";

const p = (
  profile_id: string,
  confirmed_at: string | null,
  blocked_at: string | null,
): Participant => ({ profile_id, confirmed_at, blocked_at });

const T = "2026-07-20T12:00:00Z";

describe("attendeeStatus", () => {
  test("plain RSVP is 'going'", () => {
    expect(attendeeStatus(p("a", null, null))).toBe("going");
  });
  test("confirmed and not blocked is 'confirmed'", () => {
    expect(attendeeStatus(p("a", T, null))).toBe("confirmed");
  });
  test("block wins over confirmation", () => {
    expect(attendeeStatus(p("a", T, T))).toBe("blocked");
    expect(attendeeStatus(p("a", null, T))).toBe("blocked");
  });
});

describe("canPostEventHero", () => {
  test("owner may always post", () => {
    expect(canPostEventHero({ isOwner: true })).toBe(true);
    expect(canPostEventHero({ isOwner: true, participant: p("a", null, T) })).toBe(true);
  });
  test("confirmed attendee may post", () => {
    expect(canPostEventHero({ isOwner: false, participant: p("a", T, null) })).toBe(true);
  });
  test("RSVP-only attendee may NOT post", () => {
    expect(canPostEventHero({ isOwner: false, participant: p("a", null, null) })).toBe(false);
  });
  test("blocked attendee may NOT post, even if confirmed", () => {
    expect(canPostEventHero({ isOwner: false, participant: p("a", T, T) })).toBe(false);
  });
  test("no participant, not owner → cannot post", () => {
    expect(canPostEventHero({ isOwner: false, participant: null })).toBe(false);
    expect(canPostEventHero({ isOwner: false })).toBe(false);
  });
});

describe("bucketAttendees", () => {
  test("splits into confirmed / going / blocked", () => {
    const { confirmed, going, blocked } = bucketAttendees([
      p("c1", T, null),
      p("g1", null, null),
      p("b1", T, T),
      p("c2", T, null),
      p("b2", null, T),
    ]);
    expect(confirmed.map((x) => x.profile_id)).toEqual(["c1", "c2"]);
    expect(going.map((x) => x.profile_id)).toEqual(["g1"]);
    expect(blocked.map((x) => x.profile_id)).toEqual(["b1", "b2"]);
  });
});
