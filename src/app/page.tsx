import ChatBot from "@/components/chat-bot";
import { generateUUID } from "@/lib/utils";

export default function RootPage() {
  const threadId = generateUUID();
  return <ChatBot initialMessages={[]} threadId={threadId} key={threadId} />;
}
