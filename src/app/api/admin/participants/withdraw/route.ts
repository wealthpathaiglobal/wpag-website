import { NextRequest } from "next/server";

import { executeParticipantLifecycleAction } from "@/lib/api/admin/participant-lifecycle";

export async function POST(request: NextRequest) {
  return executeParticipantLifecycleAction({
    request,
    action: "withdraw",
  });
}