"use client";
import { useEffect, useRef, useState, type MouseEvent, type KeyboardEvent } from "react";
export type ReaderEntry = { id: string; title: string; chapter: boolean };
export function ReaderControls({ entries }: { entries: ReaderEntry[] }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLButtonElement | null>(null);
  const [active, setActive] = useState(-1);
  useEffect(() => {
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (dialog.current?.open) return;
        const cutoff = (document.querySelector('.reader-toolbar')?.getBoundingClientRect().bottom ?? 160) + 90;
        let index = -1;
        entries.forEach((entry, i) => { if ((document.getElementById(entry.id)?.getBoundingClientRect().top ?? Infinity) <= cutoff) index = i; });
        setActive(index);
      });
    };
    addEventListener('scroll', update, { passive: true });
    addEventListener('resize', update);
    update();
    return () => { cancelAnimationFrame(frame); removeEventListener('scroll', update); removeEventListener('resize', update); document.body.style.overflow = ''; };
  }, [entries]);
  function open(button: HTMLButtonElement) { opener.current = button; dialog.current?.showModal(); document.body.style.overflow = 'hidden'; }
  function close() { dialog.current?.close(); document.body.style.overflow = ''; opener.current?.focus({ preventScroll: true }); }
  function go(event: MouseEvent<HTMLAnchorElement>, id: string) {
    event.preventDefault();
    if (dialog.current?.open) close();
    history.pushState(null, "", `#${id}`);
    setActive(entries.findIndex(entry => entry.id === id));
    requestAnimationFrame(() => { const heading = document.getElementById(id); heading?.focus({ preventScroll: true }); heading?.scrollIntoView(); });
  }
  function trap(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.key !== "Tab") return;
    const focusable = dialog.current?.querySelectorAll<HTMLElement>("button, a[href]");
    if (!focusable?.length) return;
    const first = focusable[0], last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }
  return <>
    <div className="reader-toolbar" role="region" aria-label="Reader controls">
      <button type="button" onClick={e => open(e.currentTarget)} aria-haspopup="dialog">Contents</button>
      <span className="reader-context">{active < 0 ? 'Front matter' : entries[active].title}</span>
      <label className="reader-language">Language<select aria-label="Reading language" defaultValue="en"><option value="en">English · Canonical</option><option value="te" disabled>తెలుగు — Coming later</option></select></label>
    </div>
    <dialog ref={dialog} className="reader-dialog" aria-labelledby="reader-contents-title" onKeyDown={trap} onCancel={close} onClose={() => { document.body.style.overflow = ''; }} onClick={e => { if (e.target === e.currentTarget) close(); }}>
      <div className="reader-dialog-top"><h2 id="reader-contents-title">Contents</h2><button type="button" onClick={close} autoFocus>Close</button></div>
      <p>Free preview · English canonical edition</p>
      <nav aria-label="Preview contents"><a href="#reader-front" onClick={e => go(e, 'reader-front')}>Front matter</a>{entries.map((entry, i) => <a className={entry.chapter ? 'reader-chapter-link' : ''} aria-current={active === i ? 'location' : undefined} key={entry.id} href={`#${entry.id}`} onClick={e => go(e, entry.id)}>{entry.title}</a>)}</nav>
      <p>Through §2.4 Delayed Breakdown</p>
    </dialog>
    <nav className="reader-section-nav" aria-label="Read adjacent sections">
      {active >= 0 ? <a href={active === 0 ? '#reader-front' : `#${entries[active - 1].id}`} onClick={e => go(e, active === 0 ? 'reader-front' : entries[active - 1].id)}>← Previous</a> : <span />}
      <button type="button" onClick={e => open(e.currentTarget)} aria-haspopup="dialog">Contents</button>
      <a href={active < entries.length - 1 ? `#${entries[active + 1].id}` : '#reader-end'} onClick={e => go(e, active < entries.length - 1 ? entries[active + 1].id : 'reader-end')}>{active < entries.length - 1 ? 'Next →' : 'Preview end →'}</a>
    </nav>
  </>;
}
