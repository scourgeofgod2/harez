# Linear DESIGN.md

version: alpha
name: Linear
website: https://linear.app

A near-black product canvas built around `#010102`, light gray text `#f7f8f8`, and lavender-blue `#5e6ad2` as the single chromatic accent. Dense, technical, quietly luxurious. Cards are charcoal panels with hairline borders. Lavender appears on the brand mark, focus rings, and a few CTAs — never decoratively.

## Colors

| token | hex |
| --- | --- |
| primary | #5e6ad2 |
| on-primary | #ffffff |
| primary-hover | #828fff |
| primary-focus | #5e69d1 |
| ink | #f7f8f8 |
| ink-muted | #d0d6e0 |
| ink-subtle | #8a8f98 |
| ink-tertiary | #62666d |
| canvas | #010102 |
| surface-1 | #0f1011 |
| surface-2 | #141516 |
| surface-3 | #18191a |
| surface-4 | #191a1b |
| hairline | #23252a |
| hairline-strong | #34343a |
| hairline-tertiary | #3e3e44 |
| inverse-canvas | #ffffff |
| inverse-surface-1 | #f5f6f6 |
| inverse-surface-2 | #f6f7f7 |
| inverse-ink | #000000 |
| brand-secure | #7a7fad |
| semantic-success | #27a644 |
| semantic-overlay | #000000 |

## Typography

Inter substitutes Linear Display and Linear Text. IBM Plex Mono substitutes Linear Mono.

| token | size | weight | line | tracking |
| --- | --- | --- | --- | --- |
| display-xl | 80px | 600 | 1.05 | -3.0px |
| display-lg | 56px | 600 | 1.10 | -1.8px |
| display-md | 40px | 600 | 1.15 | -1.0px |
| headline | 28px | 600 | 1.20 | -0.6px |
| card-title | 22px | 500 | 1.25 | -0.4px |
| subhead | 20px | 400 | 1.40 | -0.2px |
| body-lg | 18px | 400 | 1.50 | -0.1px |
| body | 16px | 400 | 1.50 | -0.05px |
| body-sm | 14px | 400 | 1.50 | 0 |
| caption | 12px | 400 | 1.40 | 0 |
| button | 14px | 500 | 1.20 | 0 |
| eyebrow | 13px | 500 | 1.30 | +0.4px |
| mono | 13px | 400 | 1.50 | 0 |

## Radius

xs 4px, sm 6px, md 8px, lg 12px, xl 16px, xxl 24px, pill 9999px.

## Spacing

4 / 8 / 12 / 16 / 24 / 32 / 48 / section 96. Base unit 4px.

## Components

- button-primary: bg primary, text white, 14px/500, radius 8px, padding 8px 14px. Hover `#828fff`, pressed `#5e69d1`.
- button-secondary: bg surface-1, text ink, hairline border, same padding.
- button-tertiary: bg canvas, text ink.
- button-inverse: bg white, text black. Rare.
- pricing-card / feature-card: surface-1, radius 12px, padding 24px, hairline.
- pricing-card-featured: surface-2.
- product-screenshot-card: surface-1, radius 16px, padding 24px.
- testimonial-card: surface-1, radius 12px, padding 32px, body-lg.
- customer-logo-tile: canvas, ink-subtle, radius 4px, padding 16px.
- text-input: surface-1, ink, radius 8px, padding 8px 12px. Focus uses primary ring.
- pricing-tab: pill. Default canvas + ink-subtle. Selected surface-2 + ink. Padding 6px 14px.
- cta-banner: surface-1, headline, radius 12px, padding 48px.
- changelog-row: canvas, padding 24px 0, hairline divider.
- status-badge: surface-2, ink-muted, caption, pill, padding 2px 8px.
- top-nav: canvas, body-sm, height 56px.
- footer: canvas, ink-subtle, caption, padding 64px 32px.

## Rules

- Four-step surface ladder carries hierarchy. Do not use drop shadows.
- Lavender is scarce: brand mark, primary CTA, focus ring, link emphasis.
- No second chromatic color, no atmospheric gradient, no spotlight card.
- Display tracking is aggressively negative. Eyebrows use positive tracking.
- Cards use 12px corners and a 1px hairline. Pills only for badges and tabs.
- Product UI is the protagonist. Marketing chrome is a dark frame.
- Light mode is out of scope. Inverse tokens exist only for a rare white pill CTA.
- Form error styling is unspecified; use a quiet red border plus `#62666d` helper text.
- Issue tag colors (red, orange, yellow, green, blue, purple) belong inside product mockups, not page chrome.
