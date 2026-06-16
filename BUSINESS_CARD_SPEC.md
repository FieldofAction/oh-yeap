# Field of Action — Card Spec

*Source of truth: `public/og-card.html`, rendered to `public/og-image.png` via `scripts/render-og.mjs`.*

## Canvas

- **Design size:** 1200 × 630 px (Open Graph ratio, 1.905 : 1)
- **Export:** 2× device scale → **2400 × 1260 px** PNG
- **Background:** `#0C0D10`
- **Orientation:** landscape, two columns (text left, image right)

## Grid / layout

- **Text column (left):** fills remaining width = **770 px**
  - Padding: **64 top · 56 right · 72 left · 56 bottom**
  - Usable text width: **642 px**
  - Vertical structure: three stacked blocks, distributed top-to-bottom (space-between) — brand / identity / footer
- **Image panel (right):** **430 px** wide, full **630 px** height
  - Divider: **1 px** left border, `#1C1E24`
  - Image fills the panel (cover, centered)
  - Backstop fill behind image: `#E8EAF0`
- **Corner ticks:** 14 × 14 px, 1 px stroke `#565A62`, inset **40 px** from the card edge. Currently top-left and bottom-left only.

## Color (Threshold theme)

| Token | Hex | Use |
|-------|-----|-----|
| Background | `#0C0D10` | card field |
| Foreground | `#E8EAF0` | name, URL, logotype, emphasis |
| Muted | `#868B94` | brand label, role body, role suffix |
| Faint | `#565A62` | corner ticks, metadata |
| Border | `#1C1E24` | column divider |
| Accent | `#2F5BFF` | rule under logotype (90% opacity) |

## Type

Two families. **Inter** (300/400/500/600/700) and **Space Mono** (400/700).

| Element | Font | Size | Weight | Tracking | Color | Notes |
|---------|------|------|--------|----------|-------|-------|
| Brand label | Inter | 15 px | 500 | +0.08em | `#868B94` | uppercase, top-left |
| Logotype mark | vector | 52 px tall | — | — | `#E8EAF0` | FOA wordmark, width auto (~521 px) |
| Accent rule | — | 72 × 1 px | — | — | `#2F5BFF` @ 90% | sits under the mark |
| Name | Inter | 22 px | 500 | +0.01em | `#E8EAF0` | role suffix in 400 / `#868B94` |
| Role body | Inter | 15 px | 400 | — | `#868B94` | line-height 1.5, max-width 520 px; lead phrase in 500 / `#E8EAF0` |
| URL | Space Mono | 14 px | 400 | +0.02em | `#E8EAF0` | bottom-right of text column |

Identity block internal spacing: **30 px** between mark, rule, and name.

## Content (current)

- **Brand:** Field of Action
- **Mark:** FOA logotype (vector asset: `public/images/foa/foa_logotype.svg`; inline in card with viewBox `29 21 631 63`)
- **Name:** Alfred (Daniel) Dickson II. *Designer, Writer*
- **Role:** **Design infrastructure** across research, design, and production. Conditions, models, and standards that hold the whole body of work coherent. The apparatus it runs on.
- **URL:** fieldofaction.org
- **Image:** documentary-flat scaffolding coupler (`public/images/foa/card-structure.png`)

## Print translation (if you want a physical card)

The digital card is 1.905 : 1. A US business card is **3.5 × 2 in** (1.75 : 1), so the layout reflows rather than scales 1:1.

- **Trim:** 3.5 × 2 in → 1050 × 600 px at 300 dpi
- **Bleed:** +0.125 in all sides → 3.75 × 2.25 in → 1125 × 675 px
- **Safe margin:** keep text 0.125–0.2 in inside trim
- Restate type in points for print; hold the same ratios (brand small-caps, logotype dominant, mono URL).
- Two-sided option: image panel becomes the back, identity on the front.
