import { describe,expect,it,vi } from "vitest";
vi.mock("@/lib/supabase/admin",()=>({supabaseAdmin:{rpc:vi.fn()}}));
import { mapResearchHistoryPage } from "./admin-research-wave4-repository";

describe("bounded research history mapping",()=>{
  it("maps a deterministic continuation page",()=>{expect(mapResearchHistoryPage({enrollment_id:"10000000-0000-4000-8000-000000000001",history_family:"AUDIT",items:[{history_id:"20000000-0000-4000-8000-000000000001"}],next_cursor_at:"2026-08-11T12:00:00Z",next_cursor_id:"20000000-0000-4000-8000-000000000001",has_more:true})).toMatchObject({historyFamily:"AUDIT",hasMore:true,nextCursorId:"20000000-0000-4000-8000-000000000001"});});
  it("rejects missing continuation identity and unknown families",()=>{expect(()=>mapResearchHistoryPage({enrollment_id:"x",history_family:"AUDIT",items:[],next_cursor_at:"2026-08-11T12:00:00Z",next_cursor_id:null,has_more:true})).toThrow();expect(()=>mapResearchHistoryPage({enrollment_id:"x",history_family:"OTHER",items:[],next_cursor_at:null,next_cursor_id:null,has_more:false})).toThrow();});
});
