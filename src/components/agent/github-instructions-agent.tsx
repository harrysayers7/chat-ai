"use client";

import { useState } from "react";
import { Button } from "ui/button";
import { Input } from "ui/input";
import { Label } from "ui/label";
import { Textarea } from "ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "ui/card";
import { Alert, AlertDescription } from "ui/alert";
import { Switch } from "ui/switch";
import {
  Loader2,
  Github,
  Download,
  CheckCircle,
  AlertCircle,
  Settings,
} from "lucide-react";

import { Agent } from "@/types/agent";

interface GitHubInstructionsAgentProps {
  onAgentCreate: (agent: Partial<Agent>) => void;
  userId: string;
}

export function GitHubInstructionsAgent({
  onAgentCreate,
  userId,
}: GitHubInstructionsAgentProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form state
  const [owner, setOwner] = useState("harrysayers"); // Default to your username
  const [repo, setRepo] = useState("chat-gpt-brain");
  const [branch, setBranch] = useState("main");
  const [agentName, setAgentName] = useState("");
  const [agentDescription, setAgentDescription] = useState("");
  const [agentRole, setAgentRole] = useState("");

  // New options
  const [customGPTMode, setCustomGPTMode] = useState(false);
  const [includeMetadata, setIncludeMetadata] = useState(false);

  // Fetched instructions
  const [instructions, setInstructions] = useState<string>("");

  const [metadata, setMetadata] = useState<any>(null);

  const fetchInstructions = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const params = new URLSearchParams({
        owner,
        repo,
        branch,
        "custom-gpt": customGPTMode.toString(),
        metadata: includeMetadata.toString(),
      });

      const response = await fetch(`/api/github-instructions?${params}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch instructions: ${response.statusText}`);
      }

      const data = await response.json();
      setInstructions(data.instructions);
      setMetadata(data.metadata || null);
      setSuccess(true);

      // Auto-fill agent details if not set
      if (!agentName) {
        setAgentName(`${repo}-agent`);
      }
      if (!agentDescription) {
        const mode = customGPTMode ? "custom GPT " : "";
        setAgentDescription(
          `AI agent with ${mode}prompts and documentation from ${owner}/${repo}`,
        );
      }
      if (!agentRole) {
        setAgentRole(`Expert in ${repo} domain with custom GPT knowledge`);
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch instructions");
      setInstructions("");
      setMetadata(null);
    } finally {
      setIsLoading(false);
    }
  };

  const createAgent = () => {
    if (!instructions.trim()) {
      setError("Please fetch instructions first");
      return;
    }

    if (!agentName.trim()) {
      setError("Please provide an agent name");
      return;
    }

    const agent: Partial<Agent> = {
      name: agentName,
      description: agentDescription,
      icon: {
        type: "emoji",
        value: customGPTMode ? "🧠" : "📚",
        style: {
          backgroundColor: customGPTMode ? "#3b82f6" : "#10b981",
        },
      },
      instructions: {
        role: agentRole,
        systemPrompt: instructions,
        mentions: [],
      },
      visibility: "private",
      userId,
    };

    onAgentCreate(agent);
  };

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Github className="h-5 w-5" />
          GitHub Instructions Agent
        </CardTitle>
        <CardDescription>
          Create an AI agent with prompts and documentation from your GitHub
          repository
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Repository Configuration */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="owner">GitHub Username</Label>
            <Input
              id="owner"
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              placeholder="harrysayers"
            />
          </div>
          <div>
            <Label htmlFor="repo">Repository Name</Label>
            <Input
              id="repo"
              value={repo}
              onChange={(e) => setRepo(e.target.value)}
              placeholder="chat-gpt-brain"
            />
          </div>
          <div>
            <Label htmlFor="branch">Branch</Label>
            <Input
              id="branch"
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              placeholder="main"
            />
          </div>
        </div>

        {/* Advanced Options */}
        <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-base font-medium">Advanced Options</Label>
              <p className="text-sm text-muted-foreground">
                Configure how prompts and documentation are fetched
              </p>
            </div>
            <Settings className="h-5 w-5 text-muted-foreground" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="custom-gpt-mode"
                checked={customGPTMode}
                onCheckedChange={setCustomGPTMode}
              />
              <Label htmlFor="custom-gpt-mode">Custom GPT Mode</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="include-metadata"
                checked={includeMetadata}
                onCheckedChange={setIncludeMetadata}
              />
              <Label htmlFor="include-metadata">
                Include Repository Metadata
              </Label>
            </div>
          </div>

          <div className="text-sm text-muted-foreground space-y-1">
            <p>
              <strong>Custom GPT Mode:</strong> Fetches prompts specifically
              from docs/ and dist/ folders, optimized for custom GPT usage
              patterns.
            </p>
            <p>
              <strong>Metadata:</strong> Includes repository information like
              topics, description, and available instruction files.
            </p>
          </div>
        </div>

        {/* Fetch Instructions Button */}
        <div className="flex justify-center">
          <Button
            onClick={fetchInstructions}
            disabled={isLoading || !owner || !repo}
            className="min-w-[200px]"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Fetching...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Fetch {customGPTMode ? "Custom GPT " : ""}Prompts &
                Documentation
              </>
            )}
          </Button>
        </div>

        {/* Status Messages */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Successfully fetched {customGPTMode ? "custom GPT " : ""}prompts
              and documentation
            </AlertDescription>
          </Alert>
        )}

        {/* Repository Metadata */}
        {metadata && (
          <div className="space-y-2">
            <Label>Repository Information</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
              <div className="p-2 bg-muted rounded">
                <div className="font-medium">Topics</div>
                <div className="text-muted-foreground">
                  {metadata.topics.join(", ") || "None"}
                </div>
              </div>
              <div className="p-2 bg-muted rounded">
                <div className="font-medium">Language</div>
                <div className="text-muted-foreground">
                  {metadata.language || "Unknown"}
                </div>
              </div>
              <div className="p-2 bg-muted rounded">
                <div className="font-medium">Size</div>
                <div className="text-muted-foreground">
                  {Math.round(metadata.size / 1024)} KB
                </div>
              </div>
              <div className="p-2 bg-muted rounded">
                <div className="font-medium">Updated</div>
                <div className="text-muted-foreground">
                  {new Date(metadata.updatedAt).toLocaleDateString()}
                </div>
              </div>
            </div>
            {metadata.instructionFiles.length > 0 && (
              <div className="p-2 bg-muted rounded">
                <div className="font-medium">Available Instruction Files</div>
                <div className="text-muted-foreground text-xs">
                  {metadata.instructionFiles.slice(0, 10).join(", ")}
                  {metadata.instructionFiles.length > 10 &&
                    ` ... and ${metadata.instructionFiles.length - 10} more`}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Instructions Preview */}
        {instructions && (
          <div>
            <Label>Prompts & Documentation Preview</Label>
            <div className="mt-2 p-4 bg-muted rounded-md max-h-64 overflow-y-auto">
              <pre className="whitespace-pre-wrap text-sm">{instructions}</pre>
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              {instructions.length} characters fetched •{" "}
              {customGPTMode ? "Custom GPT mode" : "Standard mode"}
            </div>
          </div>
        )}

        {/* Agent Configuration */}
        {instructions && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Agent Configuration</h3>

            <div>
              <Label htmlFor="agentName">Agent Name</Label>
              <Input
                id="agentName"
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
                placeholder="chat-gpt-brain-agent"
              />
            </div>

            <div>
              <Label htmlFor="agentDescription">Description</Label>
              <Textarea
                id="agentDescription"
                value={agentDescription}
                onChange={(e) => setAgentDescription(e.target.value)}
                placeholder="AI agent with prompts and documentation from your chat-gpt-brain repository"
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="agentRole">Role/Expertise</Label>
              <Input
                id="agentRole"
                value={agentRole}
                onChange={(e) => setAgentRole(e.target.value)}
                placeholder="Expert in AI assistance and knowledge management"
              />
            </div>

            <div className="flex justify-center pt-4">
              <Button
                onClick={createAgent}
                disabled={!agentName.trim()}
                className="min-w-[200px]"
              >
                Create {customGPTMode ? "Custom GPT " : ""}Agent with GitHub
                Prompts
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
