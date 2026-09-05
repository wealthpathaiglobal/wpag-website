import { afterEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import Preview from "@/app/books/hfos-phase-1-stability/preview/page";
import { POST as orders } from "@/app/api/books/orders/route";
import sitemap from "@/app/sitemap";
import { getSafeAuthReturnPath } from "@/lib/auth/safe-redirect";

// No reader mock: this exercises the actual frozen preview's server rendering.
afterEach(() => vi.unstubAllEnvs());
describe("book foundation preserves frozen release boundaries", () => {
  it.each(["false", "true"])("preview remains public with foundation=%s and consumes no account state", enabled => {
    vi.stubEnv("BOOK_READER_FOUNDATION_ENABLED", enabled);
    const html = renderToStaticMarkup(<Preview />);
    expect(html).toContain("Read the opening chapters");
    expect(html).toContain("Free Preview");
    expect(html).not.toContain("Book reader sign in");
  });
  it("foundation and synthetic flags cannot turn on orders/payments", async () => {
    vi.stubEnv("BOOK_READER_FOUNDATION_ENABLED", "true");
    vi.stubEnv("BOOK_READER_SYNTHETIC_ENABLED", "true");
    const response = await orders();
    expect(response.status).toBe(503); expect(await response.json()).toEqual({ error: "PAYMENTS_DISABLED" });
  });
  it("no buyer/synthetic/full-reader route enters public sitemap", () => {
    expect(sitemap().some(x => /book-reader|synthetic|full-reader/.test(x.url))).toBe(false);
  });
  it("participant auth defaults and recovery retain their own destinations", () => {
    expect(getSafeAuthReturnPath(null, "login")).toBe("/participant/dashboard");
    expect(getSafeAuthReturnPath("/auth/update-password", "callback")).toBe("/auth/update-password");
    expect(getSafeAuthReturnPath("/book-reader/account", "login")).toBe("/participant/dashboard");
  });
});
