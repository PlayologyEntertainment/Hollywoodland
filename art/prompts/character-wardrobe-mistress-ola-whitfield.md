# Character brief: Ola Whitfield (wardrobe mistress / origin-linked specialist)

Status: **Existing concept art staged as a runtime portrait, pending owner visual review**

## Role in the game

- Slice-spec role: "Optional specialist tied to an origin or alternate route" (`docs/VERTICAL_SLICE_SPEC.md` §2). Code id: `wardrobe-mentor` (`src/domain/RelationshipDefinitions.ts`, no attraction).
- Canon (`docs/DRAFT_TRACK_B_CANON_PROPOSAL.md` §2, still a draft): wardrobe mistress at Monarch Pictures, tied to the Studio-Lot Hand-Me-Down origin. She already knows that character, which unlocks a wardrobe-department shortcut past the casting-office gatekeeper. Mentor/obligation track, no romance.

## Design as delivered

Short platinum-blonde waved bob, pearl earrings and double-strand pearl necklace, red lips and nails. Black wrap dress with a gold belt buckle and brooch, cream open kimono-sleeved duster, gold yellow tape measure around the neck, gold bangles and wristwatch, cream-and-black T-strap heels. Props: clipboard with a costume sketch and fabric swatches, and a rose-pink drape of silk held aloft. No baked text.

## Source and provenance

This asset was **not generated in this workflow**. It is the concept sheet already committed to the repo, and it matches the other `art/Hollywoodland_Character_*.png` sheets.

```text
asset_id: character_wardrobe_mistress
asset_type: character full-body concept art (RGBA cutout)
prompt_or_brief: not recorded in the repo; the owner should supply it if known
reference_asset_ids: unknown
generation_tool_and_version: not recorded in the repo (added in commit 0f9d207, 2026-09-16)
generation_date: 2026-09-16 (commit date; actual generation date unknown)
raw_source_location: art/Hollywoodland_Character_Wardrobe_Mistress.png (unchanged)
human_edits: none recorded for the concept file
review_status: pending review
rights_or_license_notes: project-owned development asset; human rights/provenance review required. Character name and design are from an unapproved draft canon proposal.
runtime_files: public/assets/characters/wardrobe-mentor.webp
```

## Staging (2026-09-18)

```text
asset_id: wardrobe_mentor_portrait
source_asset: art/Hollywoodland_Character_Wardrobe_Mistress.png (unchanged)
human_edits: deterministic alpha normalization on the runtime copy only, done with a script and no repainting. Alpha >= 250 set to 255 (the source had no fully opaque pixels; 34% sat at 250-254); alpha <= 3 set to 0; antialiased edge alpha 4-249 and all RGB left untouched.
runtime_files: public/assets/characters/wardrobe-mentor.webp (1024x1536 RGBA, lossy quality 90, alpha_quality 100; same format and size as the other character portraits)
review_status: pending review (staged at the owner's request 2026-09-18; not yet referenced by any code or scene)
```

Verified from the encoded WebP: corners alpha 0, no glow or halo over black or white, about 1.5% partial-alpha edge pixels. Some image viewers show a glow around the source PNG; that is leftover color stored in fully transparent pixels, not visible in the alpha channel or in the game.
