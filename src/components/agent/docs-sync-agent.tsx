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
  BookOpen,
  Download,
  CheckCircle,
  AlertCircle,
  Settings,
  Activity,
} from "lucide-react";

import { Agent } from "@/types/agent";

interface DocsSyncAgentProps {
  onAgentCreate: (agent: Partial<Agent>) => void;
  userId: string;
}

export function DocsSyncAgent({ onAgentCreate, userId }: DocsSyncAgentProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form state
  const [baseUrl, setBaseUrl] = useState("https://1d4683e0c425.ngrok-free.app");
  const [agentName, setAgentName] = useState("");
  const [agentDescription, setAgentDescription] = useState("");
  const [agentRole, setAgentRole] = useState("");

  // Options
  const [customGPTMode, setCustomGPTMode] = useState(false);
  const [includeMetadata, setIncludeMetadata] = useState(false);

  // Fetched content
  const [prompts, setPrompts] = useState<string>("");
  const [metadata, setMetadata] = useState<any>(null);
  const [healthStatus, setHealthStatus] = useState<any>(null);

  const checkHealth = async () => {
    try {
      const response = await fetch(
        `/api/docs-sync?baseUrl=${encodeURIComponent(baseUrl)}&action=health`,
      );
      if (response.ok) {
        const health = await response.json();
        setHealthStatus(health.result);
        return health.result.ok;
      }
      return false;
    } catch (error) {
      console.error("Health check failed:", error);
      return false;
    }
  };

  const fetchPrompts = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // First check health
      const isHealthy = await checkHealth();
      if (!isHealthy) {
        throw new Error(
          "Docs Sync API is not healthy. Please check the service status.",
        );
      }

      const params = new URLSearchParams({
        baseUrl: baseUrl,
        "custom-gpt": customGPTMode.toString(),
        metadata: includeMetadata.toString(),
        action: "prompts",
      });

      const response = await fetch(`/api/docs-sync?${params}`);

      if (response.status === 304) {
        // Not modified - use cached data
        setError("No changes detected - using cached data");
        return;
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch prompts: ${response.statusText}`);
      }

      const data = await response.json();
      setPrompts(data.result);
      setMetadata(data.metadata || null);
      setSuccess(true);

      // Auto-fill agent details if not set
      if (!agentName) {
        setAgentName("chat-gpt-brain-agent");
      }
      if (!agentDescription) {
        const mode = customGPTMode ? "custom GPT " : "";
        setAgentDescription(`AI agent with ${mode}prompts from Docs Sync API`);
      }
      if (!agentRole) {
        setAgentRole(
          `Expert in chat-gpt-brain domain with live documentation access`,
        );
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch prompts");
      setPrompts("");
      setMetadata(null);
    } finally {
      setIsLoading(false);
    }
  };

  const createAgent = () => {
    if (!prompts.trim()) {
      setError("Please fetch prompts first");
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
        systemPrompt: prompts,
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
          <BookOpen className="h-5 w-5" />
          Docs Sync Agent
        </CardTitle>
        <CardDescription>
          Create an AI agent with live prompts from your Docs Sync API
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* API Configuration */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="baseUrl">Docs Sync API Base URL</Label>
            <Input
              id="baseUrl"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="https://your-docs-sync-api.com"
            />
            <p className="text-xs text-muted-foreground mt-1">
              The base URL of your Docs Sync API (e.g., ngrok tunnel or
              production URL)
            </p>
          </div>
        </div>

        {/* Health Status */}
        {healthStatus && (
          <div
            className={`p-3 rounded-lg border ${
              healthStatus.ok
                ? "bg-green-50 border-green-200"
                : "bg-red-50 border-red-200"
            }`}
          >
            <div className="flex items-center gap-2">
              <Activity
                className={`h-4 w-4 ${healthStatus.ok ? "text-green-600" : "text-red-600"}`}
              />
              <span className="font-medium">
                {healthStatus.ok ? "API Healthy" : "API Unhealthy"}
              </span>
            </div>
            {healthStatus.github_api && (
              <p className="text-sm text-muted-foreground mt-1">
                GitHub API: {healthStatus.github_api} | Cache:{" "}
                {healthStatus.cache || "unknown"}
              </p>
            )}
          </div>
        )}

        {/* Advanced Options */}
        <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-base font-medium">Advanced Options</Label>
              <p className="text-sm text-muted-foreground">
                Configure how prompts are fetched and processed
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
              <Label htmlFor="include-metadata">Include Metadata</Label>
            </div>
          </div>

          <div className="text-sm text-muted-foreground space-y-1">
            <p>
              <strong>Custom GPT Mode:</strong> Optimized for custom GPT usage
              patterns, fetches from priority docs.
            </p>
            <p>
              <strong>Metadata:</strong> Includes available files, cache stats,
              and API information.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center">
          <Button onClick={checkHealth} variant="outline" disabled={isLoading}>
            <Activity className="mr-2 h-4 w-4" />
            Check Health
          </Button>

          <Button
            onClick={fetchPrompts}
            disabled={isLoading || !baseUrl}
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
                Fetch {customGPTMode ? "Custom GPT " : ""}Prompts
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
              from Docs Sync API
            </AlertDescription>
          </Alert>
        )}

        {/* Metadata Display */}
        {metadata && (
          <div className="space-y-2">
            <Label>API Information</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
              <div className="p-2 bg-muted rounded">
                <div className="font-medium">Total Files</div>
                <div className="text-muted-foreground">
                  {metadata.totalFiles}
                </div>
              </div>
              <div className="p-2 bg-muted rounded">
                <div className="font-medium">Branch</div>
                <div className="text-muted-foreground">{metadata.branch}</div>
              </div>
              <div className="p-2 bg-muted rounded">
                <div className="font-medium">Prefix</div>
                <div className="text-muted-foreground">{metadata.prefix}</div>
              </div>
              <div className="p-2 bg-muted rounded">
                <div className="font-medium">Cache Keys</div>
                <div className="text-muted-foreground">
                  {metadata.cacheStats?.size || 0}
                </div>
              </div>
            </div>
            {metadata.availableFiles && metadata.availableFiles.length > 0 && (
              <div className="p-2 bg-muted rounded">
                <div className="font-medium">Available Files</div>
                <div className="text-muted-foreground text-xs">
                  {metadata.availableFiles.slice(0, 8).join(", ")}
                  {metadata.availableFiles.length > 8 &&
                    ` ... and ${metadata.availableFiles.length - 8} more`}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Prompts Preview */}
        {prompts && (
          <div>
            <Label>Prompts Preview</Label>
            <div className="mt-2 p-4 bg-muted rounded-md max-h-64 overflow-y-auto">
              <pre className="whitespace-pre-wrap text-sm">{prompts}</pre>
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              {prompts.length} characters fetched •{" "}
              {customGPTMode ? "Custom GPT mode" : "Standard mode"}
            </div>
          </div>
        )}

        {/* Agent Configuration */}
        {prompts && (
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
                placeholder="AI agent with live prompts from your Docs Sync API"
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
                Create {customGPTMode ? "Custom GPT " : ""}Agent with Docs Sync
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
