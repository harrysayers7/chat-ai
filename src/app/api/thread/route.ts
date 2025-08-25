import { getSession } from "auth/server";
import { chatRepository } from "lib/db/repository";

export async function GET() {
  try {
    const session = await getSession();

    if (!session?.user?.id) {
      return new Response("Unauthorized", { status: 401 });
    }

    const threads = await chatRepository.selectThreadsByUserId(session.user.id);

    if (!threads) {
      console.error("Failed to fetch threads for user:", session.user.id);
      return new Response("Failed to fetch threads", { status: 500 });
    }

    return Response.json(threads);
  } catch (error) {
    console.error("Error fetching threads:", error);
    return new Response("Internal server error while fetching threads", {
      status: 500,
    });
  }
}
