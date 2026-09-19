# Boulevard five-plane render brief

Status: **Native-alpha runtime integration complete; approved by the owner 2026-09-19 with the Phase 1 visual spike; superseded by the v3 art**

## Delivery contract

- Runtime source canvas: **2,172 × 724 pixels** for every plane, registered to the same origin and displayed at **3,240 × 1,080** in Phaser without changing the 3:1 aspect ratio.
- Chroma masters remain untouched in `art/assets/`. The received Plane 4 master is 2,169 × 725; only its derived runtime copy is normalized to 2,172 × 724 before alpha extraction.
- Style references: `art/Hollywoodland_Concept_Boulevard.png` and `public/assets/environments/hollywood-boulevard-concept-v1.webp`. Preserve their vivid, romanticized, hand-painted 1935 Hollywood storybook style, warm sunlight, crisp silhouettes, architectural ornament, subtle fisheye, and lateral side-scrolling viewpoint.
- Plane 1 is an opaque RGB/RGBA PNG with every pixel filled.
- Planes 2–5 are first rendered by `gpt-image-2` against perfectly flat `#ff00ff`, then passed to `gpt-image-1.5` only to remove that flat color and emit native-alpha PNGs. The extraction pass must not redraw, recolor, resize, move, crop, or add content.
- Planes 2–5 contain generous hidden continuation down to the bottom edge. Their visible top silhouettes remain clean, while the lower continuation supplies overlap behind nearer planes.
- All planes share the same horizon, camera, lighting direction, palette, and registration.
- Exclude freestanding vehicles, streetcars, lamps, utility poles, palms, trees, plants, signs, banners, street furniture, hydrants, bins, tables, chairs, clutter, characters, crowds, animals, and loose props from every plane.
- Storefront, theater, hotel, office, and marquee sign panels are blank and unlettered. The historical hillside **“HOLLYWOODLAND”** is the only baked text.

## Shared negative direction

Do not render people, silhouettes of people, crowds, characters, animals, vehicles, streetcars, bicycles, freestanding lamps, traffic lights, utility poles, wires, palms, trees, shrubs, potted plants, planters, flags, banners, freestanding signs, benches, tables, chairs, hydrants, bins, newspaper boxes, bollards, parking meters, loose props, litter, clutter, logos, watermarks, borders, captions, or text. Do not bake shadows from excluded objects. Do not create checkerboard transparency. Do not crop the plane's lower geometry before the bottom canvas edge.

## Plane 1 — sky

```text
Use case: stylized-concept
Asset type: Plane 1 of a production parallax environment for a 1935 Hollywood side-scrolling game
Input image role: authoritative reference for style, palette, lighting, period, horizon, and painterly finish; extend rather than copy its foreground contents.
Primary request: Render only a seamless-feeling blue Southern California sky with warm cream storybook clouds. This is the fully opaque rear plane. Preserve the reference's vivid hand-painted Golden Age Hollywood storybook finish, crisp illustrative cloud shapes, warm sunlight, subtle painterly texture, and gentle cinematic depth.
Composition/framing: ultrawide 3:1 lateral side-scrolling composition; stable lighting across the full width; clouds distributed naturally without one dominant focal object. Sky and clouds must fill every pixel to all four edges, especially the bottom edge. No empty pixels and no transparency.
Constraints: opaque artwork; sky and clouds only. Apply the shared negative direction. No hillside or HOLLYWOODLAND text on this plane.
```

## Plane 2 — Hollywood hills and landmark

```text
Use case: stylized-concept
Asset type: Plane 2 of a registered five-plane parallax environment
Input image role: authoritative reference for style, palette, lighting, hillside forms, period, horizon, and painterly finish.
Primary request: Render only the distant Hollywood hills and landmark ridge in romanticized 1935 form. Preserve the historical hillside text exactly as “HOLLYWOODLAND”; it is the only lettering permitted. Paint softly detailed sunlit ochre and sage hills with atmospheric depth, matching the reference's vivid hand-painted storybook style.
Scene/backdrop: place the isolated hill artwork against one perfectly uniform, fully opaque, high-contrast solid #ff00ff removal color.
Composition/framing: registered ultrawide lateral view with the landmark around the upper middle-right, leaving believable ridge extension across the width. The hill mass must continue as solid painted terrain all the way down to the bottom edge, even where nearer planes will cover it, providing generous overlap. Keep a clean natural top silhouette.
Constraints: the #ff00ff area must be absolutely flat—no gradient, noise, texture, shadow, glow, reflection, haze, or color variation. Do not use #ff00ff in the hill artwork. Apply the shared negative direction. No buildings or architecture on this plane. No text except “HOLLYWOODLAND”.
```

## Plane 3 — distant buildings

```text
Use case: stylized-concept
Asset type: Plane 3 of a registered five-plane parallax environment
Input image role: authoritative reference for style, palette, lighting, period architecture, horizon, and painterly finish.
Primary request: Render only a continuous distant layer of small 1935 Hollywood buildings stepping across the foothills: restrained Spanish Colonial, Art Deco, and early commercial silhouettes, softened by atmospheric perspective. Preserve the reference's vivid hand-painted storybook look while keeping this layer quieter, smaller, cooler, and less contrasty than the main architecture.
Scene/backdrop: place the isolated architecture against one perfectly uniform, fully opaque, high-contrast solid #ff00ff removal color.
Composition/framing: registered ultrawide lateral side view. Maintain varied rooflines and gaps that reveal Plane 2. Every distant building must continue downward as complete painted wall mass to the bottom edge, creating generous hidden overlap behind Plane 4; never end façades in mid-frame.
Constraints: the #ff00ff area must be absolutely flat—no gradient, texture, shadow, glow, reflection, haze, or color variation. Do not use #ff00ff in the artwork. All signboards and painted wall signs are blank. Apply the shared negative direction. No hillside and no HOLLYWOODLAND text on this plane.
```

## Plane 4 — main architecture

```text
Use case: stylized-concept
Asset type: Plane 4 of a registered five-plane parallax environment
Input image role: authoritative reference for the vivid hand-painted style, warm daylight palette, side-view camera, architectural character, and Golden Age Hollywood mood.
Primary request: Render only the continuous primary street-wall architecture of romanticized Hollywood Boulevard in 1935. Use an appealing sequence of original Spanish Colonial, Art Deco, Streamline Moderne, theater, diner, hotel, office, and shop façades. Preserve the reference's cream stucco, terracotta, jewel-toned awnings, restrained red and gold accents, crisp ornamental shapes, rich window depth, and subtle painterly texture. Improve repetition and provide a dense but readable side-scrolling streetscape.
Scene/backdrop: place the isolated architecture against one perfectly uniform, fully opaque, high-contrast solid #ff00ff removal color visible above and around the roofline.
Composition/framing: registered ultrawide lateral side view with a consistent gameplay-friendly façade scale and only subtle fisheye. Building walls, recessed entries, steps, and permanent foundations must extend continuously to the bottom edge, behind the future sidewalk/street plane, providing generous overlap. Keep the roofline silhouette clean.
Constraints: the #ff00ff area must be absolutely flat—no gradient, texture, shadow, glow, reflection, haze, or color variation. Do not use #ff00ff in the architecture. All marquee faces, storefront sign bands, blade-sign mounts, poster cases, and painted sign panels must be completely blank with no letters, symbols, logos, or legible marks. Apply the shared negative direction. No ground, sidewalk, curb, or roadway on this plane.
```

## Plane 5 — sidewalk and street

```text
Use case: stylized-concept
Asset type: Plane 5 of a registered five-plane parallax environment and the player walk plane
Input image role: authoritative reference for vivid hand-painted materials, warm daylight, boulevard palette, camera height, curb alignment, and 1935 period character.
Primary request: Render only an empty, clean Hollywood Boulevard sidewalk, curb, gutters, and street surface in the reference's romanticized hand-painted storybook style. Include permanent pavement features only: warm concrete slabs, restrained star-shaped terrazzo inlays without names or text, curb cuts, subtle cracks, period-appropriate asphalt, embedded streetcar rails, lane seams, and drainage grates flush with the ground. The surface must be gameplay-readable and must not contain baked object shadows.
Scene/backdrop: place the isolated ground plane against one perfectly uniform, fully opaque, high-contrast solid #ff00ff removal color above its back edge.
Composition/framing: registered ultrawide lateral perspective; straight, stable walkable sidewalk baseline; curb and rail geometry consistent across the width. Painted ground must reach the left, right, and bottom edges and continue beneath the entire bottom of frame. At the rear edge, include generous upward/behind-façade overlap so camera parallax cannot open seams.
Constraints: the #ff00ff area must be absolutely flat—no gradient, texture, shadow, glow, reflection, haze, or color variation. Do not use #ff00ff in the ground artwork. Apply the shared negative direction. No architecture or hills on this plane. Star inlays contain no names, letters, icons, portraits, or logos.
```

## Native-alpha extraction prompt for planes 2–5

Run this as a separate `gpt-image-1.5` edit for each chroma source with `background=transparent`, PNG output, high quality, and high input fidelity:

```text
Use case: background-extraction
Asset type: native-alpha production parallax plane
Primary request: Remove only the perfectly flat solid #ff00ff background and replace it with true alpha-0 transparency. Preserve every non-#ff00ff painted pixel exactly as supplied.
Invariants: do not redraw, regenerate, reinterpret, recolor, relight, retouch, resize, shift, warp, crop, sharpen, blur, extend, or add anything. Preserve the exact canvas dimensions, registration, silhouette, bottom-edge continuation, internal detail, and RGB color of all artwork. Keep opaque artwork alpha 255. Create a clean antialiased transition only at the existing boundary, with no magenta fringe or despill discoloration. Every canvas corner that was #ff00ff must be alpha 0 unless occupied by supplied artwork. Output a genuine RGBA PNG, not a checkerboard or simulated transparency.
Constraints: no new shadows, haze, scenery, objects, text, border, or watermark.
```

## Validation gates

1. Preserve the received chroma masters unchanged. Normalize runtime derivatives to exactly 2,172 × 724; Plane 4 is the only source requiring resampling.
2. Confirm all five runtime files share exactly 2,172 × 724 dimensions and registration, then display them at 3,240 × 1,080 without changing aspect ratio.
3. Confirm Plane 1 has no transparent pixels.
4. Confirm Planes 2–5 are RGBA and contain both alpha 0 and alpha 255 pixels.
5. Confirm all four corners of each alpha plane are transparent unless the approved silhouette intentionally reaches a corner.
6. Inspect at 100% over black, white, and saturated green for magenta fringe, halos, accidental holes, cropped lower geometry, and seams.
7. Composite planes in order and compare horizon, lighting, perspective, and building registration to the approved concepts.
8. Confirm the only readable baked text in the composite is “HOLLYWOODLAND”.
9. Confirm excluded freestanding objects and their shadows are absent.
10. Review the composite in motion at target parallax factors before replacing the current runtime plate.

## Implemented extraction

The received PNG chroma fields contain small RGB variations around `#ff00ff`, so the runtime derivatives were extracted deterministically with the ImageGen skill's `remove_chroma_key.py` helper rather than passed through a generative edit. The matte uses a soft `#ff00ff` boundary with despill, preserving source dimensions and registration. Plane 4 was normalized to the shared runtime resolution before extraction. The original files in `art/assets/` remain unchanged.

Runtime alignment note: Plane 5 is offset downward by 430 display pixels in Phaser so the player foot baseline meets the architectural doorway bases rather than the lower façade. The player baseline and freestanding street props use the same offset.

Plane 4 is offset upward by 117 display pixels so the bottom edge of its doorways meets Plane 5's measured alpha boundary at approximately display Y=963. The casting-office overlay uses the same architecture offset.

## Provenance

```text
asset_id: boulevard_five_plane_v2
asset_type: registered parallax environment set
reference_asset_ids: Hollywoodland_Concept_Boulevard, hollywood-boulevard-concept-v1
generation_tools: gpt-image-2 high-quality source render; deterministic local native-alpha extraction with remove_chroma_key.py
generation_date: 2026-09-13
raw_source_location: art/assets/plane1.png through plane5.png
human_edits: chroma masters preserved; Plane 4 runtime derivative normalized from 2169x725 to 2172x724; native-alpha extraction and visual QA
review_status: approved by the owner 2026-09-19 with the Phase 1 visual spike; the street is now drawn from the v3 art (see boulevard-entrances-v3.md), and these v2 runtime files are no longer referenced by code
rights_or_license_notes: project-owned development generation; human rights/provenance review required
runtime_files: public/assets/environments/boulevard-v2/01-sky.png through 05-sidewalk-street.png
```
