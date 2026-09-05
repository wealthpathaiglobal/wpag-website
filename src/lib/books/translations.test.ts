import { describe, expect, it } from 'vitest';
import { canonicalEnglish, resolveTranslation, terminology, type TranslationSection } from './translations';
describe('Controlled translation gates', () => {
 const source = canonicalEnglish[1].sections[0];
 const candidate: TranslationSection = { locale:'te',sourceId:source.sourceId,sourceHash:source.sourceHash,status:'draft',text:'test translation',glossaryVersion:'1' };
 it('falls back to canonical English for unavailable, draft, reviewed and stale editions', () => {
  for (const status of ['draft','reviewed'] as const) expect(resolveTranslation(source.sourceId,'te',{te:[{...candidate,status}]})).toEqual({text:source.text,locale:'en',canonical:true});
  expect(resolveTranslation(source.sourceId,'te',{te:[{...candidate,status:'approved',sourceHash:'stale'}]})?.canonical).toBe(true);
  expect(resolveTranslation(source.sourceId,'te')?.canonical).toBe(true);
 });
 it('requires approved matching source, locale and glossary version', () => {
  expect(resolveTranslation(source.sourceId,'te',{te:[{...candidate,status:'approved'}]})).toEqual({text:'test translation',locale:'te',canonical:false});
  expect(resolveTranslation(source.sourceId,'hi',{hi:[{...candidate,status:'approved'}]})?.canonical).toBe(true);
 });
 it('excludes protected content and keeps terminology explicit', () => {
  expect(resolveTranslation('src_D0205','en')).toBeUndefined();
  expect(canonicalEnglish.at(-1)?.sections.at(-1)?.sourceId).toBe('src_D0202');
  expect(terminology.terms).toContain('Under Pressure');
  expect(terminology.explanations.te).toEqual({});
 });
});
