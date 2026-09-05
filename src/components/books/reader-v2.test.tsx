import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import Preview from '@/app/books/hfos-phase-1-stability/preview/page';
import { PolicyReturn } from './policy-return';
import { SiteFooter } from '../site-footer';
import { readFileSync } from 'node:fs';
describe('Reader v2 public contracts', () => {
 it('provides a named native modal, adjacent navigation and truthful language options', () => {
  const html=renderToStaticMarkup(<Preview/>);
  expect(html).toContain('<dialog');expect(html).toContain('aria-labelledby="reader-contents-title"');
  expect(html).toContain('aria-label="Read adjacent pages"');
  expect(html).toContain('<option value="te" disabled="">తెలుగు — Coming later</option>');
  expect(html).toContain('>English</option>');expect(html).toContain('lang="en"');
  expect(html).toContain('id="reader-end"');expect(html).not.toContain('src_D0205');
 });
 it('provides footer Books and policy recovery without activating draft policies', () => {
  expect(renderToStaticMarkup(<SiteFooter/>)).toContain('href="/books"');
  const html=renderToStaticMarkup(<PolicyReturn/>);
  for(const path of ['/','/books','/books/hfos-phase-1-stability']) expect(html).toContain(`href="${path}"`);
  for(const name of ['privacy-policy','terms-of-use','cookie-policy']) expect(readFileSync(`src/app/${name}/page.tsx`,'utf8')).toContain('<PolicyReturn />');
 });
});
