# HFOS Phase 1 — Reader UX v2

Date: 5 September 2026. Baseline: c97d2b93bb80dbfda2bf78f96cbd5dadd43d9ef8.
**PASS — READER UX v2 LIVE, CONTROLLED TRANSLATION ARCHITECTURE READY**

Source commit: c9e64934b840a536297d50bd1a5d1e5232598c79. Production commit: a8adb2300319495581df94f7580d4daecd467b2e.
PR #34: https://github.com/wealthpathaiglobal/wpag-website/pull/34 (merged).
Vercel preview: 7QxT9Cbmqs94SA34AkoGNBR2F7pa — SUCCESS.
Vercel production: CMsD5QR8Ez556Yt6txyV3Qayg4ED — SUCCESS. GitHub production deployment: 6281871120.

Live URLs:
- https://www.wealthpathaiglobal.com/books
- https://www.wealthpathaiglobal.com/books/hfos-phase-1-stability
- https://www.wealthpathaiglobal.com/books/hfos-phase-1-stability/preview

## Before / after
The previous warm-neutral document presentation had a top-only Contents list and policy dead ends. Reader v2 uses Georgia editorial type, warm paper, bounded reading measure, chapter labels and openers, a compact sticky toolbar, accessible modal Contents, and persistent adjacent-section controls. A deliberate end state returns to the book without promoting an available purchase. Catalogue/product titles share the editorial treatment; the approved cover is untouched.

Policy recovery now offers Home, Books and Phase 1 on the three live policy pages. Shared footer includes Books and brighter secondary text; public header conveys active location and has a 44px mobile menu button. Books pages have a visible-on-focus skip link.

## Source scope
- src/app/books/books.css — typography, layout, controls, focus, reduced-motion and narrow-screen rules.
- src/app/books/hfos-phase-1-stability/preview/page.tsx — semantic reader presentation with server-rendered canonical paragraphs.
- src/app/books/layout.tsx — skip link and focusable main landmark.
- src/components/books/reader-controls.tsx — modal Contents, explicit Tab wrapping, Escape/close focus return, heading focus, adjacent navigation and English language control.
- src/components/books/policy-return.tsx and three live policy pages — return navigation only; policy text unchanged.
- src/components/site-header.tsx and site-footer.tsx — audit refinements.
- src/lib/books/translations.ts, translations.test.ts, src/content/books/locales/manifest.json — controlled translation architecture.
- src/components/books/reader-v2.test.tsx and this QA directory — targeted verification.

## Translation architecture
English chapter JSON files remain byte-identical. The locale manifest links each English chapter file with SHA256. The server-side registry derives stable paragraph source IDs and SHA256 text hashes, grouping paragraphs by chapter. Future locale chapter files must supply locale, sourceId, sourceHash, draft/reviewed/approved status, text and glossaryVersion, and be explicitly registered. Unknown IDs are refused. Unavailable, stale, wrong-locale or unapproved translations fall back to English. Only approved records matching the current source hash and glossary version can resolve as translated text. The tested resolver is prepared for later integration; the present reader exposes English only. Telugu is disabled as Coming later; no Telugu edition or AI explanation feature is generated.

Controlled glossary v1 preserves Capacity, Load, Margin, Fragility, Under Pressure and Collapse, with empty Telugu explanation mapping. No unreviewed doctrine definitions were invented. No full-manuscript imports or automatic directory discovery. No reading persistence or new tracking; current-section state lasts only while the reader is mounted. Existing site analytics is unchanged.

## Local evidence
- Build and lint pass; 60 test files / 579 tests pass.
- Connected-browser reusable suite: Shift+Tab and Tab wrap, Escape focus return, selected-heading focus, Previous 2.3 / Next 2.4, end state, English-only control, endpoint and no overflow.
- 12 responsive page checks: catalogue/product/preview at 320/390/768/1440. One h1, loaded covers, disabled purchase, no horizontal or toolbar overflow.
- All 11 Contents links clicked and resolved to heading focus below toolbar. Mobile section headings around y176 versus toolbar y142; chapter heading clearance later expanded to retain the chapter label.
- Canonical prose: 111 public paragraphs exactly match baseline presentation, from 114 original preview paragraphs with the same three previously omitted internal fields. Last source ID D0202; D0205 absent.
- 306 protected paragraphs scanned against build/public files and served chunks, none found. 13 protected/draft-policy routes return inert 404/noindex; order POST returns 503 PAYMENTS_DISABLED.
- Existing 12 page status/URL/main-content regression passes; only exact added policy navigation labels are removed for comparison.
- Cover SHA256: a5d2a3c3e5e5b38029ae99221880703b8573e64e5a6ec3763653e7bd9fce32ba.

Browser testing caught native focus escaping and a cramped 320px toolbar; both corrected before release. Build setup first lacked existing environment settings; final build uses existing website settings without printing or modifying credentials. No physical device, assistive screen-reader or Core Web Vitals certification is claimed; 320px reflow and native browser keyboard checks provide targeted evidence.

## Protected scope
Payments, private reader, KYC, KDP, research, counsel, governance, canonical book JSON, cover assets and database configuration remain unchanged. Draft access/refund policies remain blocked. Public canonicals and sitemap configuration are unchanged. No Chapter 3+ reader payload, endpoint, or link is introduced.

Rollback: revert this release PR or restore production c97d2b9 / Vercel AyaExNRCxHBLywowaVZpLs5i8kqC. No database rollback.

## Final production verification
- Home → mobile menu Books → Explore the book → Read the free preview → Contents → sections → End → Back to the book → all three policies → Back to Phase 1 completed. Initial pre-hydration menu click was repeated successfully after inspecting loaded state.
- Reusable live interaction suite passes all ten assertions (see live-interaction.json). Explicit focus wrapping works in both directions; Escape returns to the opener; destination headings receive focus.
- All 11 live Contents destinations pass focus, closure and toolbar clearance assertions (live-contents.json). Browser Back returned to §2.3 and Forward to §2.4.
- All nine live public-page layouts at 320/390/1440 pass overflow and heading checks. Covers verified after load completion: 238×357 mobile, 358×537 desktop, with descriptive alt text. Initial immediate navigation observations preceded image completion; final live-responsive.json and live-covers.json record loaded results.
- Preview ending, disabled purchase, exact canonical prose, cover hash, no protected paragraphs in served HTML/client/RSC payloads, 13 protected routes, and disabled-order response all pass on production. See live-boundary.txt, live-checks.json and live-rsc-and-methods.json.
- Existing 12-route regression passes; policy body text unchanged after excluding only the explicit added return labels.
- Public sitemap lists all three Books routes, excludes reader/library, and robots.txt allows public indexing. Canonical URLs remain self-referencing; protected routes remain noindex.
- Browser warning/error log was empty during the final checks. Zoom is not disabled (viewport width=device-width, initial-scale=1); narrow reflow verified. No native 200%/400% or physical-device certification is claimed. No new animation; reduced-motion rule retained for reader styling.
- The reader uses high-contrast dark ink on warm paper, light text on its dark toolbar, and explicit focus outlines. Footer secondary text changed from zinc-600 to zinc-400. This is targeted accessibility QA, not a full-site WCAG audit.

Screenshots: [Desktop reader](live-desktop-chapter.png), [Mobile end state](live-mobile-end.png), [Mobile Contents](mobile-contents.png), [Narrow end state](mobile-end.png).

The prepared translation resolver and locale manifest are source architecture for future integration; no unavailable locale is enabled, no full Telugu translation is included, and no browser translation is presented as official. Existing analytics is unchanged; no reader progress storage, tracking events or account collection added.

**PASS — READER UX v2 LIVE, CONTROLLED TRANSLATION ARCHITECTURE READY**
