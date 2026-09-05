import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import Preview from '@/app/books/hfos-phase-1-stability/preview/page';
import { publicPreview } from '@/lib/books/public-preview';
import front from '@/content/books/front-matter.json';
import ch01 from '@/content/books/ch01.json';
import ch02 from '@/content/books/ch02.json';

describe('Public preview presentation', () => {
 it('omits internal edition metadata from rendered content and preserves controlled prose', () => {
  const html = renderToStaticMarkup(<Preview />);
  for (const label of ['Production master', 'NON-PUBLIC', 'RELEASE REVIEW REQUIRED', '5 September 2026']) expect(html).not.toContain(label);
  expect(html).toContain('owner’s conceptual HFOS framework');
  expect(front.paragraphs.some(p => p.text.includes('NON-PUBLIC'))).toBe(true);
  expect(publicPreview.slice(1)).toEqual([ch01, ch02]);
  expect(publicPreview[2].paragraphs.at(-1)?.id).toBe('src_D0202');
  expect(html).not.toContain('src_D0205');
  expect(html).toContain('Back to the book');
 });
 it('links every clean contents entry only to an accessible preview heading', () => {
  const html = renderToStaticMarkup(<Preview />);
  const toc = publicPreview[0].paragraphs.filter(p => p.style.startsWith('TOC'));
  expect(toc).toHaveLength(11);
  for (const p of toc) {
   expect(p.text).not.toMatch(/\t|\s\d+$/);
   expect(html).toContain(`href="#${p.links[0].target}"`);
   expect(html).toContain(`id="${p.links[0].target}"`);
  }
  expect(html).not.toMatch(/Chapter (?:[3-9]|10)/);
 });
});
