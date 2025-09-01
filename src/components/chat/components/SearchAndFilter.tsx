"use client";

import React, { useState, useCallback, useMemo } from "react";
import {
  Search,
  Filter,
  X,
  Calendar,
  Code,
  Link,
  Image,
  MessageSquare,
} from "lucide-react";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Badge } from "../../ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "../../ui/popover";
import { Checkbox } from "../../ui/checkbox";
import { Label } from "../../ui/label";

interface SearchAndFilterProps {
  onSearchChange: (query: string) => void;
  onFilterChange: (filters: FilterOptions) => void;
  onDateRangeChange: (range: DateRange) => void;
  totalMessages: number;
  filteredCount: number;
}

interface FilterOptions {
  showUser: boolean;
  showAssistant: boolean;
  showCode: boolean;
  showLinks: boolean;
  showImages: boolean;
  showText: boolean;
}

interface DateRange {
  start: Date | null;
  end: Date | null;
}

export function SearchAndFilter({
  onSearchChange,
  onFilterChange,
  onDateRangeChange,
  totalMessages,
  filteredCount,
}: SearchAndFilterProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<FilterOptions>({
    showUser: true,
    showAssistant: true,
    showCode: true,
    showLinks: true,
    showImages: true,
    showText: true,
  });
  const [dateRange, setDateRange] = useState<DateRange>({
    start: null,
    end: null,
  });

  // Debounced search
  const debouncedSearch = useMemo(() => {
    let timeout: NodeJS.Timeout;
    return (query: string) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => onSearchChange(query), 300);
    };
  }, [onSearchChange]);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const query = e.target.value;
      setSearchQuery(query);
      debouncedSearch(query);
    },
    [debouncedSearch],
  );

  const handleFilterChange = useCallback(
    (key: keyof FilterOptions, value: boolean) => {
      const newFilters = { ...filters, [key]: value };
      setFilters(newFilters);
      onFilterChange(newFilters);
    },
    [filters, onFilterChange],
  );

  const handleDateRangeChange = useCallback(
    (range: DateRange) => {
      setDateRange(range);
      onDateRangeChange(range);
    },
    [onDateRangeChange],
  );

  const clearAll = useCallback(() => {
    setSearchQuery("");
    setFilters({
      showUser: true,
      showAssistant: true,
      showCode: true,
      showLinks: true,
      showImages: true,
      showText: true,
    });
    setDateRange({ start: null, end: null });
    onSearchChange("");
    onFilterChange({
      showUser: true,
      showAssistant: true,
      showCode: true,
      showLinks: true,
      showImages: true,
      showText: true,
    });
    onDateRangeChange({ start: null, end: null });
  }, [onSearchChange, onFilterChange, onDateRangeChange]);

  const hasActiveFilters =
    searchQuery ||
    Object.values(filters).some((v) => !v) ||
    dateRange.start ||
    dateRange.end;

  return (
    <div className="flex items-center gap-2 p-3 bg-background/50 border-b border-border/30">
      {/* Search Input */}
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search messages..."
          value={searchQuery}
          onChange={handleSearchChange}
          className="pl-10 pr-4"
        />
        {searchQuery && (
          <button
            onClick={() => handleSearchChange({ target: { value: "" } } as any)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Filter Button */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="relative">
            <Filter className="h-4 w-4" />
            {hasActiveFilters && (
              <Badge
                variant="secondary"
                className="absolute -top-1 -right-1 h-4 w-4 p-0 text-xs"
              >
                !
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-4" align="end">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Filter Messages</h4>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearAll}>
                  Clear all
                </Button>
              )}
            </div>

            {/* Message Type Filters */}
            <div className="space-y-3">
              <h5 className="text-sm font-medium text-muted-foreground">
                Message Type
              </h5>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="showUser"
                    checked={filters.showUser}
                    onCheckedChange={(checked) =>
                      handleFilterChange("showUser", checked as boolean)
                    }
                  />
                  <Label
                    htmlFor="showUser"
                    className="text-sm flex items-center gap-1"
                  >
                    <MessageSquare className="h-3 w-3" />
                    User
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="showAssistant"
                    checked={filters.showAssistant}
                    onCheckedChange={(checked) =>
                      handleFilterChange("showAssistant", checked as boolean)
                    }
                  />
                  <Label
                    htmlFor="showAssistant"
                    className="text-sm flex items-center gap-1"
                  >
                    🤖 Assistant
                  </Label>
                </div>
              </div>
            </div>

            {/* Content Type Filters */}
            <div className="space-y-3">
              <h5 className="text-sm font-medium text-muted-foreground">
                Content Type
              </h5>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="showCode"
                    checked={filters.showCode}
                    onCheckedChange={(checked) =>
                      handleFilterChange("showCode", checked as boolean)
                    }
                  />
                  <Label
                    htmlFor="showCode"
                    className="text-sm flex items-center gap-1"
                  >
                    <Code className="h-3 w-3" />
                    Code
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="showLinks"
                    checked={filters.showLinks}
                    onCheckedChange={(checked) =>
                      handleFilterChange("showLinks", checked as boolean)
                    }
                  />
                  <Label
                    htmlFor="showLinks"
                    className="text-sm flex items-center gap-1"
                  >
                    <Link className="h-3 w-3" />
                    Links
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="showImages"
                    checked={filters.showImages}
                    onCheckedChange={(checked) =>
                      handleFilterChange("showImages", checked as boolean)
                    }
                  />
                  <Label
                    htmlFor="showImages"
                    className="text-sm flex items-center gap-1"
                  >
                    <Image className="h-3 w-3" />
                    Images
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="showText"
                    checked={filters.showText}
                    onCheckedChange={(checked) =>
                      handleFilterChange("showText", checked as boolean)
                    }
                  />
                  <Label
                    htmlFor="showText"
                    className="text-sm flex items-center gap-1"
                  >
                    <MessageSquare className="h-3 w-3" />
                    Text
                  </Label>
                </div>
              </div>
            </div>

            {/* Date Range */}
            <div className="space-y-3">
              <h5 className="text-sm font-medium text-muted-foreground">
                Date Range
              </h5>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label
                    htmlFor="startDate"
                    className="text-xs text-muted-foreground"
                  >
                    From
                  </Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={dateRange.start?.toISOString().split("T")[0] || ""}
                    onChange={(e) => {
                      const date = e.target.value
                        ? new Date(e.target.value)
                        : null;
                      handleDateRangeChange({ ...dateRange, start: date });
                    }}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label
                    htmlFor="endDate"
                    className="text-xs text-muted-foreground"
                  >
                    To
                  </Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={dateRange.end?.toISOString().split("T")[0] || ""}
                    onChange={(e) => {
                      const date = e.target.value
                        ? new Date(e.target.value)
                        : null;
                      handleDateRangeChange({ ...dateRange, end: date });
                    }}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Results Count */}
      <div className="text-xs text-muted-foreground">
        {filteredCount} of {totalMessages} messages
      </div>
    </div>
  );
}
