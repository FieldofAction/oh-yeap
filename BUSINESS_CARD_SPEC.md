# Field of Action — Card Spec

*Source of truth: `public/og-card-motion.html` (animated) and `public/images/foa/og_card_layout.svg` (the vector layout), rendered to `public/og-image.png` via `scripts/render-og.mjs`.*

## Canvas

- **Design size:** 1200 × 630 px (Open Graph ratio, 1.905 : 1)
- **Export:** 2× device scale → **2400 × 1260 px**
- **Orientation:** landscape, a single centered column over a full-bleed background

## Background

- Full-bleed documentary scaffolding, bright and near-white, flat even light.
- **Motion:** `public/images/foa/card-motion.mp4` (1920 × 1080, 10s loop), object-fit cover.
- **Static (OG / share):** a fixed frame of the same footage, `public/og-image.png`.

## Layout

A centered vertical stack. Every element is centered on the canvas midline (x ≈ 600). Measured from `og_card_layout.svg` at 1200 × 630:

| Element | Size | Position (y) | Notes |
|---------|------|--------------|-------|
| Logotype | ~76 px tall, ~764 px wide | 270–346 | FOA wordmark, upper-middle |
| Name | ~22 px (caps) | 388–419 | "Alfred (Daniel) Dickson II", uppercase, tracked |
| Role | ~13 px, two lines | 513–560 | uppercase, tracked, ends with a period |

The logotype sits in the upper-middle; the role line rests ~70 px above the bottom edge.

## Color

- **Type:** `#231f20` (near-black), a single ink, sitting over the bright background.
- No accent rule and no brand label or URL on the face.

## Type

- The current asset has all type outlined to vector paths, so the font is not embedded as live text. Visually it reads as a clean geometric sans, uppercase for the name and role with generous tracking; the logotype is the FOA custom wordmark.
- For a live-text rebuild, the site type system is **Inter** (display and body) and **Space Mono** (mono and metadata).

## Content (current)

- **Logotype:** Field of Action wordmark
- **Name:** Alfred (Daniel) Dickson II
- **Role:** DESIGN INFRASTRUCTURE ACROSS RESEARCH, DESIGN, AND PRODUCTION. CONDITIONS, MODELS, AND STANDARDS.

## Assets

- `public/og-card-motion.html` — composite: video background under the vector layout
- `public/images/foa/og_card_layout.svg` — vector layout, transparent, 44 KB (embedded rasters stripped)
- `public/images/foa/card-motion.mp4` — background video
- `public/og-image.png` — static still, the share / OG image
- `public/images/foa/card-share.mp4` — the layout burned onto the video, for messaging

## Print translation (if you want a physical card)

The card is 1.905 : 1. A US business card is **3.5 × 2 in** (1.75 : 1), so the layout reflows rather than scaling 1:1.

- **Trim:** 3.5 × 2 in → 1050 × 600 px at 300 dpi
- **Bleed:** +0.125 in all sides → 3.75 × 2.25 in → 1125 × 675 px
- **Safe margin:** keep type 0.125–0.2 in inside trim
- Restate type in points for print; hold the centered stack and the single near-black ink over a bright structural image.
- Two-sided option: the structural image as the back, the centered identity stack on the front.
