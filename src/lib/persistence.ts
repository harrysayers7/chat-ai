import { toast } from "sonner";

export interface ChatPreferences {
  pinnedTurns: Record<string, boolean>;
  starredTurns: Record<string, boolean>;
  showOnlyStarred: boolean;
  searchQuery: string;
  contentFilters: {
    showCode: boolean;
    showLinks: boolean;
    showImages: boolean;
    showText: boolean;
  };
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
  selectedTurns: string[];
  showCheckboxes: boolean;
  theme: "light" | "dark" | "system";
  fontSize: "small" | "medium" | "large";
  compactMode: boolean;
  autoScroll: boolean;
  soundEnabled: boolean;
}

const STORAGE_KEYS = {
  PREFERENCES: "chat-ai:preferences",
  PINNED_TURNS: "chat-ai:pinned-turns",
  STARRED_TURNS: "chat-ai:starred-turns",
  SYNC_TIMESTAMP: "chat-ai:sync-timestamp",
} as const;

class PersistenceService {
  private static instance: PersistenceService;
  private syncInterval: NodeJS.Timeout | null = null;
  private lastSyncTime: number = 0;
  private isOnline: boolean = navigator.onLine;

  private constructor() {
    this.setupOnlineOfflineListeners();
    this.startAutoSync();
  }

  static getInstance(): PersistenceService {
    if (!PersistenceService.instance) {
      PersistenceService.instance = new PersistenceService();
    }
    return PersistenceService.instance;
  }

  private setupOnlineOfflineListeners() {
    window.addEventListener("online", () => {
      this.isOnline = true;
      this.syncData();
    });

    window.addEventListener("offline", () => {
      this.isOnline = false;
    });
  }

  private startAutoSync() {
    // Sync every 30 seconds when online
    this.syncInterval = setInterval(() => {
      if (this.isOnline && Date.now() - this.lastSyncTime > 30000) {
        this.syncData();
      }
    }, 30000);
  }

  // Get preferences from localStorage
  getPreferences(): ChatPreferences {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.PREFERENCES);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          pinnedTurns: parsed.pinnedTurns || {},
          starredTurns: parsed.starredTurns || {},
          showOnlyStarred: parsed.showOnlyStarred || false,
          searchQuery: parsed.searchQuery || "",
          contentFilters: {
            showCode: parsed.contentFilters?.showCode ?? true,
            showLinks: parsed.contentFilters?.showLinks ?? true,
            showImages: parsed.contentFilters?.showImages ?? true,
            showText: parsed.contentFilters?.showText ?? true,
          },
          dateRange: {
            start: parsed.dateRange?.start
              ? new Date(parsed.dateRange.start)
              : null,
            end: parsed.dateRange?.end ? new Date(parsed.dateRange.end) : null,
          },
          selectedTurns: parsed.selectedTurns || [],
          showCheckboxes: parsed.showCheckboxes || false,
          theme: parsed.theme || "system",
          fontSize: parsed.fontSize || "medium",
          compactMode: parsed.compactMode || false,
          autoScroll: parsed.autoScroll ?? true,
          soundEnabled: parsed.soundEnabled ?? true,
        };
      }
    } catch (error) {
      console.error("Error loading preferences:", error);
    }

    return this.getDefaultPreferences();
  }

  // Save preferences to localStorage
  savePreferences(preferences: Partial<ChatPreferences>): void {
    try {
      const current = this.getPreferences();
      const updated = { ...current, ...preferences };
      localStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(updated));
      this.lastSyncTime = Date.now();
      this.syncData();
    } catch (error) {
      console.error("Error saving preferences:", error);
      toast.error("Failed to save preferences");
    }
  }

  // Get pinned turns
  getPinnedTurns(): Record<string, boolean> {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.PINNED_TURNS);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error("Error loading pinned turns:", error);
      return {};
    }
  }

  // Save pinned turns
  savePinnedTurns(pinnedTurns: Record<string, boolean>): void {
    try {
      localStorage.setItem(
        STORAGE_KEYS.PINNED_TURNS,
        JSON.stringify(pinnedTurns),
      );
      this.lastSyncTime = Date.now();
      this.syncData();
    } catch (error) {
      console.error("Error saving pinned turns:", error);
      toast.error("Failed to save pinned turns");
    }
  }

  // Get starred turns
  getStarredTurns(): Record<string, boolean> {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.STARRED_TURNS);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error("Error loading starred turns:", error);
      return {};
    }
  }

  // Save starred turns
  saveStarredTurns(starredTurns: Record<string, boolean>): void {
    try {
      localStorage.setItem(
        STORAGE_KEYS.STARRED_TURNS,
        JSON.stringify(starredTurns),
      );
      this.lastSyncTime = Date.now();
      this.syncData();
    } catch (error) {
      console.error("Error saving starred turns:", error);
      toast.error("Failed to save starred turns");
    }
  }

  // Sync data to cloud storage (placeholder for future implementation)
  private async syncData(): Promise<void> {
    if (!this.isOnline) return;

    try {
      const _data = {
        preferences: this.getPreferences(),
        pinnedTurns: this.getPinnedTurns(),
        starredTurns: this.getStarredTurns(),
        timestamp: Date.now(),
      };

      // TODO: Implement cloud sync (Firebase, Supabase, etc.)
      // For now, just update the sync timestamp
      localStorage.setItem(STORAGE_KEYS.SYNC_TIMESTAMP, Date.now().toString());

      console.log("Data synced successfully");
    } catch (error) {
      console.error("Error syncing data:", error);
    }
  }

  // Get last sync time
  getLastSyncTime(): number {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SYNC_TIMESTAMP);
      return stored ? parseInt(stored) : 0;
    } catch {
      return 0;
    }
  }

  // Clear all data
  clearAllData(): void {
    try {
      Object.values(STORAGE_KEYS).forEach((key) => {
        localStorage.removeItem(key);
      });
      toast.success("All data cleared");
    } catch (error) {
      console.error("Error clearing data:", error);
      toast.error("Failed to clear data");
    }
  }

  // Export data
  exportData(): string {
    try {
      const data = {
        preferences: this.getPreferences(),
        pinnedTurns: this.getPinnedTurns(),
        starredTurns: this.getStarredTurns(),
        exportDate: new Date().toISOString(),
      };
      return JSON.stringify(data, null, 2);
    } catch (error) {
      console.error("Error exporting data:", error);
      throw new Error("Failed to export data");
    }
  }

  // Import data
  importData(jsonData: string): void {
    try {
      const data = JSON.parse(jsonData);

      if (data.preferences) {
        this.savePreferences(data.preferences);
      }
      if (data.pinnedTurns) {
        this.savePinnedTurns(data.pinnedTurns);
      }
      if (data.starredTurns) {
        this.saveStarredTurns(data.starredTurns);
      }

      toast.success("Data imported successfully");
    } catch (error) {
      console.error("Error importing data:", error);
      toast.error("Failed to import data");
    }
  }

  private getDefaultPreferences(): ChatPreferences {
    return {
      pinnedTurns: {},
      starredTurns: {},
      showOnlyStarred: false,
      searchQuery: "",
      contentFilters: {
        showCode: true,
        showLinks: true,
        showImages: true,
        showText: true,
      },
      dateRange: {
        start: null,
        end: null,
      },
      selectedTurns: [],
      showCheckboxes: false,
      theme: "system",
      fontSize: "medium",
      compactMode: false,
      autoScroll: true,
      soundEnabled: true,
    };
  }

  // Cleanup
  destroy(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
  }
}

export const persistenceService = PersistenceService.getInstance();
