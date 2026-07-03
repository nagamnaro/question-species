import Link from "next/link";
import { getSharedQuestionLink } from "@/features/messages/queries";
import type { MindMatch, MindMatchWithDiscussion } from "./types";

export async function enrichMatchesWithDiscussion(
  userId: string,
  matches: MindMatch[],
): Promise<MindMatchWithDiscussion[]> {
  return Promise.all(
    matches.map(async (match) => ({
      ...match,
      discussionLink: await getSharedQuestionLink(userId, match.userId),
    })),
  );
}
