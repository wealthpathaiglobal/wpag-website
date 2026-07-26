import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json();

  const { participantId } = body;

  if (!participantId) {
    return NextResponse.json(
      {
        success: false,
        error: "participantId is required.",
      },
      { status: 400 }
    );
  }

  return NextResponse.json({
    success: true,
    participantId,
  });
}