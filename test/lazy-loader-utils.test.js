import assert from "node:assert/strict";
import test from "node:test";

import {
  buildContainerStyle,
  getRetryDelay,
  isWithinBuffer,
  normalizeCssLength,
} from "../src/lazy-loader-utils.js";

test("normalizeCssLength converts finite numbers and preserves CSS lengths", () => {
  assert.equal(normalizeCssLength(625), "625px");
  assert.equal(normalizeCssLength("var(--card-height)"), "var(--card-height)");
  assert.equal(normalizeCssLength(" 40rem "), "40rem");
  assert.equal(normalizeCssLength(Number.NaN), "");
  assert.equal(normalizeCssLength(""), "");
});

test("buildContainerStyle creates a stable size contract", () => {
  assert.equal(
    buildContainerStyle({
      reserveBlockSize: 625,
      aspectRatio: "16 / 9",
      skeletonContainerStyle: "padding: 1rem",
    }),
    "content-visibility:auto;min-height:625px;--marko-lazy-reserved-block-size:625px;" +
      "contain-intrinsic-block-size:auto 625px;aspect-ratio:16 / 9;padding: 1rem;",
  );
});

test("buildContainerStyle supports an intrinsic size without forcing a minimum height", () => {
  assert.equal(
    buildContainerStyle({
      contentVisibility: false,
      intrinsicSize: "480px",
      style: "color: red",
    }),
    "contain-intrinsic-block-size:auto 480px;color: red;",
  );
});

test("isWithinBuffer requires non-zero geometry and checks both viewport directions", () => {
  const viewportHeight = 900;
  const buffer = 600;

  assert.equal(
    isWithinBuffer(
      { top: 1400, bottom: 1500, width: 300, height: 100 },
      viewportHeight,
      buffer,
    ),
    true,
  );
  assert.equal(
    isWithinBuffer(
      { top: 1600, bottom: 1700, width: 300, height: 100 },
      viewportHeight,
      buffer,
    ),
    false,
  );
  assert.equal(
    isWithinBuffer(
      { top: -500, bottom: -400, width: 300, height: 100 },
      viewportHeight,
      buffer,
    ),
    true,
  );
  assert.equal(
    isWithinBuffer(
      { top: -800, bottom: -700, width: 300, height: 100 },
      viewportHeight,
      buffer,
    ),
    false,
  );
  assert.equal(
    isWithinBuffer(
      { top: 0, bottom: 0, width: 0, height: 0 },
      viewportHeight,
      buffer,
    ),
    false,
  );
});

test("getRetryDelay applies bounded exponential backoff inputs", () => {
  assert.equal(getRetryDelay(1000, 0), 1000);
  assert.equal(getRetryDelay(1000, 1), 2000);
  assert.equal(getRetryDelay(1000, 3), 8000);
  assert.equal(getRetryDelay(-10, -1), 0);
});
