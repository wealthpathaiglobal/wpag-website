"use client";
import { useId, useRef, useState, type ReactNode, type KeyboardEvent } from 'react';
export const PRODUCT_URL = 'https://www.wealthpathaiglobal.com/books/hfos-phase-1-stability';
export const PREVIEW_URL = `${PRODUCT_URL}/preview`;
export const SHARE_TEXT = 'HFOS — Phase 1: Stability — A Structural System for Financial Stability. Read the free preview from Wealth Path AI Global.';
export const FEEDBACK_EMAIL = 'contact@wealthpathaiglobal.com';
export const FEEDBACK_NOTE = 'Please do not include personal financial information. Feedback is voluntary and is not part of HFOS research or financial assessment.';
export function feedbackMailto(data: { clarity: string; useful: string; improve: string; experience: string; interest: string }) {
  const body = ['Voluntary product / reading experience feedback', '', `Preview clarity (1–5): ${data.clarity || 'Not answered'}`, `Most useful: ${data.useful}`, `Unclear / could be improved: ${data.improve}`, `Reading experience: ${data.experience || 'Not answered'}`, `Full Edition interest: ${data.interest || 'Not answered'}`, '', 'This feedback is not research participation or financial assessment. No marketing subscription requested.'].join('\n');
  return `mailto:${FEEDBACK_EMAIL}?subject=${encodeURIComponent('HFOS Phase 1 — Product feedback')}&body=${encodeURIComponent(body)}`;
}
function Dialog({ label, title, children, beforeOpen }: { label: string; title: string; children: ReactNode; beforeOpen?: () => Promise<boolean> }) {
  const dialog = useRef<HTMLDialogElement>(null), opener = useRef<HTMLButtonElement>(null), titleId = useId();
  function close() { dialog.current?.close(); opener.current?.focus({ preventScroll: true }); }
  function trap(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.key !== 'Tab') return;
    const items = event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled),a[href],input,select,textarea');
    if (event.shiftKey && document.activeElement === items[0]) { event.preventDefault(); items[items.length - 1].focus(); }
    else if (!event.shiftKey && document.activeElement === items[items.length - 1]) { event.preventDefault(); items[0].focus(); }
  }
  return <><button ref={opener} type="button" aria-haspopup="dialog" onClick={async () => { dialog.current?.showModal(); if (beforeOpen) await beforeOpen(); }}>{label}</button>
    <dialog ref={dialog} className="reader-dialog" aria-labelledby={titleId} onKeyDown={trap} onCancel={e => { e.preventDefault(); close(); }} onClick={e => { if (e.target === e.currentTarget) close(); }}>
      <div className="reader-dialog-top"><h2 id={titleId}>{title}</h2><button type="button" autoFocus onClick={close}>Close</button></div>{children}
    </dialog></>;
}
export function FeedbackForm({ end = false }: { end?: boolean }) {
  const [data, setData] = useState({ clarity: '', useful: '', improve: '', experience: '', interest: '' });
  return <Dialog label={end ? 'Give feedback' : 'Feedback'} title="Reading feedback">
    <p>{FEEDBACK_NOTE}</p>
    <div className="reader-feedback">
      <label>How clear was this preview?<select value={data.clarity} onChange={e => setData({ ...data, clarity: e.target.value })}><option value="">Choose (optional)</option>{[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}{n === 1 ? ' — Not clear' : n === 5 ? ' — Very clear' : ''}</option>)}</select></label>
      <label>What was most useful? <span>(optional)</span><textarea maxLength={500} rows={3} value={data.useful} onChange={e => setData({ ...data, useful: e.target.value })} /></label>
      <label>What was unclear or could be improved? <span>(optional)</span><textarea maxLength={500} rows={3} value={data.improve} onChange={e => setData({ ...data, improve: e.target.value })} /></label>
      <label>How was the reading experience?<select value={data.experience} onChange={e => setData({ ...data, experience: e.target.value })}><option value="">Choose (optional)</option>{['Excellent', 'Good', 'Okay', 'Difficult'].map(v => <option key={v}>{v}</option>)}</select></label>
      <label>Would you like to read the Full Edition?<select value={data.interest} onChange={e => setData({ ...data, interest: e.target.value })}><option value="">Choose (optional)</option>{['Yes', 'Maybe', 'No'].map(v => <option key={v}>{v}</option>)}</select></label>
      <p>Open a draft in your email app, review it, then send it to {FEEDBACK_EMAIL}. Nothing is submitted on this page. Your email address is shared only if you send the email. No marketing subscription.</p>
      <a className="reader-email-action" href={feedbackMailto(data)}>Open email draft</a>
      <p>No email app configured? Email your comments directly to <a href={`mailto:${FEEDBACK_EMAIL}`}>{FEEDBACK_EMAIL}</a>. Your answers stay here while this page is open; they are not saved.</p>
    </div>
  </Dialog>;
}
// Return true when the accessible link menu should be shown.
export async function sharePreview(url: string): Promise<boolean> {
  if (typeof navigator.share !== 'function') return true;
  try { await navigator.share({ title: 'HFOS — Phase 1: Stability', text: SHARE_TEXT, url }); return false; }
  catch (error) { return !(error instanceof DOMException && error.name === 'AbortError'); }
}
export function BookShare({ end = false, product = false }: { end?: boolean; product?: boolean }) {
  const [status, setStatus] = useState('');
  const url = product ? PRODUCT_URL : PREVIEW_URL;
  return <Dialog label={end ? 'Share this preview' : 'Share'} title={product ? 'Share this book' : 'Share this preview'} beforeOpen={async () => {
    setStatus('');
    return sharePreview(url);
  }}>
    <p>{SHARE_TEXT}</p>
    <div className="reader-share-links">
      <button type="button" onClick={async () => { try { await navigator.clipboard.writeText(url); setStatus('Link copied.'); } catch { setStatus('Copy unavailable. Select and copy the link below.'); } }}>Copy Link</button>
      <label>Public link<input readOnly value={url} onFocus={e => e.currentTarget.select()} /></label>
      <a href={`https://wa.me/?text=${encodeURIComponent(`${SHARE_TEXT} ${url}`)}`} target="_blank" rel="noopener noreferrer">WhatsApp</a>
      <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`} target="_blank" rel="noopener noreferrer">LinkedIn</a>
      <p role="status">{status}</p>
    </div>
  </Dialog>;
}
