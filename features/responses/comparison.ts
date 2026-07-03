import type { Question, Species } from "@/types";
import type { ResponseWithUser } from "./queries";
import { isNumericPredictionQuestion } from "./prediction-format";

/** Match numeric answers within this range; text answers must match exactly (case-insensitive). */
const NUMERIC_TOLERANCE = 10;

function parseNumeric(text: string): number | null {
  const value = parseFloat(text.trim());
  return Number.isNaN(value) ? null : value;
}

function shouldUseNumericComparison(
  species: Species,
  questionText: string | undefined,
  a: string,
  b: string,
): boolean {
  if (species === "estimation") return true;
  if (species !== "prediction") return false;

  if (questionText) {
    return isNumericPredictionQuestion(questionText);
  }

  const na = parseNumeric(a);
  const nb = parseNumeric(b);
  return (
    na !== null &&
    nb !== null &&
    na >= 0 &&
    na <= 100 &&
    nb >= 0 &&
    nb <= 100
  );
}

export function answersAgree(
  a: string,
  b: string,
  species: Species,
  questionText?: string,
): boolean {
  if (shouldUseNumericComparison(species, questionText, a, b)) {
    const na = parseNumeric(a);
    const nb = parseNumeric(b);
    if (na !== null && nb !== null) {
      return Math.abs(na - nb) <= NUMERIC_TOLERANCE;
    }
  }
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

export interface ComparisonResult {
  global: {
    stance: "majority" | "minority" | "polarised" | "split";
    agreementPercent: number;
    alignedCount: number;
    totalOthers: number;
  };
  friends: {
    agreementPercent: number;
    alignedCount: number;
    totalFriendsAnswered: number;
    hasFriendResponses: boolean;
  };
}

export function computeComparison(
  question: Pick<Question, "species"> & { text?: string },
  userResponse: ResponseWithUser,
  allResponses: ResponseWithUser[],
  followingIds: string[],
): ComparisonResult {
  const followingSet = new Set(followingIds);
  const others = allResponses.filter(
    (r) => r.user_id !== userResponse.user_id,
  );

  const alignedOthers = others.filter((r) =>
    answersAgree(
      userResponse.answer_text,
      r.answer_text,
      question.species,
      question.text,
    ),
  );

  const totalOthers = others.length;
  const globalAgreementPercent =
    totalOthers > 0
      ? Math.round((alignedOthers.length / totalOthers) * 100)
      : 0;

  let stance: ComparisonResult["global"]["stance"] = "split";
  if (totalOthers === 0) {
    stance = "majority";
  } else if (globalAgreementPercent >= 50) {
    stance = "majority";
  } else if (globalAgreementPercent <= 15) {
    stance = "polarised";
  } else {
    stance = "minority";
  }

  const friendResponses = others.filter((r) => followingSet.has(r.user_id));
  const alignedFriends = friendResponses.filter((r) =>
    answersAgree(
      userResponse.answer_text,
      r.answer_text,
      question.species,
      question.text,
    ),
  );

  const totalFriendsAnswered = friendResponses.length;
  const friendAgreementPercent =
    totalFriendsAnswered > 0
      ? Math.round((alignedFriends.length / totalFriendsAnswered) * 100)
      : 0;

  return {
    global: {
      stance,
      agreementPercent: globalAgreementPercent,
      alignedCount: alignedOthers.length,
      totalOthers,
    },
    friends: {
      agreementPercent: friendAgreementPercent,
      alignedCount: alignedFriends.length,
      totalFriendsAnswered,
      hasFriendResponses: totalFriendsAnswered > 0,
    },
  };
}

export function globalComparisonText(result: ComparisonResult): string {
  const { stance, agreementPercent, alignedCount, totalOthers } = result.global;

  if (totalOthers === 0) {
    return "You're the first to answer — check back as more people respond.";
  }

  const stanceLabel =
    stance === "majority"
      ? "You are in the majority"
      : stance === "polarised"
        ? "You are in a polarised minority"
        : "You are in the minority";

  return `${stanceLabel} — ${agreementPercent}% of others (${alignedCount} of ${totalOthers}) gave a similar answer.`;
}

export function friendsComparisonText(result: ComparisonResult): string {
  const { agreementPercent, alignedCount, totalFriendsAnswered, hasFriendResponses } =
    result.friends;

  if (!hasFriendResponses) {
    return "None of your friends have answered this question yet.";
  }

  return `You agree with ${agreementPercent}% of friends (${alignedCount} of ${totalFriendsAnswered} who answered).`;
}
