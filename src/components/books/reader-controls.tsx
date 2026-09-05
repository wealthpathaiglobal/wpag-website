"use client";
import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import type { PreviewPage } from '@/lib/books/preview-pages';
import { BookShare, FeedbackForm } from './reader-engagement';

export function ReaderControls({ pages }: { pages: PreviewPage[] }) {
  const [active, setActive] = useState(0);
  const [mode, setMode] = useState<'pages' | 'scroll'>('pages');
  const dialog = useRef<HTMLDialogElement>(null);
  const root = useRef<HTMLDivElement>(null);
  const toolbar = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!toolbar.current) return;
    const observer = new ResizeObserver(([entry]) => {
      root.current?.style.setProperty('--reader-clearance', `${80 + entry.target.getBoundingClientRect().height + 24}px`);
    });
    observer.observe(toolbar.current);
    return () => observer.disconnect();
  }, []);
  const opener = useRef<HTMLButtonElement | null>(null);
  const entries = pages.flatMap((page, index) => page.paragraphs.filter(p => ['MatterHeading', 'Heading1', 'Heading2'].includes(p.style)).map(p => ({ ...p, page: index })));
  function close() { dialog.current?.close(); opener.current?.focus({ preventScroll: true }); }
  function go(index: number, id?: string, push = true) {
    const next = Math.max(0, Math.min(index, pages.length));
    setActive(next);
    if (dialog.current?.open) close();
    const target = id ?? (next === pages.length ? 'reader-end' : `preview-page-${next + 1}`);
    if (push) history.pushState(null, '', `#${target}`);
    requestAnimationFrame(() => { const element = document.getElementById(target); element?.focus({ preventScroll: true }); element?.scrollIntoView({ block: 'start' }); });
  }
  useEffect(() => {
    const preferenceFrame = requestAnimationFrame(() => { try { if (localStorage.getItem('hfos-reading-mode') === 'scroll') setMode('scroll'); } catch { /* Preferences are optional. */ } });
    const fromHash = () => {
      let id = '';
      try { id = decodeURIComponent(location.hash.slice(1)); } catch { return; }
      if (!id) { setActive(0); return; }
      const index = id === 'reader-end' ? pages.length : pages.findIndex((page, i) => id === `preview-page-${i + 1}` || page.paragraphs.some(p => p.id === id));
      if (index >= 0) { setActive(index); requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView()); }
    };
    const hashFrame = requestAnimationFrame(fromHash); addEventListener('popstate', fromHash); addEventListener('hashchange', fromHash);
    return () => { cancelAnimationFrame(preferenceFrame); cancelAnimationFrame(hashFrame); removeEventListener('popstate', fromHash); removeEventListener('hashchange', fromHash); };
  }, [pages]);
  function keyboard(event: KeyboardEvent<HTMLDivElement>) {
    if (mode !== 'pages' || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || document.querySelector('dialog[open]')) return;
    if ((event.target as HTMLElement).closest('input,textarea,select,button,a,[contenteditable="true"]')) return;
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); go(active + (event.key === 'ArrowRight' ? 1 : -1)); }
  }
  function trap(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.key !== 'Tab') return;
    const items = event.currentTarget.querySelectorAll<HTMLElement>('button,a[href]');
    if (event.shiftKey && document.activeElement === items[0]) { event.preventDefault(); items[items.length - 1].focus(); }
    else if (!event.shiftKey && document.activeElement === items[items.length - 1]) { event.preventDefault(); items[0].focus(); }
  }
  return <div ref={root} className="digital-reader" onKeyDown={keyboard}>
    <div ref={toolbar} className="reader-toolbar" role="region" aria-label="Reader controls">
      <button type="button" aria-haspopup="dialog" onClick={e => { opener.current = e.currentTarget; dialog.current?.showModal(); }}>Contents</button>
      <label className="reader-language">Language<select aria-label="Reading language" defaultValue="en"><option value="en">English</option><option value="te" disabled>తెలుగు — Coming later</option></select></label>
      <FeedbackForm />
      <BookShare />
      <div className="reader-modes" role="group" aria-label="Reading mode">{(['pages', 'scroll'] as const).map(value => <button type="button" key={value} aria-pressed={mode === value} onClick={() => { setMode(value); try { localStorage.setItem('hfos-reading-mode', value); } catch {} }}>{value === 'pages' ? 'Pages' : 'Scroll'}</button>)}</div>
    </div>
    <p className="reader-page-context" aria-live="polite">{mode === 'scroll' ? 'Free Preview · Scroll' : active === pages.length ? 'End of Free Preview' : pages[active].title}</p>
    <dialog ref={dialog} className="reader-dialog" aria-labelledby="reader-contents-title" onKeyDown={trap} onCancel={e => { e.preventDefault(); close(); }} onClick={e => { if (e.target === e.currentTarget) close(); }}>
      <div className="reader-dialog-top"><h2 id="reader-contents-title">Contents</h2><button type="button" onClick={close} autoFocus>Close</button></div>
      <p>Free Preview · English</p>
      <nav aria-label="Preview contents"><a href="#preview-page-1" onClick={e => { e.preventDefault(); go(0); }}>Front matter</a>{entries.map(entry => <a key={entry.id} href={`#${entry.id}`} aria-current={active === entry.page ? 'location' : undefined} className={entry.style === 'Heading1' ? 'reader-chapter-link' : undefined} onClick={e => { e.preventDefault(); go(entry.page, entry.id); }}>{entry.text}</a>)}<a href="#reader-end" onClick={e => { e.preventDefault(); go(pages.length); }}>End of Free Preview</a></nav>
    </dialog>
    <article lang="en" aria-label="HFOS Phase 1 free preview" className={`reader-pages reader-${mode}`} onClick={e => {
      const link = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="#"]');
      if (!link) return;
      const id = link.hash.slice(1), index = pages.findIndex(page => page.paragraphs.some(p => p.id === id));
      if (index >= 0) { e.preventDefault(); go(index, id); }
    }}>
      {pages.map((page, index) => <section className="book-preview digital-page" hidden={mode === 'pages' && active !== index} key={index} id={`preview-page-${index + 1}`} tabIndex={-1} aria-label={`Page ${index + 1} of ${pages.length}`}>
        {page.paragraphs.map(p => {
          if (p.style === 'Heading1' || p.style === 'MatterHeading') return <h2 tabIndex={-1} key={p.id} id={p.id}>{p.text}</h2>;
          if (p.style === 'Heading2') return <h3 tabIndex={-1} key={p.id} id={p.id}>{p.text}</h3>;
          if (p.style.startsWith('TOC')) return <p key={p.id} id={p.id} className={`book-toc-entry ${p.style === 'TOCChapter' ? 'book-toc-chapter' : 'book-toc-section'}`}><a href={`#${p.links[0].target}`}>{p.text}</a></p>;
          return <p key={p.id} id={p.id} className={p.style === 'ChapterLabel' ? 'reader-chapter-label' : p.style === 'Title' ? 'reader-title' : undefined}>{p.text}</p>;
        })}
        <p className="digital-page-number">Page {index + 1} of {pages.length}</p>
      </section>)}
    </article>
    <div id="reader-end" tabIndex={-1} className="book-preview-end" hidden={mode === 'pages' && active !== pages.length}>
      <h2>End of Free Preview</h2><p>You’ve reached the end of the free preview.</p>
      <a href="/books/hfos-phase-1-stability">Explore the Full Edition</a><p>Full Edition access coming soon.</p>
      <h3>Was this preview useful?</h3><p>Share feedback — it helps us improve the reading experience.</p>
      <div className="reader-end-actions"><FeedbackForm end /><BookShare end /></div>
    </div>
    {mode === 'pages' && <nav className="reader-page-nav" aria-label="Read adjacent pages">
      <button type="button" disabled={active === 0} onClick={() => go(active - 1)}>← Previous</button>
      <span role="status">{active < pages.length ? `Page ${active + 1} of ${pages.length}` : 'Preview complete'}</span>
      <button type="button" disabled={active === pages.length} onClick={() => go(active + 1)}>{active === pages.length - 1 ? 'Finish →' : 'Next →'}</button>
    </nav>}
    <p className="reader-help">Digital preview pages · <a href="/books/hfos-phase-1-stability">Back to the book</a></p>
  </div>;
}
