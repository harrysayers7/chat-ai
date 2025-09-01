"use client";

import React, { memo, useState, useEffect } from "react";
import {
  Settings,
  Download,
  Upload,
  Trash2,
  Moon,
  Sun,
  Monitor,
  Type,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Button } from "../../ui/button";
import { Switch } from "../../ui/switch";
import { Label } from "../../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../ui/dialog";
import { Separator } from "../../ui/separator";
import { persistenceService, ChatPreferences } from "@/lib/persistence";
import { AnimatedFeedback } from "./AnimatedFeedback";

interface SettingsPanelProps {
  className?: string;
}

export const SettingsPanel = memo(function SettingsPanel({
  className,
}: SettingsPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [preferences, setPreferences] = useState<ChatPreferences>(
    persistenceService.getPreferences(),
  );
  const [lastSyncTime, setLastSyncTime] = useState<number>(
    persistenceService.getLastSyncTime(),
  );
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnlineStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener("online", handleOnlineStatus);
    window.addEventListener("offline", handleOnlineStatus);

    return () => {
      window.removeEventListener("online", handleOnlineStatus);
      window.removeEventListener("offline", handleOnlineStatus);
    };
  }, []);

  const updatePreference = (key: keyof ChatPreferences, value: any) => {
    const updated = { ...preferences, [key]: value };
    setPreferences(updated);
    persistenceService.savePreferences(updated);
  };

  const handleExport = () => {
    try {
      const data = persistenceService.exportData();
      const blob = new Blob([data], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `chat-ai-backup-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export failed:", error);
    }
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result as string;
        persistenceService.importData(data);
        setPreferences(persistenceService.getPreferences());
        setLastSyncTime(persistenceService.getLastSyncTime());
      } catch (error) {
        console.error("Import failed:", error);
      }
    };
    reader.readAsText(file);
  };

  const handleClearData = () => {
    if (
      confirm(
        "Are you sure you want to clear all data? This action cannot be undone.",
      )
    ) {
      persistenceService.clearAllData();
      setPreferences(persistenceService.getPreferences());
      setLastSyncTime(persistenceService.getLastSyncTime());
    }
  };

  const formatLastSync = (timestamp: number) => {
    if (timestamp === 0) return "Never";
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className={className}>
          <Settings className="w-4 h-4 mr-2" />
          Settings
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Chat Settings
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Appearance */}
          <div>
            <h3 className="text-sm font-medium mb-3">Appearance</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="theme" className="text-sm">
                  Theme
                </Label>
                <Select
                  value={preferences.theme}
                  onValueChange={(value) => updatePreference("theme", value)}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">
                      <div className="flex items-center gap-2">
                        <Sun className="w-4 h-4" />
                        Light
                      </div>
                    </SelectItem>
                    <SelectItem value="dark">
                      <div className="flex items-center gap-2">
                        <Moon className="w-4 h-4" />
                        Dark
                      </div>
                    </SelectItem>
                    <SelectItem value="system">
                      <div className="flex items-center gap-2">
                        <Monitor className="w-4 h-4" />
                        System
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="fontSize" className="text-sm">
                  Font Size
                </Label>
                <Select
                  value={preferences.fontSize}
                  onValueChange={(value) => updatePreference("fontSize", value)}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Small</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="large">Large</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="compactMode" className="text-sm">
                  Compact Mode
                </Label>
                <Switch
                  id="compactMode"
                  checked={preferences.compactMode}
                  onCheckedChange={(checked) =>
                    updatePreference("compactMode", checked)
                  }
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Behavior */}
          <div>
            <h3 className="text-sm font-medium mb-3">Behavior</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="autoScroll" className="text-sm">
                  Auto-scroll
                </Label>
                <Switch
                  id="autoScroll"
                  checked={preferences.autoScroll}
                  onCheckedChange={(checked) =>
                    updatePreference("autoScroll", checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="soundEnabled" className="text-sm">
                  Sound Effects
                </Label>
                <Switch
                  id="soundEnabled"
                  checked={preferences.soundEnabled}
                  onCheckedChange={(checked) =>
                    updatePreference("soundEnabled", checked)
                  }
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Data Management */}
          <div>
            <h3 className="text-sm font-medium mb-3">Data Management</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Sync Status
                </span>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${isOnline ? "bg-green-500" : "bg-red-500"}`}
                  />
                  <span className="text-xs text-muted-foreground">
                    {isOnline ? "Online" : "Offline"}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Last Sync</span>
                <span className="text-xs text-muted-foreground">
                  {formatLastSync(lastSyncTime)}
                </span>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExport}
                  className="flex-1"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    document.getElementById("import-file")?.click()
                  }
                  className="flex-1"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Import
                </Button>
              </div>

              <input
                id="import-file"
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />

              <Button
                variant="destructive"
                size="sm"
                onClick={handleClearData}
                className="w-full"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear All Data
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
});
