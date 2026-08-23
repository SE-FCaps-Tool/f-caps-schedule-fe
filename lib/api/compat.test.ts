import { test, expect } from "vitest";

import { normalizeToSnakeCase } from "./compat";

test("camel-only input converts every field to snake_case", () => {
  expect(normalizeToSnakeCase({ groupId: 7, displayName: "A", createdAt: "2026-01-01" })).toEqual({
    group_id: 7,
    display_name: "A",
    created_at: "2026-01-01",
  });
});

test("snake-only input is a no-op", () => {
  const input = { group_id: 7, display_name: "A", created_at: "2026-01-01" };
  expect(normalizeToSnakeCase(input)).toEqual(input);
});

test("mixed camel/snake keys in the same object both normalize to snake_case", () => {
  expect(normalizeToSnakeCase({ groupId: 7, display_name: "A", roomCode: "B101" })).toEqual({
    group_id: 7,
    display_name: "A",
    room_code: "B101",
  });
});

test("missing/null/undefined fields pass through untouched", () => {
  expect(normalizeToSnakeCase({ note: null, tag: undefined, count: 0 })).toEqual({
    note: null,
    tag: undefined,
    count: 0,
  });
});

test("ALL-CAPS keys (enum literal used as a dict key) are left intact, not shredded per letter", () => {
  expect(normalizeToSnakeCase({ ACTIVE: 5, CLOSED: 3 })).toEqual({ ACTIVE: 5, CLOSED: 3 });
});

test("enum string values are never touched, only keys are", () => {
  expect(normalizeToSnakeCase({ status: "ACTIVE", groupStatus: "IN_PROGRESS" })).toEqual({
    status: "ACTIVE",
    group_status: "IN_PROGRESS",
  });
});

test("recurses into nested objects and arrays", () => {
  expect(
    normalizeToSnakeCase({
      createdBy: { accountId: 1, displayName: "A" },
      items: [{ roomCode: "A101" }, { roomCode: "A102" }],
    })
  ).toEqual({
    created_by: { account_id: 1, display_name: "A" },
    items: [{ room_code: "A101" }, { room_code: "A102" }],
  });
});
