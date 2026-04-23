import { useState, useEffect } from "react";

// Image slot — renders a real <img> when `path` exists in /public/images/nest/,
// else falls back to a dashed placeholder showing the expected aspect + path.
function ImageSlot({ label, aspect, path, priority = false }) {
  return (
    <figure
      className="hn-slot"
      style={{ aspectRatio: aspect }}
      aria-label={label}
      data-priority={priority ? "1" : undefined}
    >
      <img
        src={path}
        alt={label}
        loading={priority ? "eager" : "lazy"}
        decoding={priority ? "sync" : "async"}
        fetchPriority={priority ? "high" : "auto"}
      />
    </figure>
  );
}

function Caption({ children }) {
  if (!children) return null;
  return <figcaption className="hn-cap">{children}</figcaption>;
}

function SectionHeader({ children, label }) {
  return (
    <header className="hn-sec-head">
      {label && <div className="hn-sec-eyebrow">{label}</div>}
      <h2 className="hn-sec-title">{children}</h2>
    </header>
  );
}

/* ── Main page ─────────────────────────────────────────────── */
export default function HotelNest() {
  const [size, setSize] = useState("M");

  useEffect(() => { document.title = "NEST — First edition from the Patio Beach archive"; }, []);

  // TODO: Stripe URL — poster
  const POSTER_URL = "https://buy.stripe.com/poster-placeholder";
  // TODO: Stripe URL — tee
  const TEE_URL = "https://buy.stripe.com/tee-placeholder";
  // TODO: Stripe URL — tote
  const TOTE_URL = "https://buy.stripe.com/tote-placeholder";
  // TODO: Stripe URL — complete-edition bundle
  const BUNDLE_URL = "https://buy.stripe.com/bundle-placeholder";
  // TODO: real Substack URL
  const ESSAY_URL = "https://artofmemos.substack.com/p/nest";

  return (
    <div className="hn en">
      {/* 1. Page header */}
      <header className="hn-head dc dc1">
        <div className="hn-crumb">hotel / nest</div>
        <h1 className="hn-title">NEST</h1>
        <div className="hn-sub">First edition from the Patio Beach archive</div>
        <div className="hn-date">Released April 22, 2026 · Earth Day</div>
      </header>

      {/* 2. Poster hero */}
      <div className="hn-hero dc dc2">
        <ImageSlot
          label="Poster hero"
          aspect="2 / 3"
          path="/images/nest/poster-hero.jpg"
          priority
        />
      </div>

      {/* 3. Intro */}
      <section className="hn-intro dc dc3">
        <p className="hn-intro-body">
          For five years I photographed what cities couldn't hold: mattresses, shoes, chairs, the small archaeology of what people couldn't keep. The archive is called Patio Beach. NEST is the first edition built from it — three objects: an index poster assembled from 486 sites, a tee, and a tote. Released on Earth Day, 2026.
        </p>
        <a className="hn-essay-link" href={ESSAY_URL} target="_blank" rel="noopener noreferrer">
          Read the essay →
        </a>
      </section>

      {/* 4. The Poster */}
      <section className="hn-product dc dc4">
        <SectionHeader label="01">Poster</SectionHeader>

        <div className="hn-stack">
          <ImageSlot label="Detail · typology grid zone" aspect="3 / 2" path="/images/nest/poster-detail-2.jpg" />
          <Caption />

          <ImageSlot label="Detail · deckle edge + edition numbering" aspect="3 / 2" path="/images/nest/poster-detail-3.jpg" />
          <Caption />

          <ImageSlot label="In-situ · on a wall" aspect="4 / 5" path="/images/nest/poster-insitu-1.jpg" />
          <Caption />

          <ImageSlot label="In-situ · on a table" aspect="4 / 5" path="/images/nest/poster-insitu-2.jpg" />
          <Caption />
        </div>

        <div className="hn-product-block">
          <h3 className="hn-product-name">NEST / Index Poster</h3>
          <ul className="hn-spec">
            <li>24 × 36 in</li>
            <li>Museum matte, 250gsm, FSC-certified</li>
            <li>Signed + numbered · Edition of 100</li>
          </ul>
          <div className="hn-price">$85</div>
          <a
            className="hn-reserve"
            href={POSTER_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            Reserve →
          </a>
        </div>
      </section>

      {/* 5. The Tee */}
      <section className="hn-product dc dc5">
        <SectionHeader label="02">Tee</SectionHeader>

        <div className="hn-stack">
          <ImageSlot label="Flat lay · front" aspect="4 / 5" path="/images/nest/tee-front.jpg" />
          <Caption />

          <ImageSlot label="Flat lay · back" aspect="4 / 5" path="/images/nest/tee-back.jpg" />
          <Caption />

          <ImageSlot label="Detail · front chest print" aspect="3 / 2" path="/images/nest/tee-detail-front.jpg" />
          <Caption />

          <ImageSlot label="Detail · back type block" aspect="3 / 2" path="/images/nest/tee-detail-back.jpg" />
          <Caption />

          <ImageSlot label="Detail · interior label" aspect="3 / 2" path="/images/nest/tee-detail-label.jpg" />
          <Caption />

          <ImageSlot label="In-situ · worn" aspect="4 / 5" path="/images/nest/tee-insitu.jpg" />
          <Caption />
        </div>

        <div className="hn-product-block">
          <h3 className="hn-product-name">NEST / Edition Tee</h3>
          <ul className="hn-spec">
            <li>100% GOTS-certified organic cotton</li>
            <li>Water-based print · Sizes S–XXL</li>
            <li>Edition of 50</li>
          </ul>

          <div className="hn-size">
            <label htmlFor="hn-size-select">Size</label>
            <select
              id="hn-size-select"
              value={size}
              onChange={(e) => setSize(e.target.value)}
            >
              <option>S</option>
              <option>M</option>
              <option>L</option>
              <option>XL</option>
              <option>XXL</option>
            </select>
          </div>

          <div className="hn-price">$55</div>
          <a
            className="hn-reserve"
            href={TEE_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            Reserve →
          </a>
        </div>
      </section>

      {/* 6. The Tote */}
      <section className="hn-product dc dc6">
        <SectionHeader label="03">Tote</SectionHeader>

        <div className="hn-stack">
          <ImageSlot label="Flat lay · front" aspect="4 / 5" path="/images/nest/tote-front.jpg" />
          <Caption />

          <ImageSlot label="Flat lay · back" aspect="4 / 5" path="/images/nest/tote-back.jpg" />
          <Caption />

          <ImageSlot label="Detail · front print" aspect="3 / 2" path="/images/nest/tote-detail-front.jpg" />
          <Caption />

          <ImageSlot label="Detail · handle reinforcement" aspect="3 / 2" path="/images/nest/tote-detail-handle.jpg" />
          <Caption />

          <ImageSlot label="Detail · interior label" aspect="3 / 2" path="/images/nest/tote-detail-label.jpg" />
          <Caption />

          <ImageSlot label="In-situ · carried" aspect="4 / 5" path="/images/nest/tote-insitu.jpg" />
          <Caption />
        </div>

        <div className="hn-product-block">
          <h3 className="hn-product-name">NEST / Edition Tote</h3>
          <ul className="hn-spec">
            <li>Stanley/Stella STAU773 · 100% GOTS organic cotton, 160 gsm</li>
            <li>Water-based print · Reinforced cross-stitch handles</li>
            <li>Edition of 50</li>
          </ul>
          <div className="hn-price">$45</div>
          <a
            className="hn-reserve"
            href={TOTE_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            Reserve →
          </a>
        </div>
      </section>

      {/* 7. Complete Edition (bundle) */}
      <section className="hn-bundle dc dc7">
        <SectionHeader label="04">Complete Edition</SectionHeader>

        <div className="hn-bundle-body">
          <p className="hn-bundle-lede">
            The poster, the tee, and the tote — the full release, reserved as a set. Capped at 50 complete editions.
          </p>

          <ul className="hn-bundle-list">
            <li>
              <span className="hn-bundle-item">NEST / Index Poster</span>
              <span className="hn-bundle-item-note">24 × 36 in · signed + numbered</span>
              <span className="hn-bundle-item-price">$85</span>
            </li>
            <li>
              <span className="hn-bundle-item">NEST / Edition Tee</span>
              <span className="hn-bundle-item-note">Organic cotton · Sizes S–XXL</span>
              <span className="hn-bundle-item-price">$55</span>
            </li>
            <li>
              <span className="hn-bundle-item">NEST / Edition Tote</span>
              <span className="hn-bundle-item-note">Organic cotton · 160 gsm</span>
              <span className="hn-bundle-item-price">$45</span>
            </li>
          </ul>

          <div className="hn-bundle-total">
            <div className="hn-bundle-total-row">
              <span className="hn-bundle-total-label">Sum of parts</span>
              <span className="hn-bundle-total-strike">$185</span>
            </div>
            <div className="hn-bundle-total-row hn-bundle-total-final">
              <span className="hn-bundle-total-label">Complete edition</span>
              <span className="hn-bundle-total-price">$170</span>
            </div>
          </div>

          <div className="hn-size">
            <label htmlFor="hn-bundle-size-select">Tee size</label>
            <select
              id="hn-bundle-size-select"
              value={size}
              onChange={(e) => setSize(e.target.value)}
            >
              <option>S</option>
              <option>M</option>
              <option>L</option>
              <option>XL</option>
              <option>XXL</option>
            </select>
          </div>

          <a
            className="hn-reserve hn-reserve-bundle"
            href={BUNDLE_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            Reserve the Complete Edition →
          </a>
          <div className="hn-bundle-note">
            Individual reservations stay available above. If the 50 complete-edition sets sell out, individual pieces remain open until their own edition caps.
          </div>
        </div>
      </section>

      {/* 8. On This Edition */}
      <section className="hn-terms dc dc8">
        <SectionHeader label="05">On This Edition</SectionHeader>
        <div className="hn-terms-body">
          <p>Reservations open April 22 and close May 6. The edition is printed once, after reservations close. Each poster is signed and numbered by hand before shipping. Delivery is expected by late May.</p>
          <p>Printed to order. No inventory, no overproduction. The poster is printed by Gelato at a US facility on FSC-certified stock. The tee and tote are printed on Stanley/Stella organic cotton blanks with water-based ink.</p>
          <p>20% of proceeds go to the Gowanus Canal Conservancy.</p>
        </div>
      </section>

      {/* 9. Imprint footer */}
      <footer className="hn-imprint dc dc9">
        A Hotel release · 2026
      </footer>
    </div>
  );
}
