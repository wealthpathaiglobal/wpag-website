import { publicPreview } from './public-preview';
export type PreviewParagraph = (typeof publicPreview)[number]['paragraphs'][number];
export type PreviewPage = { title: string; paragraphs: PreviewParagraph[] };
// Logical HTML pages: preserve whole paragraphs and source order, never measure the DOM.
export function paginatePreview(): PreviewPage[] {
  const pages: PreviewPage[] = [];
  let paragraphs: PreviewParagraph[] = [], title = 'Front matter', words = 0;
  const flush = () => { if (paragraphs.length) pages.push({ title, paragraphs }); paragraphs = []; words = 0; };
  for (const p of publicPreview.flatMap(part => part.paragraphs)) {
    const heading = ['MatterHeading', 'Heading1', 'Heading2'].includes(p.style);
    const hasBody = paragraphs.some(item => !['ChapterLabel', 'Heading1', 'Heading2'].includes(item.style));
    if (p.style === 'ChapterLabel' || (heading && hasBody)) flush();
    const count = p.text.split(/\s+/).length;
    if (!heading && p.style !== 'ChapterLabel' && hasBody && (words + count > 230 || paragraphs.length >= 9)) flush();
    if (heading) title = p.text;
    paragraphs.push(p); words += count;
  }
  flush();
  return pages;
}
export const previewPages = paginatePreview();
