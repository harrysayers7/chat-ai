import { NextRequest, NextResponse } from "next/server";
import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    // Use the cheapest model for simple summaries
    const { text: summary } = await generateText({
      model: openai("gpt-3.5-turbo"),
      messages: [
        {
          role: "system",
          content:
            "Summarize the following text in exactly 3-5 words. Be concise and descriptive. Only return the summary, nothing else.",
        },
        {
          role: "user",
          content: text,
        },
      ],
      maxTokens: 10, // Very low token limit to keep costs minimal
      temperature: 0.3,
    });

    if (!summary) {
      return NextResponse.json(
        { error: "Failed to generate summary" },
        { status: 500 },
      );
    }

    return NextResponse.json({ summary: summary.trim() });
  } catch (error) {
    console.error("Error generating summary:", error);
    return NextResponse.json(
      { error: "Failed to generate summary" },
      { status: 500 },
    );
  }
}
