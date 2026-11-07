// Picks a rendering budget for the swarm from what the device tells us, without
// assuming a big screen means a fast machine. The engine also degrades further
// at runtime if frames actually run slow (see swarmEngine.js → adaptQuality).

const safeMatch = (query) => {
  try {
    return window.matchMedia(query).matches;
  } catch {
    return false;
  }
};

export function getDeviceProfile() {
  const nav = typeof navigator !== 'undefined' ? navigator : {};
  const cores = nav.hardwareConcurrency || 4;
  // deviceMemory is Chromium-only; assume a modest 4GB elsewhere (iOS/Firefox).
  const memory = nav.deviceMemory || 4;
  const saveData = !!(nav.connection && nav.connection.saveData);
  const coarse = safeMatch('(pointer: coarse)');
  const reduced = safeMatch('(prefers-reduced-motion: reduce)');

  let tier = 'high';
  if (cores <= 4 || memory <= 2 || saveData) tier = 'low';
  else if (cores <= 6 || memory <= 4 || coarse) tier = 'mid';

  const byTier = {
    low: { cursors: 10, maxDpr: 1, maxPixels: 1.2e6, fpsCap: 30, guides: false },
    mid: { cursors: 16, maxDpr: 1.5, maxPixels: 1.6e6, fpsCap: 60, guides: true },
    high: { cursors: 22, maxDpr: 2, maxPixels: 2.4e6, fpsCap: 60, guides: true },
  }[tier];

  return {
    tier,
    reduced,
    coarse,
    ...byTier,
    // Reduced motion: a smaller, faster crew; no flocking, no gliding tour.
    cursors: reduced ? Math.min(6, byTier.cursors) : byTier.cursors,
    speed: reduced ? 3 : 1,
  };
}
