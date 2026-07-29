const DEFAULT_PREFETCH_ROOT_MARGIN = "800px 0px";
const DEFAULT_RENDER_ROOT_MARGIN = "200px 0px";
const DEFAULT_PREFETCH_BUFFER = 800;
const DEFAULT_RENDER_BUFFER = 200;

export {
  DEFAULT_PREFETCH_BUFFER,
  DEFAULT_PREFETCH_ROOT_MARGIN,
  DEFAULT_RENDER_BUFFER,
  DEFAULT_RENDER_ROOT_MARGIN,
};

export function normalizeCssLength(value) {
  if (typeof value === "number" && Number.isFinite(value)) return `${value}px`;
  if (typeof value === "string" && value.trim() !== "") return value.trim();
  return "";
}

export function buildContainerStyle(input = {}) {
  const styles = [];
  const reservedSize = normalizeCssLength(input.reserveBlockSize);
  const intrinsicSize = normalizeCssLength(input.intrinsicSize) || reservedSize;

  if (input.contentVisibility !== false) styles.push("content-visibility:auto");
  if (reservedSize) {
    styles.push(`min-height:${reservedSize}`);
    styles.push(`--marko-lazy-reserved-block-size:${reservedSize}`);
  }
  if (intrinsicSize)
    styles.push(`contain-intrinsic-block-size:auto ${intrinsicSize}`);
  if (input.aspectRatio) styles.push(`aspect-ratio:${input.aspectRatio}`);
  if (input.style) styles.push(input.style);
  if (input.skeletonContainerStyle) styles.push(input.skeletonContainerStyle);

  return styles
    .map((style) => style.trim())
    .filter(Boolean)
    .map((style) => (style.endsWith(";") ? style : `${style};`))
    .join("");
}

export function isWithinBuffer(rect, viewportHeight, buffer) {
  if (!rect || rect.width === 0 || rect.height === 0) return false;

  const safeViewportHeight = Number.isFinite(viewportHeight)
    ? viewportHeight
    : 0;
  const safeBuffer = Number.isFinite(buffer) ? Math.max(0, buffer) : 0;
  return (
    rect.bottom >= -safeBuffer && rect.top <= safeViewportHeight + safeBuffer
  );
}

export function getRetryDelay(baseDelay, attempt) {
  const safeBaseDelay = Number.isFinite(baseDelay)
    ? Math.max(0, baseDelay)
    : 1000;
  const safeAttempt = Number.isFinite(attempt) ? Math.max(0, attempt) : 0;
  return safeBaseDelay * 2 ** safeAttempt;
}
