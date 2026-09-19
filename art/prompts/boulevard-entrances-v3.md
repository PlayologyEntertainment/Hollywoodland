# Boulevard entrances v3 brief

Status: **Scope approved by the owner September 18, 2026. Plane 4 is built from per-building modules (approach B, approved). All nine modules are generated, calibrated and staged in `art/generated/boulevard-v3/`, pending owner review. World width is decided: full-size buildings, about 7,450 px. The Plane 5 ground tile and the four active-state variants are also generated and staged (sections 10-11). Planes 1-3 are generated and assembled (sections 12-13), so all five planes now exist in staging. Nothing is promoted to `public/assets/`.**

Supersedes the layout of `boulevard-five-plane-v2.md` (which stays as the record of the current runtime art). Everything not changed here (style, palette, blank-signage policy, chroma-key extraction, validation gates) is inherited from that brief.

## 1. Approved scope

- **Street entrances (8):** Bellhaven Rooms, costume and tailor shop, The Gilded Spoon, alley, The Celestial Palace, Sunset Casting Exchange, The Klieg Light, Monarch Pictures gate.
- **Landmark, not enterable:** transit depot canopy at the left end (arrival point).
- **Behind the Monarch gate (not on the street):** extras corral, soundstage, wardrobe department, screen-test space.
- **Total scenes:** 12 (8 street + 4 lot).
- **Approach (hybrid):** Plane 4 carries painted façades with recessed, styled openings. Transparent overlays exist only for the four locations that change by time slot or quest state.
- **Signage:** every sign panel is baked blank. Names are drawn by code from the manifest using the approved canon names.
- **Costume shop name:** The Silver Thimble (approved by the owner September 18, 2026).

## 2. Delivery contract

- **No stretching.** Every plane is rendered 720 px tall and displayed 1,080 px tall (exact 1.5x). The v2 planes were drawn 3:1 but displayed at 4,650 x 1,080, a ~1.44x horizontal stretch; v3 removes it. The scene must stop calling `setDisplaySize(worldWidth, 1080)` and use the native 1.5x scale (engineering follow-up).
- **World width:** originally planned at 5,664 display px. With the full-size Plane 4 modules it is about **7,450** (see section 8); the owner decided September 18, 2026 to keep the full-size buildings (about 7,450), and the numbers below must be recomputed from it (at 7,450: Plane 2 about 2,916 and Plane 3 about 4,244 display px).
- **Plane widths are sized to their parallax need** (`display width = 1,920 + scrollFactor x (world width - 1,920)`). The table shows the original 5,664 px plan:

| Plane | scrollFactor | Source size | Display width |
|---|---|---|---|
| 1 Sky | 0 | 1,280 x 720 | 1,920 |
| 2 Hills and landmark | 0.18 | 1,744 x 720 | 2,616 |
| 3 Distant buildings | 0.42 | 2,336 x 720 | 3,504 |
| 4 Main architecture | 1 | Segment A 2,176 x 720 + Segment B 1,600 x 720 | 3,264 + 2,400 = 5,664 |
| 5 Sidewalk and street | 1 | Segment A 2,176 x 720 + Segment B 1,600 x 720 | 5,664 |

- **Superseded for Plane 4** by the building modules in section 5 (segments left a seam and a per-render scale problem). It still describes how Plane 5 would be built if made in segments. Original text: Segments A and B are registered and join at source x = 2,176 (display x = 3,264). The seam sits in a plain cream stucco wall on both sides, with the roofline at the same height, so no entrance straddles it. Segment B is generated after A, using A's right-most 320 px as a continuation reference.
- **Chroma workflow for planes 2-5** (same as v2): render against flat `#ff00ff`, keep the chroma master unchanged in `art/generated/boulevard-v3/`, extract native alpha deterministically with the ImageGen skill's `remove_chroma_key.py`. Plane 1 is fully opaque. Planes 2-5 continue as solid painted mass to the bottom edge.
- **Overlays** are generated with `--background transparent`, then alpha-normalized (alpha >= 250 to 255, <= 3 to 0), as done for the character portraits.
- **Only baked text:** the hillside "HOLLYWOODLAND" on Plane 2.
- **Reference art for every plane:** `art/assets/plane*.png` chroma masters (v2), `art/Hollywoodland_Concept_Boulevard.png`, and, for entrances, the matching interior in `public/assets/locations/*.webp`.

## 3. Entrance list, order, and look

The Segment and x columns below are the original first-pass plan and are **superseded**: with modules, each entrance's x is its module's position plus its door center, computed from `art/generated/boulevard-v3/runtime/calibration.json` once the world width and module order are final (order is unchanged). Positions stay tunable in the Art Director tool. Each entrance is ~350-450 px wide (~230-300 source px) and must read clearly at gameplay scale.

| # | Entrance | Segment, ~x | Look, tied to its scene | Overlay |
|---|---|---|---|---|
| - | Depot canopy (landmark) | A, 0-620 | Open-air platform shelter, blank sign panel, arrival mood | none |
| 1 | Bellhaven Rooms | A, 950 | Warm stucco boarding house, three-step stoop, lit bay window with curtains, flower boxes, house-number plate. Echoes the sunlit lodging room (`boarding-house.webp`) | none |
| 2 | Costume and tailor shop | A, 1,500 | Narrow front, striped awning, large display window with dress forms and fabric bolts, scissors-shaped blade-sign bracket (blank) | none |
| 3 | The Gilded Spoon | A, 2,050 | Curved streamline glass corner, chrome banding, red-and-white awning, teal tile base. Echoes the chrome-and-checker diner (`diner.webp`) | lit / open |
| 4 | Alley | A, 2,650 | Dim gap between two brick walls, fire escape, arched service gate slightly ajar, hanging lantern | none |
| 5 | The Celestial Palace | B, 22% (~3,790) | Pagoda-roofed movie palace, red-carpeted entrance, gilded doors, blank marquee. Lobby interior is new | marquee lit |
| 6 | Sunset Casting Exchange | B, 50% (~4,464) | Dignified Art Deco office block, brass double doors, green awning, tall sunburst panel. Echoes the mahogany office (`casting-office.webp`) | open |
| 7 | The Klieg Light | B, 73% (~5,016) | Red-brick newsroom, steel-framed window, frosted-glass door, klieg-lamp blade-sign bracket (blank) | none |
| 8 | Monarch Pictures gate | B, 88% (~5,376) | Monumental stucco arch, wrought-iron double gate, green-roofed guard booth, red-and-white barrier arm. Echoes the backlot gate scene (`backlot-gate.webp`) | barrier up |

**Overlay assets (4):** the base plane shows each changing location in its default state (Spoon dark, Palace marquee dim, Casting Exchange shuttered, Monarch gate closed with the barrier down). One transparent overlay per location supplies the active state (Spoon open and lit, Palace marquee lit, Casting Exchange door open with lit window, Monarch gate open with the barrier raised). Each overlay is registered to Plane 4 and fully covers the base door area. This gives every changing location two states with 4 assets instead of 8. (Delivered as full-module state variants that the engine swaps, because an overlay can only add pixels and could not hide the closed gate; see section 11.)

## 4. Shared blocks

`[NEG]` expands to this text, verbatim, in every plane prompt:

```text
Do not render people, silhouettes of people, crowds, characters, animals, vehicles, streetcars, bicycles, freestanding lamps, traffic lights, utility poles, wires, palms, trees, shrubs, potted plants, planters, flags, banners, freestanding signs, benches, tables, chairs, hydrants, bins, newspaper boxes, bollards, parking meters, loose props, litter, clutter, logos, watermarks, borders, captions, or text. Do not bake shadows from excluded objects. Do not create checkerboard transparency. Do not crop the plane's lower geometry before the bottom canvas edge.
```

`[CHROMA]` expands to this text, verbatim, in planes 2-5:

```text
Place the isolated artwork against one perfectly uniform, fully opaque, high-contrast solid #ff00ff removal color. The #ff00ff area must be absolutely flat: no gradient, noise, texture, shadow, glow, reflection, haze, or color variation. Do not use #ff00ff in the artwork.
```

Window boxes, awnings, and door hardware attached to a building are architecture and are allowed; freestanding objects are not.

## 5. Prompts

### Plane 4 as building modules (approved approach B, September 18, 2026)

Plane 4 is no longer one rendered image. It is a row of separately generated, transparent building modules placed along the street, with plain filler wall pieces between them. Reasons: no seam, no cross-render scale problem, each building can be regenerated alone, and each render gets the whole pixel budget (about 2.5x the detail per building of the Segment A trial). This follows `CONTENT_AND_ASSET_PIPELINE.md` section 4 (doors and altered props as separate assets).

**Module contract**

- One building per render, requested with `--background transparent` and `--quality high`. The backend chooses the final canvas size; keep every master untouched in `art/generated/boulevard-v3/modules/`.
- Flat frontal elevation, warm light from the upper right, left and right edges cut flat like party walls, base flush with the bottom edge, no ground or cast shadow.
- **Scale calibration in post:** measure the ground-floor entrance door height in each master and scale the module so that door is exactly 200 display px (133 source px at the 1.5x plane scale). All modules then share one scale regardless of the canvas the backend returned.
- **Bottom overlap in post:** extend each module's bottom rows downward by 40 display px so no gap can open above Plane 5.
- Default states baked in (Spoon dark, Palace marquee dim, Casting Exchange shuttered, Monarch gate closed). Active states are the overlays in section 5 below.
- The Segment A trial render (`art/generated/boulevard-v3/plane4-a-chroma.png`) is the style, lighting, and relative-scale reference for every module, plus the v2 plane and boulevard concept.

**Module prompt template** (`[MODULE_NAME]`, `[MODULE_DESIGN]` filled from the per-module designs below; `[NEG]` from section 4):

```text
Use case: stylized-concept
Asset type: one building module of the main street wall (Plane 4) of a registered parallax environment for a 1935 Hollywood side-scrolling game. It will be placed on a street beside other separately made modules.
Input image roles: Image 1 shows already-approved buildings from the same street. Match its exact painting style, materials, warm sunlight from the upper right, and the relative size of doors and windows, but do NOT copy any building from it. Image 2 is the boulevard style concept and Image 3 is the earlier street plane; use them for style only. Image 4 shows the mood of the interior behind this entrance, for atmosphere only.
Primary request: Render exactly one building: [MODULE_NAME]. [MODULE_DESIGN] Preserve the reference's vivid, romanticized, hand-painted Golden Age Hollywood storybook look: cream stucco, terracotta, jewel-toned awnings, restrained red and gold accents, crisp ornamental shapes, rich window depth and subtle painterly texture.
Composition/framing: strict flat frontal elevation as seen by a side-scrolling camera, with only the most subtle depth cues and no perspective recession. No side walls are visible. The left and right edges of the building are flat vertical cuts, like party walls, so the module can be set directly against neighboring modules. The base of the foundation sits flush with the bottom edge of the image and is cut flat there. Draw no sidewalk, curb, road, ground plane or cast shadow on the ground. The roofline, spire or chimney stays fully inside the top edge with a small margin. The building fills most of the frame. Scale: the main ground-floor entrance door is about 28 percent of the building's total height for a typical two-storey building; taller buildings show more storeys above the same door size.
Constraints: fully transparent background with true alpha, with nothing behind the building. Every sign panel, marquee face, blade-sign mount, poster case, plaque and painted sign is completely blank with no letters, numerals, symbols, logos or legible marks. Any interior visible through glass is dim and generic. [NEG] Attached architectural details such as awnings, window boxes, lanterns and door hardware are allowed; freestanding objects are not.
```

**Module designs**

#### module: depot-canopy

```text
Depot canopy: an open-air transit depot shelter that marks the arrival point. A flat, gently curved-cornered canopy roof with polished chrome-and-red banding and a large blank sign panel framed in teal sits on slim cream stucco pillars with recessed round lamps under the roof. Behind the pillars is an open covered platform bay with a plain back wall and a small ticket window with a green awning, its glass showing only dim interior. Teal tile base along the pillars. Welcoming and quietly hopeful, with no door.
```

#### module: bellhaven-rooms

```text
Bellhaven Rooms: a warm buttery-stucco two-storey boarding house. A terracotta tile roof with a small shaped gable, arched upper windows with curtains, and window boxes of pink flowers under the upper windows. At street level: a three-step stoop, a wooden front door with a brass handle under a small tiled awning, a glowing amber bay window with lace curtains, two wall lanterns, a blank brass plaque, and teal trim and tile base. Cozy, lived-in and safe, echoing a sunlit rented room.
```

#### module: costume-tailor-shop

```text
Costume and tailor shop: a narrow two-storey cream stucco shopfront with an arched upper window and a small carved crest. A striped teal-and-red canvas awning shades a large display window showing two dress forms in period gowns and bolts of fabric under warm lamps, beside a teal door with a brass push plate. A blank sign band above the awning, and a wrought-iron blade-sign bracket holding a large scissors-shaped ornament (no text). Teal tile base. Crafty and inviting.
```

#### module: gilded-spoon

```text
The Gilded Spoon diner: a streamline-moderne diner with a curved glass corner front, polished chrome banding, bands of red enamel above the windows, chrome cylindrical tanks and a tall red neon-style stack on the roof (unlit), a red-and-white striped scalloped awning, and a teal tile base. The glass door is chrome-framed with an oval window. Default state: closed and dark, with only dim red booths and stools visible as shapes inside. Blank sign band.
```

#### module: alley

```text
Alley mouth: a gap between two brick buildings forming a narrow alley entrance. On each side is the flat-cut end of a red-brick wall with darker soot-stained mortar, one with a black iron fire escape and ladder. Between them the alley recedes into deep painted shadow with a few hazy warm windows far back, closed by an arched wooden service gate standing slightly ajar, with a small wrought-iron lantern hanging above it. The alley opening is filled with opaque painted shadow, not transparency. Slightly mysterious.
```

#### module: celestial-palace

```text
The Celestial Palace: a grand pagoda-roofed movie palace. A jade-green tiered pagoda roof with upturned corners and dark ornamental finials crowns a gilded and red-lacquer facade with tall red piers, blue-and-gold column bands, and relief panels and friezes of gilded stars, crescent moons, sunbursts and film-strip motifs. The theme is celestial and stardom; use no dragons, no animals and no figural or ethnic-revival ornament. A large blank marquee panel sits over the entrance with rows of unlit bulbs (default state: dim). A red-carpeted stair leads to brass double doors under an ornate gold canopy, flanked by two tall black-and-gold lanterns and two blank poster cases. Glamorous and theatrical. Compact proportions: the whole building, including the roof, is only about 4.5 times the height of its double doors, so the pagoda roof is one wide, low-slung roof of two modest tiers with a small finial, not a tall tower; the grand double doors are large, about 22 percent of the total building height.
```

#### module: sunset-casting-exchange

```text
Sunset Casting Exchange: a dignified Art Deco office block. Tall vertical piers with stepped setbacks and relief carving, a tall sunburst-relief panel in gold and cream on the upper facade, and steel-framed windows. At street level are polished brass double doors under a green canvas awning, a blank brass plaque beside them, and two wall lanterns. Default state: closed for the day, with roller shutters or drawn venetian blinds on the ground-floor windows. Confident and professional, echoing a mahogany-and-brass office.
```

#### module: klieg-light-office

```text
The Klieg Light newspaper office: a workmanlike two-storey red-brick newsroom front with pale stone arched lintels and a stone band course. A large steel-framed multi-pane window shows a dim newsroom, beside a frosted-glass door with a brass handle. A metal canopy over the entrance, a bare wrought-iron blade-sign bracket holding an ornament shaped like a studio spotlight with a conical lamp housing (no text), and upper windows with warm lamplight. Busy and slightly gritty, but still storybook-bright.
```

#### module: monarch-gate

```text
Monarch Pictures studio gate: a monumental cream stucco arched gateway with stepped pylons topped by ornaments, and a large blank sign panel across the arch. A closed wrought-iron double gate with gold-tipped bars fills the arch. Beside it stands a small green-roofed guard booth with a window, and a red-and-white striped barrier arm lowered across the entrance. Flanking low stucco wall wings with wall lanterns extend to each side. Imposing but inviting, echoing a busy studio backlot.
```

Interior mood references: depot none; Bellhaven `boarding-house.webp`; costume shop none; Spoon `diner.webp`; alley none; Palace none; Casting `casting-office.webp`; Klieg Light none; Monarch `backlot-gate.webp`. Where no interior exists, only Images 1-3 are passed.

### Superseded: Plane 4 segments (record of trial 1)

The two prompts below produced the Segment A trial and are kept for provenance. They are not used for production.

### Plane 4, Segment A (2,176 x 720) [trial]

```text
Use case: stylized-concept
Asset type: Plane 4 (main street-wall architecture), Segment A of 2, of a registered five-plane parallax environment for a 1935 Hollywood side-scrolling game
Input image roles: Image 1 is the authoritative reference for the vivid hand-painted storybook style, warm daylight palette, side-view camera, architectural character and Golden Age Hollywood mood; Image 2 is the style concept for the overall boulevard; Image 3 shows the mood of the interior behind the boarding-house entrance (warm, sunlit, cozy, wood and wallpaper); Image 4 shows the mood of the interior behind the diner entrance (chrome, red, black-and-white checker). Use the images for style and mood only; do not copy their compositions or contents.
Primary request: Render only the continuous street-wall architecture of romanticized Hollywood Boulevard in 1935, left to right, as one seamless facade sequence containing exactly these zones, each with one clearly readable entrance at ground level, evenly spaced and roughly 230-300 px wide in this 2,176 px canvas:
Zone 0, far left, 0%-19% of the width: a quiet arrival end. A low stucco corner building and an open-air transit depot shelter with a simple flat canopy and a blank sign panel. No door needed here.
Zone 1, about 29%: BELLHAVEN ROOMS, a warm buttery-stucco boarding house with a three-step stoop, a glowing amber bay window with curtains, small window flower boxes, a brass house-number plate with no digits, and a welcoming porch light. Cozy, lived-in, safe.
Zone 2, about 46%: a narrow costume-and-tailor shop with a jewel-toned striped awning, a large display window showing dress forms and fabric bolts, and an empty scissors-shaped blade-sign bracket.
Zone 3, about 63%: THE GILDED SPOON diner, a curved streamline-moderne glass corner with polished chrome banding, a red-and-white striped awning, and a teal tile base. It is dark and closed in this default state, interior visible only as dim shapes.
Zone 4, about 81%: an alley mouth between two brick walls, a rusted fire escape, an arched wooden service gate slightly ajar, a small hanging lantern, and deep shadow beyond. Slightly mysterious.
Between zones: original Spanish Colonial, Art Deco, and early-commercial wall stretches with cream stucco, terracotta accents, arched windows and restrained red and gold, varied rooflines. The final 6% at the right edge is a plain cream stucco wall with a flat roofline at the same height as the left edge, so the next segment can continue it seamlessly.
Composition/framing: registered ultrawide lateral side view with a consistent gameplay-friendly facade scale and only subtle fisheye. Building walls, recessed entries, steps and permanent foundations extend continuously to the bottom edge, providing generous overlap behind the future sidewalk plane. Keep the roofline silhouette clean against the removal color.
Constraints: [CHROMA] All marquee faces, storefront sign bands, blade-sign mounts, poster cases, plates and painted sign panels are completely blank with no letters, numerals, symbols, logos or legible marks. [NEG] No ground, sidewalk, curb or roadway.
```

### Plane 4, Segment B (1,600 x 720)

Generate after A is approved. Extra reference: the right-most 320 px of Segment A, cropped, as the continuation strip.

```text
Use case: stylized-concept
Asset type: Plane 4 (main street-wall architecture), Segment B of 2, continuing Segment A of a registered five-plane parallax environment for a 1935 Hollywood side-scrolling game
Input image roles: Image 1 is the authoritative style reference; Image 2 is the boulevard concept; Image 3 is the right-most strip of Segment A, which this image must continue seamlessly, matching wall color, roofline height and rendering at the shared left edge; Images 4 and 5 show the moods of the interiors behind the casting-office entrance (mahogany, brass, green leather) and the studio gate entrance (striped barrier, guard booth, iron fence). Use the images for style and mood only.
Primary request: Render only the continuation of the street-wall architecture to the right, as one seamless facade sequence with these zones, each with one clearly readable entrance at ground level:
Left 0%-6%: continue the plain cream stucco wall from Image 3, same roofline height, no seam or step.
Zone 5, about 22%: THE CELESTIAL PALACE, a grand pagoda-roofed movie palace with a jade-green tiered roof, a gilded and red-lacquer facade, a red-carpeted entrance with steps and brass doors, and a large blank marquee panel, dim in this default state (unlit bulbs). Glamorous and theatrical.
Zone 6, about 50%: SUNSET CASTING EXCHANGE, a dignified Art Deco office block with tall vertical piers, a tall sunburst-relief panel, polished brass double doors, a green canvas awning, and shuttered windows in this default state. Confident, professional.
Zone 7, about 73%: THE KLIEG LIGHT newspaper office, a red-brick newsroom front with a large steel-framed window, a frosted-glass door, and a bare bracket for a blade sign shaped like a studio spotlight. Busy, workmanlike.
Zone 8, about 88%: the MONARCH PICTURES studio gate, a monumental cream stucco arch with a blank sign panel, a wrought-iron double gate closed in this default state, a small green-roofed guard booth, and a red-and-white striped barrier arm lowered across the entrance. Imposing but inviting.
Between zones: original Spanish Colonial, Art Deco, and early-commercial wall stretches, same materials and palette as Segment A. The right edge ends at the studio wall, a plain cream stucco wall finishing the street.
Composition/framing: registered ultrawide lateral side view, same facade scale, horizon and lighting as Segment A. Walls, recessed entries, steps and foundations extend continuously to the bottom edge.
Constraints: [CHROMA] All marquee faces, sign bands, blade-sign mounts, poster cases and painted sign panels are completely blank with no letters, numerals, symbols, logos or legible marks. [NEG] No ground, sidewalk, curb or roadway.
```

### Plane 5, Segments A and B (sidewalk and street)

Same contract as v2 Plane 5 (`boulevard-five-plane-v2.md`), with sizes 2,176 x 720 and 1,600 x 720 and these permanent threshold features registered under the Plane 4 entrances: a three-step stoop base at Bellhaven Rooms, a plain sidewalk apron at the shop and Spoon, alley pavement running back between the brick walls, a red-carpet-edged landing at the Celestial Palace, a curb cut and a gate driveway apron at the Monarch gate, and a raised concrete platform edge at the depot. Star-shaped terrazzo inlays carry no names or text. Generate after Plane 4 is approved so thresholds can be registered to its doorways.

### Planes 1-3

Same prompts as v2 with these changes only: Plane 1 is 1,280 x 720 (screen-fixed); Plane 2 is 1,744 x 720 with the "HOLLYWOODLAND" landmark at the upper middle-right; Plane 3 is 2,336 x 720. Planes 2-3 use `[CHROMA]` and `[NEG]`.

### Overlays (transparent, one per changing location)

```text
Use case: stylized-concept
Asset type: transparent state overlay for one Boulevard entrance, registered to the Plane 4 facade
Input image roles: Image 1 is the approved Plane 4 segment crop showing this entrance in its default state; match its perspective, scale, materials and lighting exactly.
Primary request: Redraw only the entrance area of the [LOCATION] facade in its active state: [ACTIVE STATE DESCRIPTION]. Cover the whole default-state door, window and awning area so nothing of the default state shows through; extend to the edges of that area and fade into nothing beyond it.
Constraints: transparent background, no scenery beyond the entrance area, no people, no text, no glow spilling outside the entrance area, no drop shadow. Blank signage.
```

Active states: The Gilded Spoon = door open and warm interior lights on, glass reflecting amber, awning lit from below. The Celestial Palace = marquee bulbs lit, doors open with gold light from the lobby. Sunset Casting Exchange = brass door open, shutters up, warm window light and a green desk lamp visible inside. Monarch gate = iron gate open, barrier arm raised.

## 6. Validation gates

Inherits the v2 gates and adds:

1. Every entrance in section 3 is present, readable at 1.5x display scale, and matches its interior's mood.
2. Segment A and B join with no visible seam in wall color, roofline, or lighting; roofline heights match to within 2 px.
3. No entrance straddles the seam.
4. All sign panels are blank; the only baked text is "HOLLYWOODLAND".
5. Doorway bottoms land within 4 px of one shared ground baseline.
6. Overlays fully cover their default-state areas when composited, with no ghosting.
7. Composite in the running scene, unstretched, before any manifest change is committed.

## 7. Trial 1 findings (Plane 4, Segment A, 2026-09-18)

Two renders were made from the Segment A prompt. Both kept in `art/generated/boulevard-v3/`: `plane4-a-trial1-backend-alpha.png` (requested with automatic background) and `plane4-a-chroma.png` (requested with `--background opaque`).

**Design result: strong.** All five zones read clearly at a glance: depot canopy with blank sign panel, Bellhaven Rooms (bay window, stoop, flower boxes, porch lamps), the costume shop (striped awning, dress forms, scissors bracket), The Gilded Spoon (chrome bands, red-and-white awning, teal tile), and the alley (brick walls, fire escape, ajar arched gate, lantern). The right edge is plain stucco as specified. No baked text.

**Pipeline findings that change the plan:**

1. **The backend always removes the `#ff00ff` itself.** Both renders came back as RGBA cutouts even with `--background opaque`. The untouched chroma master that v2 kept (and its deterministic `remove_chroma_key.py` step) cannot be reproduced through `gg-image`. The backend's own extraction is clean in practice: 0 magenta-ish visible pixels and no halo when composited over a solid color. (The yellow-red fringe some image viewers show is leftover color stored in transparent pixels, not real; a defringe pass made the edges worse and is not used.)
2. **The canvas size is not honored.** Requested 2,176 x 720; received 1,828 x 860 and 2,058 x 764. Both are about 1.57 MP, so the backend keeps the pixel budget but chooses its own aspect and trims to content. Every generation therefore has a different scale and size.
3. **No bottom overlap.** Facades end 36 px above the bottom edge (buildings stop at y = 727 of 764). The brief requires them to continue to the bottom edge. This is fixable deterministically by extending the bottom rows downward in post.
4. **Consequence for Segments A and B:** because scale varies per render, the two segments cannot be joined by registration alone. Each would need calibrating in post (ground line and door height), and the seam wall would still need visual matching.

**Open decision:** keep the two-segment approach with calibration, or build Plane 4 from per-entrance building modules (one transparent image per entrance plus plain filler wall pieces), which removes the seam and the cross-render scale problem and matches `CONTENT_AND_ASSET_PIPELINE.md` section 4 (doors and altered props as separate assets).

## 8. Module results (approach B, 2026-09-18)

All nine modules were generated one building per render (`gpt-image-2`, `--background transparent`, `--quality high`, `--size 1536x1536` requested; the backend returned 1,024-1,536 px canvases). References were compressed JPG copies of the approved Segment A trial, the boulevard concept, and the v2 plane, plus the matching interior where one exists. Masters are untouched in `art/generated/boulevard-v3/modules/`.

**Review:** every module passed a visual check for baked text (none; all signs, plaques, marquees and poster cases blank), style consistency, and transparency. The Celestial Palace was regenerated twice: the first render added dragon reliefs (against the approved canon's "sidestep ethnic-revival ornament" note; kept as `celestial-palace-v1-dragons-master.png`), and the second was too tall to fit at door scale (door leaf only 15% of building height; kept as `celestial-palace-v2-tall-master.png`). The third uses a celestial star/moon/sunburst motif and a compact two-tier roof.

**Calibration** (script and numbers in `art/generated/boulevard-v3/runtime/calibration.json`): each master is trimmed to its content, short bottom gaps extruded flat, scaled so the ground-floor door leaf is **190 display px**, resampled premultiplied (no edge bleed) at 1.5x runtime resolution, given a hidden 40 display px overlap strip below the ground line, and alpha-normalized (>= 250 to 255, <= 3 to 0).

| Module | Door leaf, master px | Display scale | Display size (w x h) |
|---|---|---|---|
| Depot canopy | none (canopy underside = 1.6 x leaf) | 0.595 | 871 x 539 |
| Bellhaven Rooms | 813-1064 | 0.757 | 873 x 867 |
| Costume and tailor shop | 1012-1432 | 0.452 | 331 x 644 |
| The Gilded Spoon | 688-1053 | 0.521 | 715 x 542 |
| Alley | 1055-1429 | 0.508 | 488 x 731 |
| The Celestial Palace | 743-970 | 0.837 | 1,171 x 872 |
| Sunset Casting Exchange | 826-1090 | 0.720 | 920 x 799 |
| The Klieg Light | 700-980 | 0.679 | 835 x 682 |
| Monarch Pictures gate | 657-941 (guard-booth door) | 0.669 | 1,009 x 619 |

**Finding: the street is longer than approved.** At a shared door scale the nine modules total **7,213 display px**, about **7,450 px** with margins, versus the approved ~5,664 px and today's 4,650 px. Buildings are simply wider than the 350-450 px per entrance I estimated. At the 390 px/s walk speed, end to end is about 19 s (12 s today). Options: keep full buildings (~7,450), or trim plain wall wings at natural pilaster cuts (Palace, Monarch gate, Bellhaven, Casting Exchange) to reach roughly 6,300-6,600. **Owner decision (2026-09-18): keep full buildings, about 7,450 px, no trimming.**

**Other notes:** the Monarch gate's iron bars are transparent, so Plane 3 shows through (a "lot beyond" backdrop may be wanted later). The Klieg Light's spotlight blade sign overhangs the module's right edge by design. The depot and alley have transparent gaps by design (open bays, alley sky).

## 9. Provenance

Records are appended below as each asset is generated.

```text
asset_id: boulevard_v3_plane4_segment_a (trial)
asset_type: registered parallax plane segment, chroma master
prompt_or_brief: Plane 4, Segment A prompt in this file
reference_asset_ids: art/assets/plane4.png (v2 chroma master), Hollywoodland_Concept_Boulevard, boarding-house interior, diner interior
generation_tool_and_version: gpt-image-2 via gg-image
generation_date: 2026-09-18
raw_source_location: art/generated/boulevard-v3/plane4-a-trial1-backend-alpha.png (1828x860) and art/generated/boulevard-v3/plane4-a-chroma.png (2058x764, backend-extracted RGBA; file name is historical)
human_edits: none (a defringe experiment was run on a scratch copy and discarded)
review_status: pending review
rights_or_license_notes: project-owned development generation; human rights/provenance review required
runtime_files: not yet promoted
```

```text
asset_id: boulevard_v3_plane4_modules
asset_type: nine transparent building modules forming Plane 4 (main street wall)
prompt_or_brief: "Module prompt template" plus the per-module designs in section 5 of this file
reference_asset_ids: boulevard_v3_plane4_segment_a trial, Hollywoodland_Concept_Boulevard, art/assets/plane4.png (v2), and where one exists the matching interior (boarding-house, diner, casting-office, backlot-gate)
generation_tool_and_version: gpt-image-2 via gg-image, --background transparent, --quality high
generation_date: 2026-09-18
raw_source_location: art/generated/boulevard-v3/modules/*-master.png (Palace v1 and v2 kept as -v1-dragons and -v2-tall)
human_edits: deterministic calibration only (trim, bottom flatten, door-height scale, premultiplied resize, 40 display px overlap strip, alpha normalization); no repainting
review_status: pending review
rights_or_license_notes: project-owned development generation; human rights/provenance review required. Place names are approved canon; the costume shop's name, The Silver Thimble, is owner-approved.
runtime_files: not yet promoted; calibrated staging PNGs in art/generated/boulevard-v3/runtime/
```

## 10. Plane 5 (ground) and state overlays

Status: approach and prompts recorded 2026-09-18 before generation. Results are appended in section 11.

### Plane 5: ground tile

The ground is a repeating strip, not one wide image. A single tile is generated, then made seamless by mirroring (`[T | mirror(T)]` repeats with no blend seam), and tiled across the world (a tile sprite in the scene). The visible part on screen is only the top ~120 display px (sidewalk and curb lip) above the walk baseline; the rest is kept for camera margin. The top edge is the building line at display y = 963, where the module ground rows sit and their hidden 40 px overlap tucks under the slabs.

```text
Use case: stylized-concept
Asset type: Plane 5 (sidewalk and street ground) tile for a 1935 Hollywood side-scrolling game; a horizontal strip that will be repeated left to right
Input image roles: Image 1 is the approved earlier ground strip: match its materials, warm daylight color, slab proportions, star inlay style and camera height exactly, but do not copy its layout. Image 2 is the boulevard style concept. Image 3 shows the finished building fronts that will stand on this ground; match their warm sunlight.
Primary request: Render only an empty, clean horizontal cross-section strip of a Hollywood Boulevard sidewalk and street. At the top edge, warm concrete sidewalk slabs meet the line where building bases will stand (the top edge is a perfectly straight horizontal line). Show joints between slabs and subtle cracks. Two or three slabs carry a terracotta-red five-pointed star terrazzo inlay with no names, letters, or symbols. Below the slabs are a worn granite curb lip, a narrow gutter with one flush drain grate, then asphalt roadway with two embedded steel streetcar rails running horizontally and a faint lane seam. Vivid hand-painted storybook rendering, romanticized 1935.
Composition/framing: straight-on orthographic side-scroller view with only a slight downward tilt and no converging perspective: every slab joint on the sidewalk is a perfectly vertical straight line and every other line is perfectly horizontal, and the star inlays are upright and symmetrical, so the strip looks natural when mirrored left to right; the strip fills the entire canvas edge to edge, with no sky, no building, and no border. The content within 15 percent of the left and right edges is a plain stretch of slab, curb, gutter and asphalt with no star, drain grate, or other feature, so the strip can be mirrored and repeated.
Constraints: fully opaque artwork; no people, vehicles, litter, signs, poles, plants, or loose props; no cast shadows from objects; no text, letters, numerals, logos, or symbols anywhere.
```

### Plane 5: ground details (transparent overlays on the sidewalk)

Two small pieces for places the plain tile cannot cover, each registered to the ground line: a **driveway apron** with a lowered curb cut for the Monarch gate, and **cobbled alley paving** that runs back from the alley mouth. The depot needs no piece; its module already carries its own tile base and platform bays. Prompts are written when generated.

### State overlays (four)

Each active state is made by editing the untouched module master with the edit prompt below (the model must change only the entrance area), then keeping only a feathered rectangle around the entrance from the edited image, composited over the base module pixels. Everything outside the rectangle stays identical to the base, so registration is exact. The overlay is then trimmed, scaled, and alpha-normalized with the same transform as its base module.

Edit prompt template (`[STATE]` filled per location):

```text
Edit this building image. Keep the building, its framing, its position, its scale, its colors, and every architectural detail outside the entrance area exactly identical, pixel for pixel. Change only the entrance area to its active state: [STATE] Keep the transparent background transparent. Do not add text, letters, numerals, people, or objects. Every sign panel and marquee face stays completely blank.
```

- **The Gilded Spoon (open and lit):** the interior lights are on with a warm amber glow behind the windows, the blinds are raised so the red booths and chrome stools show clearly, the glass door is lit, and the awning is lit from below.
- **The Celestial Palace (marquee lit):** every bulb around the marquee and canopy is lit bright warm gold, the marquee panel glows softly but stays blank, the lobby doors glow gold, and the two lanterns are brighter.
- **Sunset Casting Exchange (open):** the blinds are raised on the ground-floor windows, warm lamplight and a green desk lamp show inside, the brass door glass is lit, and the wall lanterns are lit.
- **Monarch Pictures gate (open):** the iron gate leaves are swung fully open and folded back against the pylons, and the red-and-white barrier arm is raised to a near-vertical position.

## 11. Plane 5 and state results (2026-09-18)

### Ground tile

- The ground was generated twice. The first tile (`ground-tile-v1-perspective-master.png`) drew slab joints converging to a central vanishing point, which made the mirror seam show as a chevron; the prompt was changed to an orthographic strip with vertical joints (section 10) and the second tile is the one used. The backend returned 2,171 x 724, fully opaque (a ground is inherently opaque, so the transparent-background rule does not apply to it).
- **Processing:** the leftover dark band above the sidewalk was cropped off (rows above 46 px), the tile resampled to 2,048 px wide, and mirrored into a 4,096 x 640 seamless repeat unit (`art/generated/boulevard-v3/runtime/ground-tile.png`; 4,096 is the safe texture width on older GPUs). At 3x zoom the mirror joint and the wrap joint are near-invisible; the cracks mirror softly.
- **Use:** repeat horizontally in the scene (a tile sprite) with its top edge at display y = 963, at engine scale 2/3 (runtime pixels are 1.5x display). At that scale the sidewalk slabs are about 147 display px wide, in proportion to the 190 px door leaf. Only the top ~120 display px are on screen above the walk baseline.
- **Tunable:** stars repeat about every 360 display px at this scale, a little regular. If it reads as too even, use a second tile variant or a larger tile scale.
- **Deferred (optional polish):** the driveway apron (curb cut) at the Monarch gate and cobbled alley paving are not generated; the plain sidewalk runs under every module and each module carries its own stoop or base.

### State variants (four)

Each was made by editing the untouched module master (`--edit-target`, `--background transparent`) with the section 10 edit prompt. All four edits returned at the base module's canvas size (the Spoon 1 px wider, resized back) and changed only the intended area in substance, with hair-thin resampling differences elsewhere. Only a feathered rectangle around each entrance is taken from the edit; everything outside is the untouched base, so registration is exact (masks in `art/generated/boulevard-v3/runtime/states.json`).

**Delivered as variants, not overlays:** an overlay can only add pixels, and the open Monarch gate has to remove the closed gate. So each active state is a full-module image with the same size and transform as its base module (`<id>-active.png`), and the scene swaps textures between default and active.

| Location | Default (base module) | Active variant |
|---|---|---|
| The Gilded Spoon | dark, blinds down | interior lights on, blinds up, booths and stools visible, door and awning lit |
| The Celestial Palace | dim marquee | marquee and canopy bulbs lit gold, lobby doors and lanterns glowing (marquee stays blank) |
| Sunset Casting Exchange | shuttered | blinds up, lamps and a green desk lamp inside, door glass and lanterns lit |
| Monarch Pictures gate | gate closed, barrier down | gate leaves folded back against the pylons, barrier arm raised near-vertical |

**Notes:** with the gate open, the arch shows whatever is behind the street wall (Plane 3 in the scene); a "studio lot beyond" backdrop layer is worth adding later. Nothing baked as text.

```text
asset_id: boulevard_v3_plane5_ground_and_state_variants
asset_type: seamless ground tile plus four active-state module variants
prompt_or_brief: sections 10 and 11 of this file
reference_asset_ids: v2 ground strip crop, Hollywoodland_Concept_Boulevard, composite preview of the nine modules (ground); the nine module masters (state edits)
generation_tool_and_version: gpt-image-2 via gg-image (ground: generate, opaque; states: edit, transparent)
generation_date: 2026-09-18
raw_source_location: art/generated/boulevard-v3/ground/ (ground-tile-master.png; v1 kept), art/generated/boulevard-v3/overlays/ (*-active-edit-master.png raw edits, *-active-master.png composites)
human_edits: deterministic processing only (ground: crop, resample, mirror; states: feathered entrance mask composite, same calibration as the base modules, alpha normalization); no repainting
review_status: pending review
rights_or_license_notes: project-owned development generation; human rights/provenance review required
runtime_files: not yet promoted; staging PNGs in art/generated/boulevard-v3/runtime/ (ground-tile.png, *-active.png, states.json)
```

## 12. Planes 1-3 (sky, hills, distant buildings)

Status: approach and prompts recorded 2026-09-18 before generation. Results are appended in section 13.

**Geometry (world 7,453 display px, camera 1,920 px, so the camera travels 5,533 px):**

| Plane | scrollFactor | Needed display width | How it is made |
|---|---|---|---|
| 1 Sky | 0 | 1,920 (fixed on screen) | One opaque 16:9 render, resized to 1,920 x 1,080 |
| 2 Hills and landmark | 0.18 | 1,920 + 0.18 x 5,533 = 2,916 | One render (about 2,171 wide) scaled up ~1.34x; distant hills tolerate the softness |
| 3 Distant buildings | 0.42 | 1,920 + 0.42 x 5,533 = 4,244 | Two renders (halves A and B), about 2,171 wide each at ~1:1, each with the outer 10% of its width completely empty so the halves join through open space and no seam exists |

Vertical placement (engine offsets, tunable in the Art Director tool): hills bottom-aligned to the screen bottom (their solid mass runs to the bottom edge); distant buildings bottom-aligned to the street ground line at display y = 963, so they show above the low modules (depot, Spoon, gate) and through the open bays and arch. The first-pass horizontal offsets are 0; the "HOLLYWOODLAND" sign position is tuned by the hills' offsetX.

Planes 2-3 use the chroma workflow (the backend removes `#ff00ff` itself and trims to content); bottoms and outer edges are extruded in post where a few pixels are short. The prompts forbid pink, magenta and purple tones so hazy tints are not mistaken for the key color.

### Plane 1: sky

```text
Use case: stylized-concept
Asset type: Plane 1 (sky) of a registered parallax environment for a 1935 Hollywood side-scrolling game; it stays fixed on screen behind everything
Input image roles: Image 1 is the approved earlier sky and Image 2 is the boulevard concept. Match style, palette, warm light and painterly finish exactly; extend rather than copy.
Primary request: Render only a Southern California sky with a soft gradient from clear cerulean blue at the top to a warm pale-gold haze at the horizon, and a few warm cream storybook clouds with soft sunlit undersides, sunlight coming from the upper right. Vivid hand-painted Golden Age Hollywood storybook finish, crisp illustrative cloud shapes, subtle painterly texture.
Composition/framing: 16:9 landscape, calm and uncluttered, clouds distributed naturally, with the lower quarter mostly clear pale haze so distant hills read cleanly against it and no single cloud dominating. Fill every pixel to all four edges; fully opaque.
Constraints: sky and clouds only. [NEG] No hills, no landmark, no sign, and no text.
```

### Plane 2: hills and landmark

```text
Use case: stylized-concept
Asset type: Plane 2 (distant Hollywood hills and landmark) of a registered parallax environment for a 1935 Hollywood side-scrolling game
Input image roles: Image 1 is the approved earlier hills plane and Image 2 is the boulevard concept. Match hillside forms, palette (sunlit ochre and sage), warm light from the upper right, atmospheric softness and painterly finish exactly, without copying the layout.
Primary request: Render only a broad range of distant Hollywood hills in romanticized 1935 form: rolling sunlit ochre and sage ridges with softly detailed chaparral texture and gentle atmospheric haze on the far ridges. On a mid-height ridge in the upper middle-right stands the historical hillside sign spelling exactly "HOLLYWOODLAND" in tall white block letters with a few small support struts. The sign is the only lettering anywhere. No buildings.
Composition/framing: ultrawide lateral view. A clean natural ridge silhouette runs across the upper half of the image, rising and falling gently, with the sign's ridge the highest point. The hill mass continues as solid painted terrain all the way down to the bottom edge and across to both side edges. The far left and far right 5 percent are plain continuing ridge.
Constraints: [CHROMA] No pink, magenta, or purple tones in the artwork. [NEG] No buildings or architecture. No text except "HOLLYWOODLAND".
```

### Plane 3: distant buildings (halves A and B)

Half B also receives half A as an extra reference and the line "Make this half different from the first: different building shapes and rhythm; do not repeat it."

```text
Use case: stylized-concept
Asset type: Plane 3 (distant buildings), one of two halves that will be placed end to end, of a parallax environment for a 1935 Hollywood side-scrolling game
Input image roles: Image 1 is the approved earlier distant-buildings plane, Image 2 is the boulevard concept, and Image 3 shows the finished street buildings that will stand in front of this layer. Match style, warm light from the upper right and painterly finish, but keep this layer quieter, smaller, cooler and less contrasty than the street buildings.
Primary request: Render only a continuous layer of small, distant 1935 Hollywood buildings stepping across the foothills: restrained Spanish Colonial, Art Deco and early commercial silhouettes of varied heights and rooflines, with a few water towers and slim towers, softened by atmospheric perspective into pale, cool, hazy tones. Every building continues downward as complete painted wall mass to the bottom edge.
Composition/framing: ultrawide lateral view. The buildings occupy the lower 60 percent of the image, with varied rooflines and clear gaps between clusters. The first 10 percent and the last 10 percent of the width are completely empty, with no buildings at all and nothing at the bottom edge either, so that two halves can be placed end to end.
Constraints: [CHROMA] No pink, magenta, or purple tones in the artwork. All signboards and painted wall signs are blank. [NEG] No hills, no sky, and no text.
```

## 13. Planes 1-3 results (2026-09-18)

All four renders (sky, hills, distant buildings A and B) succeeded on the first attempt, one take each. Masters are in `art/generated/boulevard-v3/planes/`; assembled runtime files and placement numbers are in `art/generated/boulevard-v3/runtime/` (`sky.png`, `hills.png`, `distant-buildings.png`, `planes123.json`).

| Plane | Runtime file | Engine scale | Scroll | Placement (display px) |
|---|---|---|---|---|
| 1 Sky | 1,920 x 1,080, opaque | 1.0 | 0 | x 0, y 0 |
| 2 Hills and landmark | 2,172 x 724 | 1.6 | 0.18 | x -555, y -78 (bottom-aligned to the screen) |
| 3 Distant buildings | 3,036 x 784 (includes a 60 px hidden overlap strip) | 1.4 | 0.42 | x 0, y -51 (building bases on the ground line at y = 963) |

**What was checked:** no magenta pixels in either cutout; the only lettering anywhere is "HOLLYWOODLAND"; all signboards blank; the two distant halves are different skylines at matching scale (half B resampled 0.964x to match half A's height) joined through their empty outer margins, so there is no seam; full-scene composites were rendered with each layer at its true parallax speed at five camera positions across the whole street, and every layer covers the full 1,920 px view at all of them.

**Decisions and tuning:**

- **Distant buildings at 1.4x:** at 1:1 their rooftops would sit lower on screen than every street module and be hidden entirely; at 1.4x the skyline clears the lowest roofs (depot, Spoon, gate) and shows through the open bays and arch, and still reads as distant through the haze.
- **Hills at 1.6x with x = -555:** raises the sign to display y of about 266-314, above most rooflines, while keeping the layer's edges off screen at both ends of the camera range (left edge <= 0 at the start, right edge >= 1,920 at the far end). Changing the offset moves where the sign passes behind the tall buildings; tune it in the Art Director tool.
- **Open Monarch gate:** with the gate open, the distant skyline (and hills behind it) shows through the arch, which stands in well for a "studio lot beyond" backdrop. A dedicated backdrop is no longer needed.
- **Hills texture:** the hills carry small painted oak trees and chaparral as hillside texture, despite the shared negative direction's tree exclusion. They read as texture at this distance and were kept.

```text
asset_id: boulevard_v3_planes_1_to_3
asset_type: sky (opaque), hills and landmark (cutout), distant buildings (two halves joined, cutout)
prompt_or_brief: section 12 of this file
reference_asset_ids: art/assets/plane1-3.png (v2 masters), Hollywoodland_Concept_Boulevard, composite of the nine street modules
generation_tool_and_version: gpt-image-2 via gg-image (backend-extracted alpha for the cutouts)
generation_date: 2026-09-18
raw_source_location: art/generated/boulevard-v3/planes/ (sky, hills, distant-a, distant-b masters)
human_edits: deterministic assembly only (sky resized to 1920x1080; distant halves scaled, joined, given a 60 px overlap strip; alpha normalized); no repainting
review_status: pending review
rights_or_license_notes: project-owned development generation; human rights/provenance review required
runtime_files: not yet promoted; staging files in art/generated/boulevard-v3/runtime/
```
