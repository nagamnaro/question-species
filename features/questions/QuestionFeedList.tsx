"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { EnrichedQuestion } from "./enrich-feed";
import type { FeedSignalsMap } from "./feed-signals";
import { QuestionCard } from "./QuestionCard";
import type { SpeciesFilter } from "./SpeciesTabs";

interface QuestionFeedListProps {
  questions: EnrichedQuestion[];
  activeFilter: SpeciesFilter;
  feedSignals: FeedSignalsMap;
  isAuthenticated: boolean;
  upvotedQuestionIds: Set<string>;
}

function matchesSearch(question: EnrichedQuestion, query: string): boolean {
  const haystack = [
    question.text,
    ...question.tags,
    question.author?.displayName ?? "",
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(query);
}

export function QuestionFeedList({
  questions,
  activeFilter,
  feedSignals,
  isAuthenticated,
  upvotedQuestionIds,
}: QuestionFeedListProps) {
  const [query, setQuery] = useState("");

  const filteredQuestions = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return questions;
    return questions.filter((question) => matchesSearch(question, normalized));
  }, [questions, query]);

  const isSearching = query.trim().length > 0;

  return (
    <div className="space-y-6">
      <label className="block">
        <span className="sr-only">Search questions</span>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search questions…"
          className="w-full border-b border-zinc-200 bg-transparent px-1 py-2 text-base text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-400 dark:border-zinc-700 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-zinc-500"
        />
      </label>

      {isAuthenticated && (
        <Link
          href="/submit"
          className="flex items-center justify-between rounded-xl border border-teal-200 bg-teal-50/80 px-4 py-3 text-sm transition-colors hover:bg-teal-100 dark:border-teal-900 dark:bg-teal-950/40 dark:hover:bg-teal-950/60"
        >
          <span className="font-medium text-teal-900 dark:text-teal-200">
            + Submit a question
          </span>
          <span className="text-teal-700 dark:text-teal-400">Community →</span>
        </Link>
      )}

      {questions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 px-6 py-12 text-center dark:border-zinc-700">
          <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            No questions yet
          </p>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {activeFilter === "all"
              ? "Run the database migrations to seed starter questions."
              : `No ${activeFilter} questions found. Try another species.`}
          </p>
        </div>
      ) : filteredQuestions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 px-6 py-10 text-center dark:border-zinc-700">
          <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            No matching questions
          </p>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Nothing in this feed matches &ldquo;{query.trim()}&rdquo;.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {isSearching && (
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {filteredQuestions.length} question
              {filteredQuestions.length !== 1 ? "s" : ""} found
            </p>
          )}
          {filteredQuestions.map((question) => (
            <QuestionCard
              key={question.id}
              question={question}
              signals={feedSignals[question.id]}
              isAuthenticated={isAuthenticated}
              hasUpvoted={upvotedQuestionIds.has(question.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
