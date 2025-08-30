"use client";

import React, { useState, useMemo } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "ui/collapsible";
import { Button } from "ui/button";
import { Pin, Star, Copy, ChevronUp } from "lucide-react";
import { SaveButtons } from "./save-buttons";
import { CopyButton } from "./copy-button";

interface Message {
  id: string;
  role: "user" | "assistant" | "system" | "data";
  content: string;
}

interface CollapsibleChatProps {
  messages: Message[];
  keepLast?: number;
  threadId?: string;
  onPoxyToolCall?: () => void;
}

export function CollapsibleChat({
  messages,
  keepLast = 3,
  threadId,
  onPoxyToolCall,
}: CollapsibleChatProps) {
  const [pinned, setPinned] = useState<Set<string>>(new Set());
  const [starred, setStarred] = useState<Set<string>>(new Set());
  const [showOnlyStarred, setShowOnlyStarred] = useState(false);

  const togglePin = (messageId: string) => {
    const newPinned = new Set(pinned);
    if (newPinned.has(messageId)) {
      newPinned.delete(messageId);
    } else {
      newPinned.add(messageId);
    }
    setPinned(newPinned);
  };

  const toggleStar = (messageId: string) => {
    const newStarred = new Set(starred);
    if (newStarred.has(messageId)) {
      newStarred.delete(messageId);
    } else {
      newStarred.add(messageId);
    }
    setStarred(newStarred);
  };

  const pinnedMessages = useMemo(() => {
    return messages.filter((msg) => pinned.has(msg.id));
  }, [messages, pinned]);

  const filteredTurns = useMemo(() => {
    if (!showOnlyStarred) {
      return messages;
    }
    
    // When showing only starred, include starred messages and the last message
    const starredMessages = messages.filter((msg) => starred.has(msg.id));
    const lastMessage = messages[messages.length - 1];
    
    if (lastMessage && !starred.has(lastMessage.id)) {
      starredMessages.push(lastMessage);
    }
    
    return starredMessages;
  }, [messages, starred, showOnlyStarred]);

  const olderMessages = filteredTurns.slice(0, -keepLast);
  const recentMessages = filteredTurns.slice(-keepLast);

  return (
    <div className="space-y-4">
      {/* Global Controls */}
      <div className="flex items-center gap-2 mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowOnlyStarred(!showOnlyStarred)}
          className={`flex items-center gap-2 ${
            showOnlyStarred ? "bg-yellow-100 border-yellow-300" : ""
          }`}
        >
          <Star
            className={`w-4 h-4 ${
              showOnlyStarred ? "fill-yellow-500 text-yellow-600" : "text-gray-500"
            }`}
          />
          {showOnlyStarred ? "Show All" : "Show Starred Only"}
        </Button>
      </div>

      {/* Pinned Chats Section */}
      {pinnedMessages.length > 0 && (
        <div className="border rounded-lg p-4 bg-gray-50">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-700">Pinned Chats</h3>
          </div>
          <div className="space-y-2">
            {pinnedMessages.map((message) => (
              <div
                key={message.id}
                className="border rounded p-3 bg-white shadow-sm"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-600">
                      {message.role === "user" ? "User" : message.role === "data" ? "Data" : "Assistant"}
                    </span>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => togglePin(message.id)}
                        className="p-1 h-6 w-6"
                      >
                        <Pin
                          className={`w-4 h-4 ${
                            pinned.has(message.id)
                              ? "fill-red-500 text-red-600"
                              : "text-gray-400"
                          }`}
                        />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleStar(message.id)}
                        className="p-1 h-6 w-6"
                      >
                        <svg
                          className={`w-4 h-4 ${
                            starred.has(message.id)
                              ? "fill-yellow-500 text-yellow-600"
                              : "text-gray-400"
                          }`}
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                          />
                        </svg>
                      </Button>
                    </div>
                  </div>
                  <Collapsible>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="p-1 h-6 w-6">
                        <ChevronUp className="w-4 h-4" />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="mt-2 text-sm text-gray-600">
                        {message.content}
                      </div>
                      <div className="mt-2">
                        <CopyButton
                          text={message.content}
                          className="text-xs"
                        />
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Older Chats Section */}
      {olderMessages.length > 0 && (
        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-700">Older Chats</h3>
            <Collapsible>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="p-1 h-6 w-6">
                  <ChevronUp className="w-4 h-4" />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="space-y-2">
                  {olderMessages.map((message) => (
                    <div
                      key={message.id}
                      className="border rounded p-3 bg-gray-50"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-600">
                            {message.role === "user" ? "User" : message.role === "data" ? "Data" : "Assistant"}
                          </span>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => togglePin(message.id)}
                              className="p-1 h-6 w-6"
                            >
                              <Pin
                                className={`w-4 h-4 ${
                                  pinned.has(message.id)
                                    ? "fill-red-500 text-red-600"
                                    : "text-gray-400"
                                }`}
                              />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleStar(message.id)}
                              className="p-1 h-6 w-6"
                            >
                              <svg
                                className={`w-4 h-4 ${
                                  starred.has(message.id)
                                    ? "fill-yellow-500 text-yellow-600"
                                    : "text-gray-400"
                                }`}
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                                />
                              </svg>
                            </Button>
                          </div>
                        </div>
                        <Collapsible>
                          <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="sm" className="p-1 h-6 w-6">
                              <ChevronUp className="w-4 h-4" />
                            </Button>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <div className="mt-2 text-sm text-gray-600">
                              {message.content}
                            </div>
                            <div className="mt-2">
                              <CopyButton
                                text={message.content}
                                className="text-xs"
                              />
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      </div>
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </div>
      )}

      {/* Last 2 Messages Section */}
      {recentMessages.length > 0 && (
        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-700">Last 2 Messages</h3>
            <Collapsible>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="p-1 h-6 w-6">
                  <ChevronUp className="w-4 h-4" />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="space-y-2">
                  {recentMessages.map((message) => (
                    <div
                      key={message.id}
                      className="border rounded p-3 bg-blue-50"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-600">
                            {message.role === "user" ? "User" : message.role === "data" ? "Data" : "Assistant"}
                          </span>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => togglePin(message.id)}
                              className="p-1 h-6 w-6"
                            >
                              <Pin
                                className={`w-4 h-4 ${
                                  pinned.has(message.id)
                                    ? "fill-red-500 text-red-600"
                                    : "text-gray-400"
                                }`}
                              />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleStar(message.id)}
                              className="p-1 h-6 w-6"
                            >
                              <svg
                                className={`w-4 h-4 ${
                                  starred.has(message.id)
                                    ? "fill-yellow-500 text-yellow-600"
                                    : "text-gray-400"
                                }`}
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                                />
                              </svg>
                            </Button>
                          </div>
                        </div>
                        <Collapsible>
                          <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="sm" className="p-1 h-6 w-6">
                              <ChevronUp className="w-4 h-4" />
                            </Button>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <div className="mt-2 text-sm text-gray-600">
                              {message.content}
                            </div>
                            <div className="mt-2">
                              <CopyButton
                                text={message.content}
                                className="text-xs"
                              />
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      </div>
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </div>
      )}

      {/* Save Buttons */}
      {threadId && (
        <div className="flex justify-center">
          <SaveButtons threadId={threadId} onPoxyToolCall={onPoxyToolCall} />
        </div>
      )}
    </div>
  );
}
