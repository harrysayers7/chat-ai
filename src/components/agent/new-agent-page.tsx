"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "ui/card";
import { Button } from "ui/button";

import {
  BookOpen,
  Wand2,
  FileText,
  Plus,
  ArrowLeft,
  Brain,
  Zap,
} from "lucide-react";
import EditAgent from "./edit-agent";
import { DocsSyncAgent } from "./docs-sync-agent";
import { GenerateAgentDialog } from "./generate-agent-dialog";
import { Agent } from "@/types/agent";

interface NewAgentPageProps {
  userId: string;
}

export function NewAgentPage({ userId }: NewAgentPageProps) {
  const router = useRouter();
  const [showEditAgent, setShowEditAgent] = useState(false);
  const [showDocsSync, setShowDocsSync] = useState(false);
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);

  const handleAgentCreate = (_agent: Partial<Agent>) => {
    // For now, just show the edit form for creating a new agent
    // The sync agents can implement their own creation logic if needed
    setShowEditAgent(true);
  };

  const handleBackToOptions = () => {
    setShowEditAgent(false);
    setShowDocsSync(false);
  };

  const handleBackToMain = () => {
    router.push("/agents");
  };

  // If we're editing an agent, show the edit form
  if (showEditAgent) {
    return (
      <div className="container mx-auto py-6 max-w-4xl">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={handleBackToOptions}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Creation Options
          </Button>
        </div>
        <EditAgent
          initialAgent={undefined}
          userId={userId}
          isOwner={true}
          hasEditAccess={true}
        />
      </div>
    );
  }

  // If we're using Docs Sync, show that component
  if (showDocsSync) {
    return (
      <div className="container mx-auto py-6 max-w-4xl">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={handleBackToOptions}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Creation Options
          </Button>
        </div>
        <DocsSyncAgent onAgentCreate={handleAgentCreate} userId={userId} />
      </div>
    );
  }

  // Main options view
  return (
    <div className="container mx-auto py-6 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <Button variant="ghost" onClick={handleBackToMain} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Agents
        </Button>
        <h1 className="text-3xl font-bold">Create New Agent</h1>
        <p className="text-muted-foreground mt-2">
          Choose how you&apos;d like to create your AI agent
        </p>
      </div>

      {/* Creation Options */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Manual Creation */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <CardTitle>Manual Creation</CardTitle>
                <CardDescription>Build your agent step by step</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Create an agent from scratch with full control over instructions,
              tools, and configuration.
            </p>
            <Button onClick={() => setShowEditAgent(true)} className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              Start Manual Creation
            </Button>
          </CardContent>
        </Card>

        {/* Docs Sync Integration */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <BookOpen className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <CardTitle>Docs Sync Integration</CardTitle>
                <CardDescription>Use live documentation</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Create an agent with live prompts from your Docs Sync API. Perfect
              for custom GPTs and live documentation.
            </p>
            <Button
              onClick={() => setShowDocsSync(true)}
              className="w-full"
              variant="outline"
            >
              <Brain className="mr-2 h-4 w-4" />
              Use Docs Sync
            </Button>
          </CardContent>
        </Card>

        {/* AI Generation */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Wand2 className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <CardTitle>AI Generation</CardTitle>
                <CardDescription>Let AI create your agent</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Describe what you want and let AI generate the agent
              configuration, instructions, and tools.
            </p>
            <Button
              onClick={() => setShowGenerateDialog(true)}
              className="w-full"
              variant="outline"
            >
              <Zap className="mr-2 h-4 w-4" />
              Generate with AI
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Quick Start Guide */}
      <div className="mt-12">
        <h2 className="text-xl font-semibold mb-4">Quick Start Guide</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="p-4 bg-muted/50 rounded-lg">
            <h3 className="font-medium mb-2">1. Choose Your Method</h3>
            <p className="text-sm text-muted-foreground">
              Pick the creation method that best fits your needs and experience
              level.
            </p>
          </div>
          <div className="p-4 bg-muted/50 rounded-lg">
            <h3 className="font-medium mb-2">2. Configure Your Agent</h3>
            <p className="text-sm text-muted-foreground">
              Set up the agent&apos;s name, description, instructions, and
              tools.
            </p>
          </div>
          <div className="p-4 bg-muted/50 rounded-lg">
            <h3 className="font-medium mb-2">3. Test & Deploy</h3>
            <p className="text-sm text-muted-foreground">
              Test your agent in chat and make it available for use.
            </p>
          </div>
        </div>
      </div>

      {/* Generate Agent Dialog */}
      <GenerateAgentDialog
        open={showGenerateDialog}
        onOpenChange={setShowGenerateDialog}
        onAgentChange={handleAgentCreate}
      />
    </div>
  );
}
