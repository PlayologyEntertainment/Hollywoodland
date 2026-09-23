/** Joins the deploy base, an asset path, and a cache-busting build id. Pure so it can be tested without Vite's env. */
export function buildAssetUrl(base: string, path: string, buildId: string): string {
  return `${base}${path}?v=${encodeURIComponent(buildId)}`;
}

// Files in public/ are copied verbatim, so their names never change between releases. The build id (the commit SHA in
// CI) in the query string makes a redeploy fetch fresh bytes instead of whatever a browser cached. Without one (local
// dev) every page load gets a new id, which is what the manifest loads already did with Date.now().
const BUILD_ID: string = import.meta.env.VITE_BUILD_ID ?? String(Date.now());

/** URL for a file under public/, e.g. `assetUrl('assets/locations/diner.webp')`. */
export function assetUrl(path: string): string {
  return buildAssetUrl(import.meta.env.BASE_URL, path, BUILD_ID);
}
