import type { Species } from "@/types";

export type MindMatchKind = "align" | "spark";

export interface MindMatch {
  userId: string;
  displayName: string;
  kind: MindMatchKind;
  agreementPercent: number;
  sharedCount: number;
  agreeCount: number;
}

export interface MindMatchWithDiscussion extends MindMatch {
  discussionLink: { questionId: string; responseId: string } | null;
}

export interface ResponseForMatch {
  userId: string;
  questionId: string;
  species: Species;
  answerText: string;
  displayName: string;
}

export interface PairAgreement {
  userId: string;
  displayName: string;
  agreementPercent: number;
  sharedCount: number;
  agreeCount: number;
}
