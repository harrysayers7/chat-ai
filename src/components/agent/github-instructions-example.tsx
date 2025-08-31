"use client";

import { useState } from "react";
import { Button } from "ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "ui/card";
import { Alert, AlertDescription } from "ui/alert";
import { Github, BookOpen, Zap, RefreshCw } from "lucide-react";

/**
 * Example component showing how to integrate GitHub instructions
 * This is a simplified version for demonstration purposes
 */
export function GitHubInstructionsExample() {
  const [instructions, setInstructions] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const fetchInstructions = async () => {
    setIsLoading(true);
    try {
      // Example: Fetch instructions from your chat-gpt-brain repo
      const response = await fetch(
        "/api/github-instructions?owner=harrysayers&repo=chat-gpt-brain",
      );
      if (response.ok) {
        const data = await response.json();
        setInstructions(data.instructions);
      }
    } catch (error) {
      console.error("Failed to fetch instructions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Github className="h-5 w-5" />
            GitHub Instructions Integration
          </CardTitle>
          <CardDescription>
            Automatically pull AI instructions from your GitHub repositories
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="text-center p-4 bg-muted rounded-lg">
              <BookOpen className="h-8 w-8 mx-auto mb-2 text-blue-500" />
              <h4 className="font-semibold">Repository Instructions</h4>
              <p className="text-muted-foreground">
                Store your AI instructions in GitHub
              </p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <Zap className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <h4 className="font-semibold">Auto-Sync</h4>
              <p className="text-muted-foreground">
                Always up-to-date instructions
              </p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <RefreshCw className="h-8 w-8 mx-auto mb-2 text-purple-500" />
              <h4 className="font-semibold">Version Control</h4>
              <p className="text-muted-foreground">Track changes with Git</p>
            </div>
          </div>

          <Button
            onClick={fetchInstructions}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? "Fetching..." : "Try GitHub Instructions"}
          </Button>

          {instructions && (
            <Alert>
              <BookOpen className="h-4 w-4" />
              <AlertDescription>
                <strong>Instructions fetched successfully!</strong>
                <br />
                <span className="text-xs text-muted-foreground">
                  Preview: {instructions.substring(0, 100)}...
                </span>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-semibold">1. Repository Setup</h4>
            <p className="text-sm text-muted-foreground">
              Create instruction files in your GitHub repo (README.md,
              INSTRUCTIONS.md, BRAIN.md, etc.)
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold">2. Fetch Instructions</h4>
            <p className="text-sm text-muted-foreground">
              Use the API to automatically fetch the latest instructions from
              your repo
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold">3. Create AI Agent</h4>
            <p className="text-sm text-muted-foreground">
              Use the fetched instructions to create an AI agent with your
              custom knowledge
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold">4. Auto-Update</h4>
            <p className="text-sm text-muted-foreground">
              When you update your repo, refresh the agent to get the latest
              instructions
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Repository Structure Example</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-xs bg-muted p-4 rounded-lg overflow-x-auto">
            {`chat-gpt-brain/
├── README.md              # Main instructions
├── INSTRUCTIONS.md        # Behavioral guidelines  
├── BRAIN.md              # Core knowledge
├── SYSTEM_PROMPT.md      # System instructions
├── GUIDELINES.md         # Usage examples
└── EXAMPLES/             # Example conversations
    ├── coding.md
    ├── writing.md
    └── analysis.md`}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
