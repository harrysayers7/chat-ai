"use client";

import { SidebarGroupLabel, SidebarMenuSub } from "ui/sidebar";
import {
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuSkeleton,
  SidebarMenuSubItem,
} from "ui/sidebar";
import { SidebarGroupContent, SidebarMenu, SidebarMenuItem } from "ui/sidebar";
import { SidebarGroup } from "ui/sidebar";
import { ThreadDropdown } from "../thread-dropdown";
import { ChevronDown, ChevronUp, MoreHorizontal, Trash } from "lucide-react";
import { useMounted } from "@/hooks/use-mounted";
import { appStore } from "@/app/store";
import { Button } from "ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "ui/dropdown-menu";
import {
  deleteThreadsAction,
  deleteUnarchivedThreadsAction,
} from "@/app/api/chat/actions";
import { fetcher } from "lib/utils";
import { toast } from "sonner";
import { useShallow } from "zustand/shallow";
import { useRouter } from "next/navigation";
import useSWR, { mutate } from "swr";
import { handleErrorWithToast } from "ui/shared-toast";
import { useMemo, useState, useCallback, useEffect } from "react";

import { useTranslations } from "next-intl";
import { TextShimmer } from "ui/text-shimmer";
import { Tooltip, TooltipContent, TooltipTrigger } from "ui/tooltip";
import { deduplicateByKey, groupBy } from "lib/utils";
import { ChatThread } from "app-types/chat";

type ThreadGroup = {
  label: string;
  threads: ChatThread[];
};

const MAX_THREADS_COUNT = 40;

export function AppSidebarThreads() {
  const mounted = useMounted();
  const router = useRouter();
  const t = useTranslations("Layout");
  const [storeMutate, currentThreadId, generatingTitleThreadIds] = appStore(
    useShallow((state) => [
      state.mutate,
      state.currentThreadId,
      state.generatingTitleThreadIds,
    ]),
  );
  // State to track if expanded view is active
  const [isExpanded, setIsExpanded] = useState(false);
  const [navigatingThreadId, setNavigatingThreadId] = useState<string | null>(
    null,
  );

  const {
    data: threadList,
    isLoading,
    error,
  } = useSWR("/api/thread", fetcher, {
    onError: handleErrorWithToast,
    fallbackData: [],
    onSuccess: (data) => {
      storeMutate((prev) => {
        const groupById = groupBy(prev.threadList, "id");

        const generatingTitleThreads = prev.generatingTitleThreadIds
          .map((id) => {
            return groupById[id]?.[0];
          })
          .filter(Boolean) as ChatThread[];
        const list = deduplicateByKey(
          generatingTitleThreads.concat(data),
          "id",
        );
        return {
          threadList: list.map((v) => {
            const target = groupById[v.id]?.[0];
            if (!target) return v;
            if (target.title && !v.title)
              return {
                ...v,
                title: target.title,
              };
            return v;
          }),
        };
      });
    },
    // Add retry configuration
    errorRetryCount: 3,
    errorRetryInterval: 1000,
  });

  // Handle thread navigation with loading state
  const handleThreadClick = useCallback(
    async (threadId: string) => {
      console.log("Navigating to thread:", threadId);
      setNavigatingThreadId(threadId);
      try {
        await router.push(`/chat/${threadId}`);
      } catch (error) {
        console.error("Navigation error:", error);
        toast.error("Failed to navigate to chat");
      } finally {
        setNavigatingThreadId(null);
      }
    },
    [router],
  );

  // Debug logging
  useEffect(() => {
    if (error) {
      console.error("Thread loading error:", error);
    }
    if (threadList) {
      console.log("Threads loaded:", threadList.length);
    }
  }, [error, threadList]);

  // Check if we have 40 or more threads to display "View All" button
  const hasExcessThreads = threadList && threadList.length >= MAX_THREADS_COUNT;

  // Use either limited or full thread list based on expanded state
  const displayThreadList = useMemo(() => {
    if (!threadList) return [];
    return !isExpanded && hasExcessThreads
      ? threadList.slice(0, MAX_THREADS_COUNT)
      : threadList;
  }, [threadList, hasExcessThreads, isExpanded]);

  const threadGroupByDate = useMemo(() => {
    if (!displayThreadList || displayThreadList.length === 0) {
      return [];
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);

    const groups: ThreadGroup[] = [
      { label: t("today"), threads: [] },
      { label: t("yesterday"), threads: [] },
      { label: t("lastWeek"), threads: [] },
      { label: t("older"), threads: [] },
    ];

    displayThreadList.forEach((thread) => {
      const threadDate =
        (thread.lastMessageAt
          ? new Date(thread.lastMessageAt)
          : new Date(thread.createdAt)) || new Date();
      threadDate.setHours(0, 0, 0, 0);

      if (threadDate.getTime() === today.getTime()) {
        groups[0].threads.push(thread);
      } else if (threadDate.getTime() === yesterday.getTime()) {
        groups[1].threads.push(thread);
      } else if (threadDate.getTime() >= lastWeek.getTime()) {
        groups[2].threads.push(thread);
      } else {
        groups[3].threads.push(thread);
      }
    });

    // Filter out empty groups
    return groups.filter((group) => group.threads.length > 0);
  }, [displayThreadList]);

  const handleDeleteAllThreads = async () => {
    await toast.promise(deleteThreadsAction(), {
      loading: t("deletingAllChats"),
      success: () => {
        mutate("/api/thread");
        router.push("/");
        return t("allChatsDeleted");
      },
      error: t("failedToDeleteAllChats"),
    });
  };

  const handleDeleteUnarchivedThreads = async () => {
    await toast.promise(deleteUnarchivedThreadsAction(), {
      loading: t("deletingUnarchivedChats"),
      success: () => {
        mutate("/api/thread");
        return t("unarchivedChatsDeleted");
      },
      error: t("failedToDeleteUnarchivedChats"),
    });
  };

  if (isLoading || threadList?.length === 0)
    return (
      <SidebarGroup>
        <SidebarGroupContent className="group-data-[collapsible=icon]:hidden group/threads">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarGroupLabel className="">
                <h4 className="text-xs text-muted-foreground">
                  {t("recentChats")}
                </h4>
              </SidebarGroupLabel>

              {isLoading ? (
                Array.from({ length: 12 }).map(
                  (_, index) => mounted && <SidebarMenuSkeleton key={index} />,
                )
              ) : error ? (
                <div className="px-2 py-4 text-center">
                  <p className="text-sm text-destructive mb-2">
                    Failed to load chats
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => mutate("/api/thread")}
                    className="text-xs"
                  >
                    Retry
                  </Button>
                </div>
              ) : (
                <div className="px-2 py-4 text-center">
                  <p className="text-sm text-muted-foreground">
                    {t("noConversationsYet")}
                  </p>
                </div>
              )}
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    );

  return (
    <>
      {threadGroupByDate.map((group, index) => {
        const isFirst = index === 0;
        return (
          <SidebarGroup key={group.label}>
            <SidebarGroupContent className="group-data-[collapsible=icon]:hidden group/threads">
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarGroupLabel className="">
                    <h4 className="text-xs text-muted-foreground group-hover/threads:text-foreground transition-colors">
                      {group.label}
                    </h4>
                    <div className="flex-1" />
                    {isFirst && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="data-[state=open]:bg-input! opacity-0 data-[state=open]:opacity-100! group-hover/threads:opacity-100 transition-opacity"
                          >
                            <MoreHorizontal />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent side="right" align="start">
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={handleDeleteAllThreads}
                          >
                            <Trash />
                            {t("deleteAllChats")}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={handleDeleteUnarchivedThreads}
                          >
                            <Trash />
                            {t("deleteUnarchivedChats")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </SidebarGroupLabel>

                  {group.threads.map((thread) => (
                    <SidebarMenuSub
                      key={thread.id}
                      className={"group/thread mr-0"}
                    >
                      <SidebarMenuSubItem>
                        <ThreadDropdown
                          side="right"
                          threadId={thread.id}
                          beforeTitle={thread.title}
                        >
                          <div className="flex items-center data-[state=open]:bg-input! group-hover/thread:bg-input! rounded-lg">
                            <Tooltip delayDuration={1000}>
                              <TooltipTrigger asChild>
                                <SidebarMenuButton
                                  asChild
                                  className="group-hover/thread:bg-transparent!"
                                  isActive={currentThreadId === thread.id}
                                >
                                  <button
                                    onClick={() => handleThreadClick(thread.id)}
                                    className="flex items-center w-full text-left"
                                    disabled={navigatingThreadId === thread.id}
                                  >
                                    {navigatingThreadId === thread.id ? (
                                      <div className="flex items-center gap-2">
                                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary"></div>
                                        <span className="text-muted-foreground">
                                          Loading...
                                        </span>
                                      </div>
                                    ) : generatingTitleThreadIds.includes(
                                        thread.id,
                                      ) ? (
                                      <TextShimmer className="truncate min-w-0">
                                        {thread.title || "New Chat"}
                                      </TextShimmer>
                                    ) : (
                                      <p className="truncate min-w-0">
                                        {thread.title || "New Chat"}
                                      </p>
                                    )}
                                  </button>
                                </SidebarMenuButton>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-[200px] p-4 break-all overflow-y-auto max-h-[200px]">
                                {thread.title || "New Chat"}
                              </TooltipContent>
                            </Tooltip>

                            <SidebarMenuAction className="data-[state=open]:bg-input data-[state=open]:opacity-100 opacity-0 group-hover/thread:opacity-100">
                              <MoreHorizontal />
                            </SidebarMenuAction>
                          </div>
                        </ThreadDropdown>
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  ))}
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        );
      })}

      {hasExcessThreads && (
        <SidebarMenu>
          <SidebarMenuItem>
            {/* TODO: Later implement a dedicated search/all chats page instead of this expand functionality */}
            <div className="w-full flex px-4">
              <Button
                variant="secondary"
                size="sm"
                className="w-full hover:bg-input! justify-start"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                <MoreHorizontal className="mr-2" />
                {isExpanded ? t("showLessChats") : t("showAllChats")}
                {isExpanded ? <ChevronUp /> : <ChevronDown />}
              </Button>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      )}
    </>
  );
}
