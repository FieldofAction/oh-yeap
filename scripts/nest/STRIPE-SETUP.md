# NEST — Stripe setup checklist

Follow top to bottom. Do everything in **Test mode** first, copy the four URLs into `.env.local`, verify the full flow end-to-end on the live site, then repeat in **Live mode** and swap to the live URLs.

## 0. One-time Stripe account prep

- [ ] Stripe Dashboard → **Settings → Branding** — upload a small NEST or Hotel mark; set accent color to something warm (not blue).
- [ ] Stripe Dashboard → **Settings → Customer emails** — enable "Successful payments" email; set "From name" to `Hotel` or `NEST · A Hotel release`.
- [ ] Stripe Dashboard → **Settings → Shipping** — create a shipping rate named `Standard · US` (free or paid — your call; "free" keeps the page simple). Add a second `Standard · International` if shipping outside the US.
- [ ] Optional: **Tax → Automatic tax** — enable if you want Stripe to collect sales tax automatically. For an edition at this scale it's fine to leave off.

---

## 1. Create four Products

Stripe Dashboard → **Product catalog → Add product**. Create these four, one at a time.

### 1a. NEST / Index Poster

| Field | Value |
|---|---|
| Name | `NEST / Index Poster — Edition 01` |
| Description | Hand-signed + numbered typology poster. 24×36 in, museum matte paper, 250 gsm, deckle edge. First edition from the Patio Beach archive. Reserved now — printed and shipped late May 2026. A Hotel release. |
| Image | upload `/public/images/nest/poster-hero.jpg` |
| Unit label | `poster` |
| Statement descriptor | `NEST POSTER` (Stripe caps this at 22 chars) |
| Price | **$85.00 USD · one-time** |

Save → note the **Product ID** (`prod_...`) and the **Price ID** (`price_...`). You'll reference these in the Payment Link step.

### 1b. NEST / Edition Tee

| Field | Value |
|---|---|
| Name | `NEST / Edition Tee — Edition 01` |
| Description | Black Stanley/Stella organic cotton tee. Water-based print. Front chest: NEST + Patio Beach / Brooklyn & Manhattan / 2016–2021. Edition of 50. Reserved now — printed and shipped late May 2026. A Hotel release. |
| Image | upload `/public/images/nest/tee-front.jpg` |
| Unit label | `tee` |
| Statement descriptor | `NEST TEE` |
| Price | **$55.00 USD · one-time** |

### 1c. NEST / Edition Tote

| Field | Value |
|---|---|
| Name | `NEST / Edition Tote — Edition 01` |
| Description | Black Stanley/Stella STAU773 organic cotton tote, 160 gsm. Water-based print. Edition of 50. Reserved now — shipped late May 2026. A Hotel release. |
| Image | upload `/public/images/nest/tote-front.jpg` |
| Unit label | `tote` |
| Statement descriptor | `NEST TOTE` |
| Price | **$45.00 USD · one-time** |

### 1d. NEST / Complete Edition (bundle)

| Field | Value |
|---|---|
| Name | `NEST / Complete Edition — Edition 01` |
| Description | Poster + tee + tote, reserved as a complete set. Capped at 50 complete editions. Shipped late May 2026. A Hotel release. |
| Image | upload any of the hero shots — `/public/images/nest/poster-hero.jpg` works |
| Unit label | `set` |
| Statement descriptor | `NEST EDITION` |
| Price | **$170.00 USD · one-time** |

> **Why a separate bundle SKU and not "add 3 items to one Payment Link"?** Cleanest accounting, cleanest inventory cap (50 bundles ≠ 50 of each product), and it lets the bundle metadata drive your fulfillment script.

---

## 2. Add metadata to each Product

On each product's detail page → **Metadata** section → Add these keys. Metadata flows through to every Checkout Session and webhook event — it's how your fulfillment logic will know what to print.

**Common to all four:**

| Key | Value |
|---|---|
| `release` | `NEST` |
| `edition` | `01` |
| `release_date` | `2026-04-22` |

**Plus, per product:**

| Product | Key | Value |
|---|---|---|
| Poster | `product_type` | `poster` |
| Tee | `product_type` | `tee` |
| Tote | `product_type` | `tote` |
| Complete Edition | `product_type` | `bundle` |
| Complete Edition | `bundle_contents` | `poster,tee,tote` |

---

## 3. Create four Payment Links

Stripe Dashboard → **Payment Links → New**. One link per product. Same settings across all four except where noted.

### Shared settings (all 4 links)

- **Type:** Payment (not subscription)
- **Product:** select the one you made above
- **Confirmation page:** Custom message — `Reservation confirmed. You'll get a shipment notification in late May when your NEST edition ships.`
- **After payment:** keep customer on Stripe's confirmation (don't redirect, keeps it simple)
- **Collect tax ID:** off (unless you want it)
- **Collect billing address:** Auto
- **Collect shipping address:** **ON** — Required
  - Shipping countries: US (add Canada + EU if you want)
  - Select your `Standard · US` shipping rate
- **Collect phone number:** Optional
- **Adjustable quantity:** **OFF** (each reservation is exactly 1)
- **Allow promotion codes:** OFF (no discounts on editions)
- **Save customer info for future purchases:** OFF

### Inventory cap (hugely important)

- **Limit the number of payments:** **ON** — set to the edition cap:

| Link | Cap |
|---|---|
| Poster | **100** |
| Tee | **50** |
| Tote | **50** |
| Complete Edition | **50** |

When a link hits its cap, Stripe automatically disables it and shows a "sold out" page. This is how you enforce edition size without building inventory logic yourself.

### Link expiration (close the window)

Stripe doesn't natively expire Payment Links on a schedule, but there's a workaround: at 11:59 PM ET on **May 8, 2026**, manually disable each link (Payment Links → link → toggle **Active: off**). Or set a calendar reminder.

The page code also disables the Reserve buttons client-side after May 8, so even if you forget Stripe, the buttons won't route there.

### Custom field — Tee size (applies to Tee + Complete Edition only)

On both the **Tee** and **Complete Edition** Payment Links:

- **Custom fields → Add field**
  - Label: `Tee size`
  - Type: **Dropdown**
  - Required: **Yes**
  - Options: `S`, `M`, `L`, `XL`, `XXL`

(The Poster and Tote links do not get this custom field.)

### Custom field — Personalization note (optional, all 4 links)

If you want buyers to be able to dedicate the signed poster or leave a note, add a second custom field:
- Label: `Dedication (optional)`
- Type: Text
- Required: No
- Max length: 80

Skip this for v1 if you want to keep the checkout short.

### Save each link's URL

After saving each Payment Link, copy the `https://buy.stripe.com/...` URL. You'll paste these into `.env.local` in the next step.

---

## 4. Drop URLs into the site

Create `/.env.local` at the worktree root (NOT in `.claude/`):

```bash
VITE_STRIPE_POSTER_URL=https://buy.stripe.com/paste_test_link_here
VITE_STRIPE_TEE_URL=https://buy.stripe.com/paste_test_link_here
VITE_STRIPE_TOTE_URL=https://buy.stripe.com/paste_test_link_here
VITE_STRIPE_BUNDLE_URL=https://buy.stripe.com/paste_test_link_here
```

Restart the dev server (`preview_stop` + `preview_start`, or just Ctrl-C + `npm run dev`). The Reserve buttons will now point to your links. If any env var is unset, the button falls back to a placeholder that throws on click — so you'll catch a missed one immediately.

**Add to `.gitignore`** (should already be there, but verify):
```
.env.local
.env.*.local
```

When you're ready to go live, swap the test URLs for live URLs.

---

## 5. End-to-end test (before launch)

In Test mode with a Stripe test card (`4242 4242 4242 4242`, any future date, any CVC):

- [ ] Click Reserve on Poster → lands on Stripe → complete checkout → return → receive confirmation email
- [ ] Click Reserve on Tee → **tee size custom field is required** → complete → email arrives
- [ ] Click Reserve on Tote → complete → email arrives
- [ ] Click Reserve on Complete Edition → **tee size required** → complete → email arrives with metadata showing bundle
- [ ] Verify in Stripe Dashboard → Payments — all four test payments show up with correct product + metadata + shipping address + tee size (where applicable)
- [ ] Verify the Product's Payment Count increments on each test (confirms the inventory cap is working)
- [ ] Set the Poster Payment Link's "Limit" to **2**, test twice, confirm the 3rd attempt shows "No longer available"
- [ ] Reset the limit back to 100 after testing

---

## 6. Go live

- [ ] Repeat all of Step 1, 2, 3 in **Live mode** (Stripe's test/live toggle is in the top-left of the Dashboard). You'll be creating fresh live products + live payment links — Stripe does NOT promote test objects to live.
- [ ] Paste the live URLs into `.env.local` (or your production env — Vercel → Project → Environment Variables).
- [ ] Ship.

---

## What happens on the customer side

1. They click Reserve on `/#hotel/nest`
2. Lands on a Stripe-hosted checkout page (your branding)
3. Enters email, shipping address, tee size if applicable, card info
4. Stripe charges immediately — this is a **reservation that is also a payment**; make sure the product description says "shipped late May 2026" so expectations are set
5. Confirmation page + email with receipt
6. You get a notification in Stripe
7. You ship in late May — update each order's tracking in Stripe → the customer gets a shipment email automatically

---

## Fulfillment handoff (for later, not now)

When you're ready to print:

1. Stripe Dashboard → **Payments** → filter by Product → export CSV
2. For the tee and bundle, the tee size is in the `Custom fields` column
3. Feed the CSVs to Gelato (poster) and your tee/tote printer
4. Once shipped, add tracking numbers per order in Stripe — triggers shipment emails

If you want this automated, the next step would be a webhook handler in `/api/stripe-webhook.js` that listens for `checkout.session.completed` and forwards to a fulfillment service. Not needed for a 200-unit edition.
