"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SPECIES_META } from "@/features/questions/species-styles";
import { getSpeciesStyle } from "@/features/questions/species-styles";
import { submitQuestion } from "@/features/questions/actions";
import { getQuestionSuggestions } from "@/features/questions/suggest-actions";
import { Spinner } from "@/components/ui/Spinner";
import type { Species } from "@/types";

export function SubmitQuestionForm() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [species, setSpecies] = useState<Species>("opinion");
  const [tags, setTags] = useState("");
  const [suggestionNote, setSuggestionNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isSuggesting, setIsSuggesting] = useState(false);

  const speciesStyle = getSpeciesStyle(species);

  useEffect(() => {
    if (text.trim().length < 12) {
      setSuggestionNote(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSuggesting(true);
      const suggestion = await getQuestionSuggestions(text);
      setIsSuggesting(false);

      if (!suggestion) return;

      setSpecies(suggestion.species);
      setTags(suggestion.tags.join(", "));
      setSuggestionNote(
        suggestion.source === "ai"
          ? "AI suggested species and tags for this question."
          : "Suggested species and tags based on your wording.",
      );
    }, 600);

    return () => clearTimeout(timer);
  }, [text]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await submitQuestion({ text, species, tags });

      if (!result.success) {
        setError(result.error ?? "Something went wrong.");
        setSuccessMessage(null);
        return;
      }

      if (result.status === "pending") {
        setSuccessMessage(
          `Submitted for review — ${result.qualityReasons?.join(" ") ?? "we'll publish it once it passes quality checks."}`,
        );
        setText("");
        setTags("");
        return;
      }

      if (result.questionId) {
        router.push(`/question/${result.questionId}`);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label
          htmlFor="question-text"
          className="block text-sm font-medium text-zinc-900 dark:text-zinc-100"
        >
          Your question
        </label>
        <textarea
          id="question-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          maxLength={500}
          placeholder="What discourse topic are you curious about?"
          className="mt-2 w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder:text-zinc-500 dark:focus:border-zinc-500 dark:focus:ring-zinc-800"
          required
        />
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          {text.length}/500 characters
          {isSuggesting && " · Analysing…"}
        </p>
        {suggestionNote && (
          <p className="mt-1 text-xs text-teal-700 dark:text-teal-400">
            {suggestionNote}
          </p>
        )}
      </div>

      <div>
        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
          Species
        </p>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {SPECIES_META.map((option) => {
            const style = getSpeciesStyle(option.id);
            const selected = species === option.id;

            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setSpecies(option.id)}
                className={`rounded-xl border px-3 py-2 text-left text-sm transition-all ${
                  selected
                    ? `${style.tabActive} border-transparent`
                    : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                }`}
              >
                <span className="mr-1">{option.emoji}</span>
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label
          htmlFor="question-tags"
          className="block text-sm font-medium text-zinc-900 dark:text-zinc-100"
        >
          Tags (optional)
        </label>
        <input
          id="question-tags"
          type="text"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="discourse, ai, social-media"
          className="mt-2 w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder:text-zinc-500 dark:focus:border-zinc-500 dark:focus:ring-zinc-800"
        />
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          Auto-suggested from your question text. Edit freely.
        </p>
      </div>

      {successMessage && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
          {successMessage}
        </p>
      )}

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-colors disabled:opacity-60 ${speciesStyle.cta}`}
        >
          {isPending ? (
            <>
              <Spinner className="h-4 w-4" />
              Submitting…
            </>
          ) : (
            "Submit question"
          )}
        </button>
        <Link
          href="/"
          className="text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
