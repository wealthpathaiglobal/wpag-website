# HFOS Phase 1 — Reader UX v3 final refinement

Date: 5 September 2026. Production baseline: a8adb2300319495581df94f7580d4daecd467b2e / Vercel CMsD5QR8Ez556Yt6txyV3Qayg4ED.
Status: final local QA; production verification pending. Do not treat this record as a live PASS until the final deployment section is completed.

## Scope and design
19 stable logical digital pages, distinct from print/PDF pages. Page construction preserves every public paragraph exactly once and in source order. Chapter/section openings start logical chunks, paragraphs remain whole, and a conservative 230-word / nine-block budget produces readable pages without font measurement or dynamic text splitting. Warm paper has a minimum height and natural bottom whitespace, but no fixed height, max-height, clipping or inner scroll. Long content expands in normal document flow. Navigation sits after the page, never over it. Single-page presentation on desktop/mobile; optional two-page spreads and swipes deliberately omitted.

Pages is the initial mode. Scroll displays the same selectable, searchable HTML as continuous paper pages. Only reading-mode preference is stored locally; no progress, personal data or feedback storage. Hash navigation supports Contents, browser history, and section focus. The toolbar remains below the existing site header. One ResizeObserver measures toolbar height only when it changes, setting anchor clearance; pagination never measures prose or repaginates on resize. Reduced-motion disables product contents smooth scrolling. Page turns are immediate.

Public control terms removed from labels, description metadata and preview ending; internal source IDs remain control metadata only. Public language is English, with disabled తెలుగు — Coming later. Translation architecture and chapter JSON remain unchanged. Catalogue Explore goes to the product hero, View contents links to the same-page ten-chapter overview, which contains titles only. Product and preview have distinct public share URLs.

## Feedback route and operations
No new production database, backend, research table, participant record, account, analytics event or automatic email transmission.

The reader and end CTA open a voluntary reading-feedback dialog with optional clarity, useful/improvement text (500 characters each), reading experience, and Full Edition interest. The required non-research/no-financial-information note is present. A populated mailto draft goes to the existing published contact@wealthpathaiglobal.com address. The action says “Open email draft”; explanatory copy states that nothing is submitted on-page and the reader must review and send in their email app. The address is also selectable and directly linked if no email handler is configured. No optional email field is necessary because the sender controls the email app. No marketing opt-in or subscription. Form state is memory-only and expires when the page is left/refreshed.

Operational handling for the support mailbox: treat these messages as product support, never research or enrolment. Restrict review to existing authorized mailbox operators; respond only to the feedback/support request. Record only de-identified issue summaries if needed for material UX corrections. Review resolved messages within 90 days and remove unneeded identifying content using the mailbox’s existing retention controls; do not export into participant systems or marketing lists. This is an operator runbook, not a newly configured automatic mailbox deletion policy or a promise that provider backups are erased. If financial information is volunteered, do not profile or assess it; minimize it in any product issue record. No mailbox messages were sent or deleted during QA.

## Sharing and analytics
Share prepares the neutral educational title/text and exact public start URL. On supported browsers native Web Share is invoked; the accessible menu is already available behind/after the native sheet so a missing OS handler cannot leave the control inert. Copy Link uses the clipboard API; failure displays a selectable link and a truthful copy-unavailable message. WhatsApp/LinkedIn links contain only public URL/neutral text, with noopener/noreferrer. Closing/Escape returns focus. No full text, protected URLs or source IDs are shared. Native success/cancel/failure paths are unit-tested; no external social post is sent during QA.

Existing public analytics remains unchanged. Coarse product events are deliberately deferred pending explicit analytics governance. No replay, fingerprinting, personal/financial profiling, research analytics or new consent flow.

## Checks and evidence
- Build, lint and test results: build.txt, lint.txt, tests.txt.
- Source paragraph/boundary, cover, payload scanning, disabled order/private routes: verify.py, local-boundary.txt / live-boundary.txt.
- Existing 12-route status, URL and main-content regression: verify_existing.py and production-regression.json.
- RSC protected-text and private POST checks: verify_rsc.py and live-rsc-and-methods.json.
- Browser interactions: browser-tests.mjs (resumable generator); desktop/mobile evidence JSON and screenshots in this directory.
- Unit tests cover paragraph order/completeness, heading placement, default Pages, indicator/navigation structure, public terminology, catalogue/product contents, feedback/mailto encoding and isolation, native share success/failure/cancel, and share URL boundaries. Existing security/payment/translation tests retained.

Early QA caught and corrected toolbar/header interference, zoom-dependent anchor clearance, and the need to leave share fallback available after native handoff. One long browser-suite invocation exceeded its tool time limit; the saved generator runs in bounded stages. Native email sending and third-party social posting are intentionally not performed. This is targeted responsive/keyboard QA, not physical-device, screen-reader or full-site WCAG certification.

## Files changed
- src/lib/books/preview-pages.ts — deterministic paragraph-preserving page chunks.
- src/components/books/reader-controls.tsx — paginated/scroll HTML, Contents, focus, keyboard/history, local preference and measured toolbar clearance.
- src/components/books/reader-engagement.tsx — isolated feedback email draft and public share controls.
- src/components/books/book-summary.tsx — product contents and share actions; catalogue destination retained.
- src/app/books/hfos-phase-1-stability/page.tsx — contents anchor and public copy.
- src/app/books/hfos-phase-1-stability/preview/page.tsx — public labels/metadata and paginated reader composition.
- src/app/books/books.css — page/toolbar/dialog/mobile styling.
- src/components/books/reader-v2.test.tsx and reader-v3.test.tsx — updated baseline expectations and v3 contracts.
- docs/books/reader-v3/* — QA, screenshots, operations and freeze record.

## Protected state and freeze
Payments and private paid reader remain disabled; full PDF/ZIP and Chapter 3+ must remain unavailable. No Razorpay PAN/KYC, payment acceptance, cover artwork, canonical manuscript content, KDP, research, counsel, database or governance changes.

After final live PASS, public book UX is frozen: no planned cosmetic/feature pass. Reopen only for real user feedback demonstrating a material issue. Traffic generation is outside this release. Rollback: revert this release or restore the recorded v2 production deployment; no database rollback required.

## Final deployment and live verification
Pending.
