import { selectThreadWithMessagesAction } from "@/app/api/chat/actions";
import ChatBot from "@/components/chat-bot";
import { Suspense } from "react";
import Loading from "./loading";

import { ChatMessage, ChatThread } from "app-types/chat";
import { convertToUIMessage } from "lib/utils";
import { redirect, RedirectType } from "next/navigation";

const fetchThread = async (
  threadId: string,
): Promise<(ChatThread & { messages: ChatMessage[] }) | null> => {
  try {
    return await selectThreadWithMessagesAction(threadId);
  } catch (error) {
    console.error("Failed to fetch thread:", error);
    throw new Error(
      `Failed to load chat: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
};

export default async function Page({
  params,
}: { params: Promise<{ thread: string }> }) {
  const { thread: threadId } = await params;

  const thread = await fetchThread(threadId);

  if (!thread) {
    redirect("/", RedirectType.replace);
  }

  const initialMessages = thread.messages.map(convertToUIMessage);

  return (
    <Suspense fallback={<Loading />}>
      <ChatBot threadId={threadId} initialMessages={initialMessages} />
    </Suspense>
  );
}
