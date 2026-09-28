/** A short fingerprint of a string (32-bit FNV-1a over its UTF-16 code units, as 8 hex digits). Translations record the
 * fingerprint of the English they were written from, so a later change to the English is noticed as "stale". Kept free of
 * imports so Node can run it directly (tools/stamp-locale-hashes.mjs). */
export function hashText(text: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}
