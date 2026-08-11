"use client";

import { useState } from "react";
import { researchHistoryFamilies, type ResearchHistoryFamily, type ResearchHistoryPage } from "@/lib/types/research/research-wave4";

function label(value: string) { return value.toLowerCase().split("_").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" "); }

export default function BoundedResearchHistory({ participantId }: { participantId: string }) {
  const [family,setFamily]=useState<ResearchHistoryFamily>("AUDIT");
  const [items,setItems]=useState<Array<Record<string,unknown>>>([]);
  const [cursor,setCursor]=useState<{at:string;id:string}|null>(null);
  const [hasMore,setHasMore]=useState(true);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState<string|null>(null);
  async function load(reset=false){setBusy(true);setError(null);const current=reset?null:cursor;const params=new URLSearchParams({historyFamily:family,limit:"25"});if(current){params.set("cursorAt",current.at);params.set("cursorId",current.id);}const response=await fetch(`/api/admin/participants/${participantId}/research-wave4?${params}`,{cache:"no-store"});const body=await response.json();if(!response.ok||!body.page){setError(body.error??"Research history could not be loaded.");setBusy(false);return;}const page=body.page as ResearchHistoryPage;setItems((old)=>reset?page.items:[...old,...page.items]);setCursor(page.nextCursorAt&&page.nextCursorId?{at:page.nextCursorAt,id:page.nextCursorId}:null);setHasMore(page.hasMore);setBusy(false);}
  function changeFamily(value:ResearchHistoryFamily){setFamily(value);setItems([]);setCursor(null);setHasMore(true);setError(null);}
  return <section className="mt-6 border-t border-white/10 pt-5" aria-label="Bounded research history"><div className="flex flex-wrap items-end gap-3"><label className="text-xs text-white/60">History family<select value={family} onChange={(event)=>changeFamily(event.target.value as ResearchHistoryFamily)} className="ml-3 rounded border border-white/20 bg-black px-3 py-2 text-white">{researchHistoryFamilies.map((value)=><option key={value} value={value}>{label(value)}</option>)}</select></label><button disabled={busy} onClick={()=>load(true)} className="rounded border border-white/20 px-4 py-2 text-xs disabled:opacity-40">Load latest 25</button></div>{items.length?<ol className="mt-4 space-y-2">{items.map((item,index)=><li key={String(item.history_id??index)} className="rounded border border-white/10 p-3 text-xs text-white/65"><span className="font-medium text-white/80">{label(String(item.history_type??family))}</span>{item.occurred_at?<span> · {String(item.occurred_at)}</span>:null}</li>)}</ol>:null}{items.length&&hasMore?<button disabled={busy} onClick={()=>load(false)} className="mt-4 rounded border border-white/20 px-4 py-2 text-xs disabled:opacity-40">Load next 25</button>:null}{items.length&&!hasMore?<p className="mt-3 text-xs text-white/40">End of governed history.</p>:null}{error?<p role="alert" className="mt-3 text-xs text-rose-300">{error}</p>:null}<p className="mt-3 text-xs text-white/35">Pages use deterministic timestamp/identity cursors. Older authoritative history remains available and unchanged.</p></section>;
}
