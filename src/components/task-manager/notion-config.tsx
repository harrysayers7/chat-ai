"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, AlertCircle, ExternalLink } from "lucide-react";
import { useTranslations } from "next-intl";

interface NotionDatabase {
  id: string;
  title: string;
  description?: string;
}

export function NotionConfig() {
  const [apiKey, setApiKey] = useState("");
  const [selectedDatabase, setSelectedDatabase] = useState("");
  const [databases, setDatabases] = useState<NotionDatabase[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    "idle" | "testing" | "connected" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");

  // Load saved configuration
  useEffect(() => {
    const savedApiKey = localStorage.getItem("notion_api_key");
    const savedDatabase = localStorage.getItem("notion_database_id");

    if (savedApiKey) {
      setApiKey(savedApiKey);
    }
    if (savedDatabase) {
      setSelectedDatabase(savedDatabase);
    }
  }, []);

  const testConnection = async () => {
    if (!apiKey) {
      setErrorMessage("Please enter your Notion API key");
      return;
    }

    setIsLoading(true);
    setConnectionStatus("testing");
    setErrorMessage("");

    try {
      // Test the connection by trying to list databases
      const response = await fetch("/api/tasks/databases", {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setDatabases(data);
        setConnectionStatus("connected");

        // Save API key to localStorage
        localStorage.setItem("notion_api_key", apiKey);

        // Auto-select first database if none selected
        if (!selectedDatabase && data.length > 0) {
          setSelectedDatabase(data[0].id);
          localStorage.setItem("notion_database_id", data[0].id);
        }
      } else {
        const error = await response.json();
        setConnectionStatus("error");
        setErrorMessage(error.error || "Failed to connect to Notion");
      }
    } catch (_error) {
      setConnectionStatus("error");
      setErrorMessage("Network error. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDatabaseSelect = (databaseId: string) => {
    setSelectedDatabase(databaseId);
    localStorage.setItem("notion_database_id", databaseId);
  };

  const getConnectionStatusIcon = () => {
    switch (connectionStatus) {
      case "connected":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "error":
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case "connected":
        return "Connected to Notion";
      case "error":
        return "Connection failed";
      case "testing":
        return "Testing connection...";
      default:
        return "Not connected";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Notion Integration Setup
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* API Key Input */}
        <div className="space-y-2">
          <Label htmlFor="notion-api-key">Notion API Key</Label>
          <div className="flex gap-2">
            <Input
              id="notion-api-key"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your Notion integration token"
              className="flex-1"
            />
            <Button
              onClick={testConnection}
              disabled={isLoading || !apiKey}
              variant="outline"
            >
              {isLoading ? "Testing..." : "Test Connection"}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Get your API key from{" "}
            <a
              href="https://www.notion.so/my-integrations"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline inline-flex items-center gap-1"
            >
              Notion Integrations
              <ExternalLink className="w-3 h-3" />
            </a>
          </p>
        </div>

        {/* Connection Status */}
        <Alert>
          <div className="flex items-center gap-2">
            {getConnectionStatusIcon()}
            <AlertDescription>{getConnectionStatusText()}</AlertDescription>
          </div>
          {errorMessage && (
            <AlertDescription className="mt-2 text-red-600">
              {errorMessage}
            </AlertDescription>
          )}
        </Alert>

        {/* Database Selection */}
        {connectionStatus === "connected" && databases.length > 0 && (
          <div className="space-y-2">
            <Label htmlFor="notion-database">Select Task Database</Label>
            <Select
              value={selectedDatabase}
              onValueChange={handleDatabaseSelect}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a database" />
              </SelectTrigger>
              <SelectContent>
                {databases.map((db) => (
                  <SelectItem key={db.id} value={db.id}>
                    <div className="flex flex-col">
                      <span className="font-medium">{db.title}</span>
                      {db.description && (
                        <span className="text-sm text-muted-foreground">
                          {db.description}
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedDatabase && (
              <p className="text-sm text-green-600">
                ✓ Database selected:{" "}
                {databases.find((db) => db.id === selectedDatabase)?.title}
              </p>
            )}
          </div>
        )}

        {/* Setup Instructions */}
        {connectionStatus === "idle" && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">
              Setup Instructions:
            </h4>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>
                Create a new integration at{" "}
                <a
                  href="https://www.notion.so/my-integrations"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  notion.so/my-integrations
                </a>
              </li>
              <li>Copy the &quot;Internal Integration Token&quot;</li>
              <li>Share your task database with the integration</li>
              <li>Paste the token above and test the connection</li>
            </ol>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
