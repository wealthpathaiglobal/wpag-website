import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { BookSummary } from './book-summary';
import Product from '@/app/books/hfos-phase-1-stability/page';
import { POST } from '@/app/api/books/orders/route';
import sitemap from '@/app/sitemap';
vi.mock('next/image', () => ({ default: ({ alt }: { alt: string }) => <span role="img" aria-label={alt} /> }));
describe('Public Books release boundary', () => {
 it('presents unavailable purchasing as information and no draft policy links', () => {
  const html = renderToStaticMarkup(<BookSummary />);
  expect(html).toContain('Purchasing is not yet available.');
  expect(html).not.toMatch(/<button[^>]*>[^<]*(?:purchase|payments|Buy|Checkout)/i);
  expect(html).not.toContain('/books/policies');
  expect(html).toContain('₹199');
  const product = renderToStaticMarkup(<Product />);
  expect(product).toContain('Planned full-edition access');
  expect(product).toContain('Planned access duration: 24 months.');
 });
 it('rejects orders even if an enable flag is supplied', async () => {
  vi.stubEnv('READER_PURCHASES_ENABLED', 'true');
  const response = await POST();
  expect(response.status).toBe(503);
  expect(await response.json()).toEqual({ error: 'PAYMENTS_DISABLED' });
  vi.unstubAllEnvs();
 });
 it('indexes exactly the three public book routes on the www canonical host', () => {
  const urls = sitemap().map(entry => entry.url);
  expect(urls.filter(url => url.includes('/books'))).toEqual(['/books','/books/hfos-phase-1-stability','/books/hfos-phase-1-stability/preview'].map(path => 'https://www.wealthpathaiglobal.com'+path));
  expect(urls.some(url => /library|account|chapter|policies/.test(url))).toBe(false);
 });
 it('preserves the verified preview boundary and excludes full chapter files', () => {
  const chapter = JSON.parse(readFileSync('src/content/books/ch02.json', 'utf8'));
  expect(chapter.paragraphs.at(-1).id).toBe('src_D0202');
  expect(JSON.stringify(chapter)).not.toContain('src_D0205');
 });
});
