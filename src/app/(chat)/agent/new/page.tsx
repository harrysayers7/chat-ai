import { getSession } from "auth/server";
import { notFound } from "next/navigation";
import { NewAgentPage } from "@/components/agent/new-agent-page";

export default async function Page() {
  const session = await getSession();

  if (!session?.user.id) {
    notFound();
  }

  return <NewAgentPage userId={session.user.id} />;
}
