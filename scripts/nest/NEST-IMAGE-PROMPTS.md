# NEST — Image generation prompts

Prompts for the 11 product shots on `#hotel/nest`. The 12th slot — `poster-hero.jpg` — is generated programmatically from the real Patio Beach archive by `scripts/nest/build-nest-poster.mjs`, so it is not prompted here.

## Shared aesthetic brief (prepend to every prompt)

Editorial product photography. Warm off-white paper background (#FAF7F0 tone), soft directional daylight from upper-left, gentle drop shadow, no hand or prop in frame unless specified. Shot on a medium-format camera feel — Phase One or Hasselblad, not iPhone. No lifestyle clichés: no eucalyptus sprigs, no beige minimalist apartment, no moody grey seamless. The object is the subject. Muted, patient, sincere.

Brooklyn/Manhattan vernacular when in-situ — real streets, real light, not staged.

**Negative prompt (append to every image):** no text overlays added by the generator, no watermarks, no logos, no models posing, no lifestyle props, no eucalyptus, no airbrush skin, no HDR, no heavy bokeh background blur, no oversaturation, no Instagram filter look.

---

## POSTER SHOTS

### 1. Poster — hero (full flat)
**Generated programmatically, not prompted.** See `build-nest-poster.mjs`.

### Revised poster layout (as of this pass)

The poster has been redesigned as an **archival index plate**, not a titled poster. Layout:
- **Top margin:** generous empty warm-paper space above the grid — no header, no title.
- **Middle (dominant):** the 486-site typology grid.
- **Bottom editorial footer**, three columns spanning the width of the grid:
  - *Left (mono caps):* `486 SITES / BROOKLYN & MANHATTAN / 2016 — 2021`
  - *Center (the lockup, quiet):* `NEST` in medium-size Playfair serif, with `PATIO BEACH` in mono caps directly beneath it — roughly 2–3cm total height, not shouting.
  - *Right:* `EARTH DAY 2026` in mono caps, with `A Hotel release` in italic Playfair below it.
- **Paper stock:** warm off-white handmade-style museum matte with a visible deckle (torn/rough) edge on the left side of the sheet. This is now a signature material detail.
- **Edition numbering + signature** sit below the printed block on the open paper margin (not inside the print area) — hand-written in black archival ink.

The NEST lockup is deliberately discrete. The grid carries the page; the typography is a colophon, not a headline.

### 2. Poster — detail · bottom-center NEST lockup
**Subject:** typography. This shot is about the letterforms.
**Prompt:** A macro studio shot of printed serif typography on museum-quality paper. The word "NEST" in Playfair Display serif, roughly 2cm tall, and directly beneath it the words "PATIO BEACH" in tight mono-caps at about half that size. Black archival ink, slightly proud of the fibers, visible at extremely close range — you can see how the ink sits on the paper's weave. The crop is tight and horizontal (3:2 landscape) with the lockup occupying the center of the frame; the extreme edges of the crop just barely catch blurred fragments of flanking mono-caps text columns (small bokeh hints of "486 SITES" on the left and "EARTH DAY 2026" on the right). 100mm macro lens feel, shallow depth of field, focus on the serif letterforms, soft window light from directly above so the ink's slight relief catches a subtle highlight on one edge. Type specimen page aesthetic — think a Hoefler & Co. catalog spread, or a letterpress studio shot. Ink and fiber, nothing else.

### 3. Poster — detail · typology grid zone
**Subject:** density and variety. This shot is about the archive being an archive.
**Prompt:** A sharp-focus overhead documentary crop of a dense photographic tile grid printed on paper — roughly 40 small square photographs visible in the 3:2 landscape frame, arranged in strict 8-wide rows. Each cell is a different discarded object photographed from above on a New York sidewalk: a mattress, a pink toddler chair, a lamp base wrapped in plastic, a pair of tan Timberlands, a stuffed bear with one eye missing, a broken umbrella, a stack of National Geographic magazines, a small mirror with a crack across it, a birthday cake box with the name Denise in piped icing, a doll's head, a milk crate, a Nike Dunk low. Muted urban tones dominate — asphalt gray, bagged-garbage black, the occasional flash of primary color. Even, flat daylight across the entire grid with no vignette or directional shadow — this is a catalog plate, not a hero shot. Razor-sharp from edge to edge, no soft focus, no drama. Museum object-catalog aesthetic — think Bernd & Hilla Becher's typology plates or the MOMA Objects of Use catalog. The eye moves row by row, not to any single object.

### 4. Poster — detail · deckle edge + edition numbering
**Subject:** paper as material, hand as proof.
**Prompt:** An intimate, hand-held-feeling detail shot with low raking side-light from the right, emphasizing the physical texture of handmade paper. Frame composition, 3:2 landscape: the left quarter of the frame is occupied by the torn, fibrous deckle edge of a sheet of thick cream museum-grade paper — individual paper fibers visible, some curling slightly, the edge irregular and organic. The center-right of the frame shows the bottom corner of a printed image grid fading out, followed by open paper margin, followed by a hand-written fraction in black archival fountain-pen ink — "47 / 100" — and beneath it a loose cursive signature. The ink sits slightly proud of the paper surface, catching the raking light just so, making each stroke cast a whisper of a shadow. The paper itself is lit almost horizontally so its fiber structure reads clearly; no overhead fill light. Tactile, craft-proof photography — think a Japanese papermaking documentary or a Louise Bourgeois editions catalog. This is a shot about hand, not design.

### 5. Poster — in-situ · on a wall
**Subject:** lived-in domestic space. The print earns its place in a real room.
**Prompt:** A wide, atmospheric interior shot of a Brooklyn apartment living room in late-afternoon golden light, shot from about 8 feet back at eye level, 4:5 portrait aspect. The focal point is a framed 24×36 inch art print hanging on a warm off-white plaster wall — thin black wood frame, clean gallery mat, centered above a low wooden console table. Inside the frame: a dense photographic tile grid in the upper two-thirds, with a quiet three-column mono-caps-and-serif footer at the bottom (from a few feet away it reads as elegant type, not a title). Surrounding context fills the edges of the frame: a worn Turkish runner rug, the silhouette of a ceramic vase with a single dried branch, a wooden chair at an angle in the foreground slightly out of focus, late sun falling in diagonal stripes across the floor from venetian blinds off-camera left. The wall has small scuffs, the paint isn't perfect, maybe a nail hole where a previous piece hung. Real, not staged. Shot on 35mm film feel, slight natural grain, warm color temperature, no flash. Think Tim Barber's apartment photography or William Eggleston domesticity — the print is integrated into a life, not presented on a pedestal.

### 6. Poster — in-situ · held or rolled
**Subject:** scale and tactility. You can feel the weight of it.
**Prompt:** A studio-table close-up, 30° overhead angle, 4:5 portrait aspect. Two hands belonging to the same person — mid-30s, no jewelry, slightly ink-stained fingers — are gently unrolling a large art print on a reclaimed wood table. The print is maybe 60% unrolled, revealing the dense photographic tile grid and the bottom-center NEST lockup at the edge of the revealed portion; the right 40% is still rolled into a tight cylinder that the person's right hand is holding in place. The paper has visible tension — it wants to spring back. A deckle edge is just visible along the bottom of the unrolled portion, hinting at the handmade paper stock. Background: the reclaimed wood surface takes up the lower third of the frame, showing natural grain, a small cluster of tools (an X-Acto, a bone folder, a pair of cotton gloves loosely draped), soft studio window light from upper-left falling on the unrolled portion. The scale is unambiguous — this is a physical object, both forearms worth. Shot with a slight human imperfection — maybe one finger curls off to the side naturally, maybe the table is dusty. Artist-studio photography, not a product shot — think a bookbinder's Instagram or an editioned-print workshop.

---

## TEE SHOTS

### 7. Tee — flat lay · front
**Prompt:** A plain black crewneck t-shirt (Stanley/Stella organic cotton, heavy weight, matte cotton surface) laid perfectly flat on a warm off-white paper backdrop. Shot dead-on from directly above. Centered on the chest: a single wordmark printed in off-white or warm ivory ink reading "NEST" in a clean, slightly condensed serif — roughly 12cm wide, positioned where a small chest embroidery would go. The tee is arranged with sleeves slightly splayed, hem flat, collar crisp, no wrinkles. 4:5 portrait aspect. Soft directional daylight from upper-left casting a faint shadow along the right hem. The black reads as true black, the ink reads as soft warm white — water-based print character, slightly sunk into the fabric, not plasticky. Editorial apparel photography. Quiet, confident, merch that isn't trying.

### 8. Tee — flat lay · back
**Prompt:** Same black crewneck t-shirt as the front shot, laid flat on warm off-white paper backdrop, shot dead-on from directly above, now showing the back. Centered high on the upper back (between the shoulder blades, where a tour shirt print would sit) is a stacked block of small type in the same warm off-white water-based ink. The type block reads, in four lines, all caps, mono-type, tightly set:
PATIO BEACH
2016 — 2021
486 SITES · BROOKLYN & MANHATTAN
NEST · EDITION 01
The block is small — about 10cm wide total — quiet, not a billboard. 4:5 portrait aspect. Soft daylight from upper-left. Same true-black cotton, same matte water-based ink character. The type is legible but restrained. Editorial, considered, archival.

### 9. Tee — detail · front chest print
**Prompt:** Extreme macro close-up on the chest wordmark of a black cotton t-shirt. Fabric weave visible at close range — organic cotton, 200gsm, slight natural texture. The wordmark "NEST" in warm off-white water-based ink, slightly sunk into the fabric fibers so the ink character is soft and matte, not glossy. Shot at a slight angle — 20° off-perpendicular — so the raking light reveals both the fabric weave and the way the ink settles between fibers. 3:2 landscape crop. Soft directional daylight, shallow depth of field, focus on the central letters of the wordmark, edges slightly softer. Craft-object intimacy. This shot exists to prove print quality.

### 10. Tee — detail · back type block
**Prompt:** Macro close-up on the back of a black cotton t-shirt, framed tightly on a stacked block of small printed text reading (four lines):
PATIO BEACH
2016 — 2021
486 SITES · BROOKLYN & MANHATTAN
NEST · EDITION 01
Type is a tight monospace, warm off-white water-based ink on black organic cotton, ink slightly absorbed by the weave. The crop shows the full type block with about 1cm of surrounding fabric. 3:2 landscape. Soft directional daylight from upper-left, slight raking angle revealing the cotton texture. Ink is matte, not plastic. Editorial apparel detail photography — the "proof of care" shot.

### 11. Tee — detail · interior label
**Prompt:** The t-shirt is turned inside-out and laid flat to reveal its interior neck label. Close macro shot of the label: a small woven or printed cotton label stitched into the neck seam, reading in two stacked lines of tiny serif type:
A HOTEL RELEASE
NEST · 01 · 2026
The label is cream or warm off-white with dark ink, cleanly stitched to the black shirt. 3:2 landscape, crop tight on the label with about 2cm of surrounding interior fabric visible including the chain-stitch seam. Soft natural daylight, raking from left. The label is the subject — restrained, understated, an Easter egg for the close-looker. Craft-object quality. No dramatic lighting, no flair.

### 12. Tee — in-situ · worn
**Prompt:** A real person (not a model, no fashion pose) wearing the black crewneck t-shirt with the "NEST" chest wordmark, walking along a Brooklyn sidewalk — Gowanus, Greenpoint, Red Hook, or lower Manhattan vibe. Late afternoon golden light. Environment contains authentic urban texture: brick wall, chain-link fence, crosswalk stripe, corner bodega signage partially out of focus in the background. The subject is mid-stride, mid-conversation, possibly looking just off-camera — not posing, not smiling at the lens. Shot from approximately 4 feet away at chest height, 4:5 portrait aspect, 35mm or 50mm equivalent focal length, natural ambient light, slight motion implied by posture but the chest wordmark is sharp and legible. Documentary feel, Nan Goldin / Stephen Shore / early Juergen Teller restraint — not fashion, not styled. Real fit, real person, real block. The tee looks like it's been worn for an hour, not just unboxed.

---

## TOTE BAG

### Sourcing — recommended blank

**Primary: Stanley/Stella STAU773 "Light Tote Bag"**
- 100% GOTS-certified organic ring-spun combed cotton, 160 GSM
- 37 × 42 cm body, 65 cm straps
- Top edge double-folded; handles reinforced with cross-stitch
- OEKO-TEX, Fairwear Foundation, PETA-Approved Vegan
- **Chosen color: French Navy (Stanley/Stella code `C727`, ~`#1F2A44`).** Variant B below is the production direction. Variant A (Royal Blue) is kept for reference in case of a future re-run. Satin bowerbird motif honored quietly — navy reads as restrained and editorial next to the black tee.
- Matches the tee's sourcing ethic — same supplier family, same organic certification. Cohesive story for the edition.
- Print-on-demand available via Prodigi; also available through distributors like Organic Blank and Baroneclothing.

**Alt: Stanley/Stella STAU760 "Woven Tote Bag"**
- 300 GSM · 80% recycled cotton / 20% recycled polyester
- Heavier, more structured canvas feel — holds shape when set down
- Good if you want a tote that reads as an object rather than a carry-all
- Trade-off: not 100% organic (blended recycled)

**Recommendation:** STAU773 for brand coherence with the tee. Heavier 300 GSM feel is a trade-off worth making only if the poster + tote are meant to read as a "pair of structured artifacts."

### Shared print design (matching the tee)

Front: `NEST` wordmark + stacked sub-header (`PATIO BEACH / BROOKLYN & MANHATTAN / 2016 — 2021`) in warm off-white water-based ink, centered on the front panel roughly 15cm wide. Back: blank, with a small `A HOTEL RELEASE · 2026` in tiny Plex Mono near the lower-right corner. Interior: small stitched cotton label at the top hem reading `A HOTEL RELEASE / NEST · 01 · 2026`.

---

## VARIANT A — Royal Blue tote

Royal Blue = vivid medium-blue, the satin bowerbird's signature. Think bottle-cap blue / cobalt-leaning / roughly `#3B5BBF`. Ink stays warm off-white (cream) across all shots so the tote still reads as part of the NEST family — high-contrast pop of cream on blue.

### 13A. Tote — flat lay · front (Royal Blue)
**Prompt:** A royal blue lightweight organic cotton tote bag (Stanley/Stella STAU773 silhouette — natural drape, shallow structure, long straps in matching royal blue) laid perfectly flat on a warm off-white paper backdrop. The bag body is a vivid medium-blue, roughly the tone of a satin bowerbird's collected bottle cap — saturated but not neon, around `#3B5BBF`. Shot dead-on from directly above. The two long handles are splayed symmetrically up toward the top of the frame. Centered on the front panel: the wordmark "NEST" in a clean serif, with a small stacked sub-header below it in mono-type reading "PATIO BEACH / BROOKLYN & MANHATTAN / 2016 — 2021" — the whole print block is ~15cm wide, positioned roughly at chest-height on the body. Warm off-white water-based ink on royal blue cotton, ink slightly sunk into the weave, matte and slightly imperfect — not plasticky. 4:5 portrait aspect. Soft directional daylight from upper-left, gentle shadow along the right edge of the bag body. No wrinkles, no folds. Editorial apparel photography — same family as the NEST tee flat lay, same confidence, same restraint, now in the bowerbird's color.

### 14A. Tote — flat lay · back (Royal Blue)
**Prompt:** Same royal blue organic cotton tote bag as the front shot, now flipped to show the back panel — laid flat on warm off-white paper, shot dead-on from directly above, 4:5 portrait aspect. The back panel is intentionally empty except for a very small imprint mark near the lower-right corner: six tiny lines of Plex Mono type in warm off-white ink reading "A HOTEL RELEASE · 2026" (roughly 3cm wide, almost an Easter egg). Same cotton texture, same `#3B5BBF` royal blue ground, same soft directional daylight from upper-left. The negative space is the subject — the vivid blue expanse against the paper, the quietness of the tiny mark. This is the "nothing shouting" shot.

### 15A. Tote — detail · front print macro (Royal Blue)
**Prompt:** Extreme macro close-up on the center of a royal blue cotton tote bag, framed tightly on the printed chest block. Visible: "NEST" in clean serif typography above a small stacked sub-header in warm off-white water-based ink reading "PATIO BEACH / BROOKLYN & MANHATTAN / 2016 — 2021." Fabric weave visible at close range — organic cotton, 160gsm, slight natural texture, the royal blue (`#3B5BBF`) holds color evenly through the weave. Ink character is soft and matte, sunk into the fibers, not glossy. Shot at a slight angle — 15° off-perpendicular — so raking light reveals both the fabric weave and the way the cream ink settles between the blue fibers. 3:2 landscape crop. Soft directional daylight from upper-left, shallow depth of field, focus on the wordmark with the metadata stack slightly softer. Same visual language as the NEST tee's front chest print detail, now on blue ground.

### 16A. Tote — detail · handle + reinforcement stitch (Royal Blue)
**Prompt:** Macro close-up on the point where a tote bag handle meets the body — specifically the reinforced cross-stitch that secures a long cotton strap to the top seam of a royal blue organic cotton bag. Visible: the thick royal blue cotton handle (same blue as the bag body), the reinforced box-X stitch in cream or blue thread, the doubled-over top hem of the bag, and the cotton weave of the body in the `#3B5BBF` tone. Crop is tight enough to see individual stitches and fiber detail. 3:2 landscape, soft directional daylight from upper-left, raking angle, shallow depth of field, focus on the cross-stitch. Craft-object intimacy — this shot exists to prove construction quality.

### 17A. Tote — detail · interior label (Royal Blue)
**Prompt:** The tote is turned partially inside-out at the top hem to reveal a small cream or warm off-white woven cotton label stitched into the interior seam. The label reads in two tiny stacked lines of serif type: "A HOTEL RELEASE / NEST · 01 · 2026." The label is cleanly chain-stitched to the interior, sitting flat against the royal blue cotton body. 3:2 landscape, crop tight on the label with about 3cm of surrounding interior fabric visible (the royal blue weave providing ground). Soft natural daylight raking from left. The label is the subject — restrained, understated, the cream of the label reading clearly against the blue. Same visual family as the tee's interior label shot.

### 18A. Tote — in-situ · carried (Royal Blue)
**Prompt:** A real person (not a model, no fashion pose) walking along a Brooklyn sidewalk — Gowanus, Red Hook, Greenpoint, or lower Manhattan vibe — with a royal blue organic cotton tote bag slung over one shoulder, the NEST + Patio Beach chest block visible from a ¾ angle. Late afternoon golden light — the royal blue (`#3B5BBF`) reads as vivid but grounded against the warm street tones. Environment contains authentic urban texture: brick facade, cast iron fence, painted intersection stripe, or a bodega awning partially out of focus in the background. The subject is mid-stride, not looking at the lens, the bag swinging slightly with motion. Shot from roughly 4 feet away at chest height, 4:5 portrait aspect, 35mm or 50mm equivalent, natural ambient light, the chest print legible but not the star — the street, the carry, and the blue are the subject. Documentary restraint, Stephen Shore / early Juergen Teller feel — not fashion, not styled. The tote looks like it's full of something the person actually needed to carry, not a prop. The blue is the bowerbird's wink.

---

## VARIANT B — French Navy tote

French Navy = deep blue-black navy, restrained and editorial. Think around `#1F2A44` — close enough to black to hold its own next to the tee, blue enough to carry the bowerbird reference quietly. Ink stays warm off-white (cream) — same as the tee.

### 13B. Tote — flat lay · front (French Navy)
**Prompt:** A french navy lightweight organic cotton tote bag (Stanley/Stella STAU773 silhouette — natural drape, shallow structure, long straps in matching french navy) laid perfectly flat on a warm off-white paper backdrop. The bag body is a deep blue-black navy, close to ink — roughly `#1F2A44`, quiet and editorial, not loud. Shot dead-on from directly above. The two long handles are splayed symmetrically up toward the top of the frame. Centered on the front panel: the wordmark "NEST" in a clean serif, with a small stacked sub-header below it in mono-type reading "PATIO BEACH / BROOKLYN & MANHATTAN / 2016 — 2021" — the whole print block is ~15cm wide, positioned roughly at chest-height on the body. Warm off-white water-based ink on french navy cotton, ink slightly sunk into the weave, matte — the cream ink reads softly against the navy, not a shouting contrast. 4:5 portrait aspect. Soft directional daylight from upper-left, gentle shadow along the right edge of the bag body. No wrinkles, no folds. Editorial apparel photography — restrained, archival, sits quietly beside the black tee.

### 14B. Tote — flat lay · back (French Navy)
**Prompt:** Same french navy organic cotton tote bag as the front shot, now flipped to show the back panel — laid flat on warm off-white paper, shot dead-on from directly above, 4:5 portrait aspect. The back panel is intentionally empty except for a very small imprint mark near the lower-right corner: six tiny lines of Plex Mono type in warm off-white ink reading "A HOTEL RELEASE · 2026" (roughly 3cm wide, almost an Easter egg). Same cotton texture, same `#1F2A44` deep navy ground, same soft directional daylight from upper-left. The negative space is the subject — the navy expanse reading almost as ink, the tiny mark barely catching the light. This is the most restrained shot in the whole edition — the "nothing shouting" shot, pushed to its quietest.

### 15B. Tote — detail · front print macro (French Navy)
**Prompt:** Extreme macro close-up on the center of a french navy cotton tote bag, framed tightly on the printed chest block. Visible: "NEST" in clean serif typography above a small stacked sub-header in warm off-white water-based ink reading "PATIO BEACH / BROOKLYN & MANHATTAN / 2016 — 2021." Fabric weave visible at close range — organic cotton, 160gsm, slight natural texture, the french navy (`#1F2A44`) holds color evenly, almost reading as deep blue-black. Ink character is soft and matte, sunk into the fibers, not glossy. Shot at a slight angle — 15° off-perpendicular — so raking light reveals both the fabric weave and the way the cream ink settles between the navy fibers. 3:2 landscape crop. Soft directional daylight from upper-left, shallow depth of field, focus on the wordmark with the metadata stack slightly softer. Same visual language as the NEST tee's front chest print detail, now on navy ground.

### 16B. Tote — detail · handle + reinforcement stitch (French Navy)
**Prompt:** Macro close-up on the point where a tote bag handle meets the body — specifically the reinforced cross-stitch that secures a long cotton strap to the top seam of a french navy organic cotton bag. Visible: the thick navy cotton handle (same navy as the bag body), the reinforced box-X stitch in cream or navy thread, the doubled-over top hem of the bag, and the cotton weave of the body in the `#1F2A44` tone. Crop is tight enough to see individual stitches and fiber detail. 3:2 landscape, soft directional daylight from upper-left, raking angle, shallow depth of field, focus on the cross-stitch. Craft-object intimacy — this shot exists to prove construction quality.

### 17B. Tote — detail · interior label (French Navy)
**Prompt:** The tote is turned partially inside-out at the top hem to reveal a small cream or warm off-white woven cotton label stitched into the interior seam. The label reads in two tiny stacked lines of serif type: "A HOTEL RELEASE / NEST · 01 · 2026." The label is cleanly chain-stitched to the interior, sitting flat against the french navy cotton body. 3:2 landscape, crop tight on the label with about 3cm of surrounding interior fabric visible (the navy weave providing ground). Soft natural daylight raking from left. The label is the subject — restrained, understated, the cream of the label glowing softly against the dark navy. Same visual family as the tee's interior label shot.

### 18B. Tote — in-situ · carried (French Navy)
**Prompt:** A real person (not a model, no fashion pose) walking along a Brooklyn sidewalk — Gowanus, Red Hook, Greenpoint, or lower Manhattan vibe — with a french navy organic cotton tote bag slung over one shoulder, the NEST + Patio Beach chest block visible from a ¾ angle. Late afternoon golden light — the navy (`#1F2A44`) reads as almost-black in the warm light, resolving as navy only at closer look. Environment contains authentic urban texture: brick facade, cast iron fence, painted intersection stripe, or a bodega awning partially out of focus in the background. The subject is mid-stride, not looking at the lens, the bag swinging slightly with motion. Shot from roughly 4 feet away at chest height, 4:5 portrait aspect, 35mm or 50mm equivalent, natural ambient light, the chest print legible but not the star — the street, the carry, and the quiet navy are the subject. Documentary restraint, Stephen Shore / early Juergen Teller feel — not fashion, not styled. The tote looks like it's full of something the person actually needed to carry, not a prop. The navy is the bowerbird's wink, pitched almost to a whisper.
