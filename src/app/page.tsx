import ChatBot from "@/components/chat-bot";
import { generateUUID } from "lib/utils";

export const dynamic = "force-dynamic";

export default function RootPage() {
  const id = generateUUID();
  return <ChatBot initialMessages={[]} threadId={id} key={id} />;
}
