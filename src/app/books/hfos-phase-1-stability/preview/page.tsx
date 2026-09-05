import { ReaderControls } from '@/components/books/reader-controls';
import { previewPages } from '@/lib/books/preview-pages';
export const metadata = { title: 'Free Preview — HFOS Phase 1', description: 'Read the free preview of HFOS Phase 1: Stability. Educational only.', alternates: { canonical: '/books/hfos-phase-1-stability/preview' } };
export default function Preview() {
  return <><p id="reader-front" className="book-kicker">Free Preview · Educational only</p><h1>Read the opening chapters</h1><ReaderControls pages={previewPages} /></>;
}
