import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync } from 'node:fs';
import { previewPages } from '@/lib/books/preview-pages';
import { publicPreview } from '@/lib/books/public-preview';
import Preview, { metadata } from '@/app/books/hfos-phase-1-stability/preview/page';
import Product from '@/app/books/hfos-phase-1-stability/page';
import { BookSummary } from './book-summary';
import { feedbackMailto, FEEDBACK_NOTE, PREVIEW_URL, PRODUCT_URL, sharePreview, SHARE_TEXT } from './reader-engagement';
afterEach(() => vi.unstubAllGlobals());
describe('Reader v3 release contracts', () => {
 it('preserves every public paragraph exactly once, in order, with the exact endpoint', () => {
  const paragraphs = previewPages.flatMap(p => p.paragraphs);
  expect(paragraphs).toEqual(publicPreview.flatMap(p => p.paragraphs));
  expect(new Set(paragraphs.map(p => p.id)).size).toBe(paragraphs.length);
  expect(paragraphs.at(-1)?.id).toBe('src_D0202');
  expect(previewPages.every(p => p.paragraphs.length > 0)).toBe(true);
  expect(paragraphs.some(p => p.id === 'src_D0205')).toBe(false);
 });
 it('starts each section on a page and never strands a heading at the bottom', () => {
  for (const page of previewPages) {
   expect(['Heading1','Heading2','MatterHeading','ChapterLabel']).not.toContain(page.paragraphs.at(-1)?.style);
   const headings = page.paragraphs.filter(p => p.style === 'Heading2');
   expect(headings.length).toBeLessThanOrEqual(1);
  }
 });
 it('renders one default page, page totals, outside navigation and accessible HTML', () => {
  const html = renderToStaticMarkup(<Preview/>);
  expect(html.match(/class="book-preview digital-page" hidden=""/g)).toHaveLength(previewPages.length - 1);
  expect(html).toContain(`Page 1 of ${previewPages.length}`);
  expect(html).toContain('aria-pressed="true">Pages');
  expect(html.indexOf('aria-label="Read adjacent pages"')).toBeGreaterThan(html.indexOf('</article>'));
  expect(html).not.toMatch(/<iframe|\.pdf["?]|\.zip["?]/i);
 });
 it('keeps catalogue Explore on the hero and provides same-page contents', () => {
  expect(renderToStaticMarkup(<BookSummary catalogue/>)).toContain('href="/books/hfos-phase-1-stability">Explore the book');
  const html=renderToStaticMarkup(<Product/>);
  expect(html).not.toContain('View contents');expect(html).toContain('id="book-contents"');
  expect(html).not.toContain('Sales are not open.');
  expect(html).not.toContain('Explore the opening');
  expect(html.indexOf('One personal account')).toBeGreaterThan(html.indexOf('10. Phase Transition'));
  expect(html).toContain('Planned full-edition access');
  expect(html).toContain('Planned access duration: 24 months.');
  expect(html.match(/This book does not provide personal financial advice, assessment, or research enrolment/g)).toHaveLength(1);
  expect(renderToStaticMarkup(<BookSummary/>)).not.toContain('One personal account');
  expect(html).toContain('10. Phase Transition');
  expect(html).toContain('Purchasing is not yet available.');
  expect(html).toContain('₹199 planned');
  expect(html).toContain('Free preview — available now');
  expect(html).not.toContain('Coming soon — payments not yet enabled');
  expect(html).not.toMatch(/>Buy|>Purchase|>Checkout/);
  expect(html).toContain('The free preview includes the opening material and Chapters 1–2.');
 });
 it('removes public control terminology and retains public language names', () => {
  const html = renderToStaticMarkup(<Preview/>)+renderToStaticMarkup(<Product/>)+metadata.description;
  const visible = html.replace(/<[^>]*>/g,'');
  expect(visible).not.toMatch(/canonical|D0202|through §2.4|before Chapter 3|Production master/i);
  expect(html).toContain('>English</option>');expect(html).toContain('తెలుగు — Coming later');
  expect(html).toContain('End of Free Preview');expect(html).toContain('Explore the Full Edition');
 });
 it('offers a truthful isolated email flow, without research enrolment or required personal fields', () => {
  const html=renderToStaticMarkup(<Preview/>);
  expect(html).toContain(FEEDBACK_NOTE);expect(html).toContain('Nothing is submitted on this page.');
  expect(html).toContain('Open email draft');expect(html).not.toContain('type="email"');
  const link=feedbackMailto({clarity:'5',useful:'A & B',improve:'Line\nbreak',experience:'Good',interest:'Maybe'});
  const url=new URL(link);
  expect(url.pathname).toBe('contact@wealthpathaiglobal.com');
  expect(url.searchParams.get('body')).toContain('Most useful: A & B');
  expect(url.searchParams.get('body')).toContain('No marketing subscription requested.');
  const source=readFileSync('src/components/books/reader-engagement.tsx','utf8');
  expect(source).not.toMatch(/supabase|participant|fetch\(|localStorage|sessionStorage/);
 });
 it('uses only the public start/product URLs in share links', () => {
  const html=renderToStaticMarkup(<Preview/>);
  expect(html).toContain(encodeURIComponent(PREVIEW_URL));
  expect(html).toContain('Copy Link');expect(html).toContain('WhatsApp');expect(html).toContain('LinkedIn');
  expect(PREVIEW_URL).toBe(PRODUCT_URL+'/preview');expect(PREVIEW_URL).not.toContain('#');
 });
 it('invokes native sharing with neutral metadata', async () => {
  const share=vi.fn().mockResolvedValue(undefined);vi.stubGlobal('navigator',{share});
  expect(await sharePreview(PREVIEW_URL)).toBe(false);
  expect(share).toHaveBeenCalledWith({title:'HFOS — Phase 1: Stability',text:SHARE_TEXT,url:PREVIEW_URL});
 });
 it('uses fallback when native sharing is absent or fails, but respects cancellation', async () => {
  vi.stubGlobal('navigator',{});expect(await sharePreview(PREVIEW_URL)).toBe(true);
  vi.stubGlobal('navigator',{share:vi.fn().mockRejectedValue(new Error('Unavailable'))});expect(await sharePreview(PREVIEW_URL)).toBe(true);
  vi.stubGlobal('navigator',{share:vi.fn().mockRejectedValue(new DOMException('Cancelled','AbortError'))});expect(await sharePreview(PREVIEW_URL)).toBe(false);
 });
});
