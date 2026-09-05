import { createHash } from 'node:crypto';
import { publicPreview } from './public-preview';

export type TranslationStatus = 'draft' | 'reviewed' | 'approved';
export type TranslationSection = {
  locale: string;
  sourceId: string;
  sourceHash: string;
  status: TranslationStatus;
  text: string;
  glossaryVersion: '1';
};
export const terminology = {
  version: '1',
  terms: ['Capacity', 'Load', 'Margin', 'Fragility', 'Under Pressure', 'Collapse'],
  policy: 'Retain these English terms; reviewed locale explanations may accompany them without replacing their meaning.',
  explanations: { te: {} as Record<string, string> },
} as const;
export const canonicalEnglish = publicPreview.map(chapter => ({
  locale: 'en' as const,
  chapterId: chapter.id,
  sections: chapter.paragraphs.map(p => ({ sourceId: p.id, sourceHash: createHash('sha256').update(p.text, 'utf8').digest('hex'), text: p.text })),
}));
// Future locale files are explicitly registered here after editorial approval.
// Never import the full manuscript or scan an unrestricted content directory.
export const translationEditions: Readonly<Record<string, readonly TranslationSection[]>> = {};
export function resolveTranslation(sourceId: string, locale: string, editions = translationEditions) {
  const source = canonicalEnglish.flatMap(c => c.sections).find(s => s.sourceId === sourceId);
  if (!source) return undefined;
  const candidate = editions[locale]?.find(s => s.sourceId === sourceId && s.locale === locale && s.status === 'approved' && s.sourceHash === source.sourceHash && s.glossaryVersion === terminology.version);
  return candidate ? { text: candidate.text, locale, canonical: false } : { text: source.text, locale: 'en', canonical: true };
}
