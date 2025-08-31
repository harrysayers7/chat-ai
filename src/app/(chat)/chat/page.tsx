import { redirect } from "next/navigation";
import { generateUUID } from "@/lib/utils";

export default function ChatPage() {
  const threadId = generateUUID();
  redirect(`/chat/${threadId}`);
}
