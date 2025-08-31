import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const json = await request.json();

    // Simple test response to verify the endpoint is working
    return NextResponse.json({
      success: true,
      message: "Test chat endpoint working!",
      receivedData: json,
      timestamp: new Date().toISOString(),
      models: [
        { name: "gpt-5", provider: "openai" },
        { name: "gpt-5-mini", provider: "openai" },
        { name: "gpt-5-nano", provider: "openai" },
        { name: "claude-4-sonnet", provider: "anthropic" },
      ],
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to process request", details: error },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: "Test chat endpoint is accessible",
    timestamp: new Date().toISOString(),
  });
}
