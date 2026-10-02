const MINIMUM_VISIBLE_MS = 500;

export function waitForSkeleton(startedAt) {
  const remaining = MINIMUM_VISIBLE_MS - (performance.now() - startedAt);
  return remaining > 0
    ? new Promise((resolve) => setTimeout(resolve, remaining))
    : Promise.resolve();
}
