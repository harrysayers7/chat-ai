import { NextRequest, NextResponse } from "next/server";
import { getSession } from "auth/server";
import { generateText } from "ai";
import { customModelProvider } from "lib/ai/models";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { text, context } = await request.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    // Analyze the text to determine what type of explanation is needed
    const textAnalysis = analyzeText(text);

    // Generate appropriate prompt based on content type
    const prompt = generateExplanationPrompt(text, textAnalysis, context);

    // Use the actual AI model to generate explanation
    const model = customModelProvider.getModel({
      provider: "anthropic",
      model: "claude-3-7-sonnet",
    }); // Use Claude
    const explanation = await generateText({
      model,
      prompt,
    });

    return NextResponse.json({ explanation: explanation.text });
  } catch (error) {
    console.error("AI explanation error:", error);
    return NextResponse.json(
      {
        error: `Failed to generate explanation: ${error instanceof Error ? error.message : String(error)}`,
      },
      { status: 500 },
    );
  }
}

function analyzeText(text: string) {
  const trimmed = text.trim();

  // Check for code patterns
  const hasCode =
    /```[\s\S]*```|`[^`]+`|function|const|let|var|class|import|export/.test(
      trimmed,
    );

  // Check for technical terms
  const hasTechnicalTerms =
    /algorithm|function|method|class|interface|type|variable|parameter|return|async|await|promise|callback/.test(
      trimmed.toLowerCase(),
    );

  // Check for mathematical expressions
  const hasMath = /[=+\-*/^()\[\]{}]|sqrt|log|sin|cos|tan|pi|e/.test(trimmed);

  // Check for URLs or links
  const hasLinks = /https?:\/\/|www\.|\.com|\.org|\.net/.test(trimmed);

  // Check for file paths
  const hasFilePaths =
    /\/[^\/]+\.(js|ts|jsx|tsx|py|java|cpp|html|css|json|md|txt)/.test(trimmed);

  if (hasCode || hasTechnicalTerms) {
    return { type: "code", complexity: hasCode ? "high" : "medium" };
  }

  if (hasMath) {
    return { type: "mathematical", complexity: "medium" };
  }

  if (hasLinks || hasFilePaths) {
    return { type: "reference", complexity: "low" };
  }

  return { type: "text", complexity: "low" };
}

function generateExplanationPrompt(
  text: string,
  analysis: any,
  context?: string,
) {
  const { type, complexity } = analysis;

  let prompt = `Please provide a clear, concise explanation of the following text: "${text}"\n\n`;

  if (context) {
    prompt += `Context: ${context}\n\n`;
  }

  switch (type) {
    case "code":
      prompt += `This appears to be code or technical content. Please explain:
- What this code does
- Key concepts involved
- Any important patterns or best practices
- Potential use cases`;
      break;

    case "mathematical":
      prompt += `This appears to be mathematical content. Please explain:
- The mathematical concept or formula
- What each part represents
- Practical applications
- Related concepts`;
      break;

    case "reference":
      prompt += `This appears to be a reference or link. Please explain:
- What this reference is about
- Why it might be relevant
- Key information it provides`;
      break;

    default:
      prompt += `Please provide a clear explanation that:
- Summarizes the main points
- Clarifies any complex concepts
- Provides context if needed`;
  }

  prompt += `\n\nKeep the explanation concise but comprehensive. Use simple language when possible.`;

  return prompt;
}
