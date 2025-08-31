import { getSession } from "auth/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "No session found" }, { status: 401 });
    }

    return NextResponse.json({
      user: session.user,
      expires:
        "expires" in session ? session.expires : session.session?.expiresAt,
    });
  } catch (error) {
    console.error("Error getting session:", error);
    return NextResponse.json(
      { error: "Failed to get session" },
      { status: 500 },
    );
  }
}
