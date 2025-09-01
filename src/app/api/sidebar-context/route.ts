import { NextRequest, NextResponse } from "next/server";
import { getSession } from "auth/server";

export async function GET(_request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get sidebar items from localStorage via client-side
    // This endpoint is mainly for future server-side storage if needed
    // For now, the context is generated client-side

    return NextResponse.json({
      message: "Sidebar context endpoint ready",
      note: "Context is currently generated client-side",
    });
  } catch (error) {
    console.error("Sidebar context error:", error);
    return NextResponse.json(
      { error: "Failed to get sidebar context" },
      { status: 500 },
    );
  }
}
