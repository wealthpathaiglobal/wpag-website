import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/authorization";
import { AuthenticationError, AuthorizationError } from "@/lib/auth/errors";
import { adminResearchControlsService, ResearchControlsServiceError } from "@/lib/services/admin/admin-research-controls-service";

type Context = { params: Promise<{ participantId: string }> };

export async function GET(_request: NextRequest, context: Context) {
  try {
    const staff = await requireRole("administrator");
    const { participantId } = await context.params;
    const status = await adminResearchControlsService.getStatus(participantId, staff.auth_user_id);
    return NextResponse.json({ success: true, status }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    if (error instanceof AuthenticationError) return NextResponse.json({ success: false, error: "Authentication is required." }, { status: 401 });
    if (error instanceof AuthorizationError) return NextResponse.json({ success: false, error: "Administrator access is required." }, { status: 403 });
    if (error instanceof ResearchControlsServiceError) return NextResponse.json({ success: false, error: error.message }, { status: error.kind === "invalid" ? 400 : error.kind === "unauthorized" ? 403 : 500 });
    console.error("Research controls status could not be loaded.");
    return NextResponse.json({ success: false, error: "Research controls status could not be loaded." }, { status: 500 });
  }
}
