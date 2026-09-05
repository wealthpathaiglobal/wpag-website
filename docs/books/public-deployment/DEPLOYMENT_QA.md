# HFOS Books controlled public deployment — 5 September 2026

Pre-deployment QA: PASS. Production deployment and live verification pending.

Source: prepared `feature/hfos-phase1-books-private-reader` at `fd06302`.
Deployment baseline: live production `95c28fb20ad9591dbac36ebbbc8833469651bb46`, Vercel deployment `DC3jJQs2MrjYEFGdgoadGVg1XfTh` (`wpag-website-d0ov88h94-wealthpathaiglobal.vercel.app`).
Release branch: `release/hfos-books-public-preview`.

The prepared branch contained 226 unrelated staging/research differences from live production. Only Books source, cover, navigation and canonical/sitemap changes were selected onto the live baseline. Existing research, participant, authentication, payment configuration, database, root layout and analytics code remain unchanged. No migrations, real credentials or customer data were introduced.

Public routes: `/books`, `/books/hfos-phase-1-stability`, `/books/hfos-phase-1-stability/preview`, all canonical to `https://www.wealthpathaiglobal.com` and indexable in the sitemap. Planned price ₹199 and planned 24-month access are retained; no tax/invoice assertions added.

Release corrections: remove draft customer-policy copy and links; make three public pages indexable; block library/account/reader/chapter/entitlement and draft policy paths using beforeFiles rewrites to an inert 404, noindex/nofollow/noarchive, private/no-store response. Existing root proxy is preserved; it was not emitted by the current build, so the new boundaries are verified independently through actual HTTP responses.

Checks: final build and lint passed; 57 production test files / 572 tests passed. Previous 845 count belongs to the broader development branch and is not claimed for this isolated release. All 114 preview paragraphs byte-match Release Package v1.0 and match rendered text, final `src_D0202`; `src_D0205` absent. Selected cover byte-matches release `HFOS_Phase1_Cover_240px_v1.0.webp`. Scanned 306 protected paragraphs against 935 build/public payload files and 11 served client chunks; none found. No full-book PDF/ZIP/JSON asset or content endpoint added. 13 private/policy paths return inert 404/noindex; representative full-content paths return 404. Order POST returns 503 `PAYMENTS_DISABLED`; disabled purchase button has no action.

Browser QA: all three pages at 390×844 and 1440×1000, one h1 each, no horizontal overflow, cover loaded, correct canonical, preview final ID and disabled CTA. Desktop cover/product and mobile product/preview ending visually reviewed; mobile Books navigation opens, navigates and closes correctly.

Safety: payments and private customer reader remain disabled. Full content and synthetic reader are outside this checkout. No Razorpay/KYC, real order, money, customer activation, KDP or research/counsel/governance change.

Rollback: restore production deployment `DC3jJQs2MrjYEFGdgoadGVg1XfTh` using the existing Vercel project, or revert this isolated source commit. No database rollback is required. Post-deployment checks must compare the 12 recorded existing public route main-content/status baselines and rerun exact preview/private boundary checks.

Hosting correction: first preview deployment `5wFp5RzRrwzyYYENi51gSmvr3fPe` failed because an unanchored packaging exclusion also removed existing `src/lib/supabase` website files. All directory exclusions are now explicitly root-anchored. No production release occurred on that failed build.
