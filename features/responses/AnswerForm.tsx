"use client";

import { useState, useTransition } from "react";
import type { Question } from "@/types";
import { getSpeciesStyle } from "@/features/questions/species-styles";
import { Spinner } from "@/components/ui/Spinner";
import { submitResponse } from "@/features/responses/actions";
import { AnswerChoiceSelect } from "@/features/responses/AnswerChoiceSelect";
import {
  getAnswerChoices,
  getAnswerInputMode,
  getAnswerLabel,
  getAnswerPlaceholder,
  isNumericPredictionQuestion,
  requiresReasoningForAnswer,
  validateStructuredAnswer,
} from "@/features/responses/answer-input";
import {
  canSkipCrowdPrediction,
  crowdStepLabel,
  hasCrowdPredictionStep,
} from "@/features/responses/species-flow";

interface AnswerFormProps {
  question: Question;
}

type Step = "answer" | "crowd-prediction";

export function AnswerForm({ question }: AnswerFormProps) {
  const usesCrowdStep = hasCrowdPredictionStep(question);
  const optionalCrowd = canSkipCrowdPrediction(question);
  const isNumericAnswer =
    question.species === "prediction" &&
    isNumericPredictionQuestion(question.text);

  const [step, setStep] = useState<Step>("answer");
  const [answer, setAnswer] = useState("");
  const [reasoning, setReasoning] = useState("");
  const [crowdEstimate, setCrowdEstimate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const inputMode = getAnswerInputMode(question);
  const answerChoices = getAnswerChoices(question);
  const speciesStyle = getSpeciesStyle(question.species);
  const reasoningRequired = requiresReasoningForAnswer(answer);

  function handleAnswerStep(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const validationError = validateStructuredAnswer(
      question,
      answer,
      reasoning,
    );
    if (validationError) {
      setError(validationError);
      return;
    }

    if (usesCrowdStep) {
      setStep("crowd-prediction");
      return;
    }

    submitFinal();
  }

  function handleCrowdStep(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    submitFinal(true);
  }

  function handleSkipCrowd() {
    setError(null);
    submitFinal(false);
  }

  function submitFinal(requireCrowd = usesCrowdStep && !optionalCrowd) {
    startTransition(async () => {
      const validationError = validateStructuredAnswer(
        question,
        answer,
        reasoning,
      );
      if (validationError) {
        setError(validationError);
        return;
      }

      const payload: Parameters<typeof submitResponse>[0] = {
        questionId: question.id,
        answerText: answer,
        reasoningText: reasoning || undefined,
      };

      if (usesCrowdStep && crowdEstimate.trim() !== "") {
        const value = parseFloat(crowdEstimate);
        if (Number.isNaN(value)) {
          if (requireCrowd) {
            setError("Please enter a percentage between 0 and 100.");
            return;
          }
        } else {
          payload.predictionValue = value;
        }
      } else if (requireCrowd) {
        setError("Please enter what % of people you think will agree (0–100).");
        return;
      }

      const result = await submitResponse(payload);

      if (!result.success) {
        setError(result.error ?? "Something went wrong.");
      }
    });
  }

  if (step === "crowd-prediction" && usesCrowdStep) {
    const lockedAnswer = isNumericAnswer ? `${answer}%` : answer;

    return (
      <form onSubmit={handleCrowdStep} className="space-y-5">
        <div className={`rounded-2xl border p-4 ${speciesStyle.header}`}>
          <p className={`text-sm font-semibold ${speciesStyle.muted}`}>
            Step 2 — Crowd prediction
          </p>
          <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
            Your answer is locked in:{" "}
            <span className="font-medium">{lockedAnswer}</span>
          </p>
        </div>

        <div>
          <label
            htmlFor="crowd-estimate"
            className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            {crowdStepLabel(question.species)}
          </label>
          <div className="relative">
            <input
              id="crowd-estimate"
              type="number"
              min={0}
              max={100}
              step={1}
              value={crowdEstimate}
              onChange={(e) => setCrowdEstimate(e.target.value)}
              placeholder="e.g. 65"
              className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2.5 pr-10 text-base outline-none focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-zinc-500"
            />
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-zinc-400">
              %
            </span>
          </div>
          <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">
            Optional — compare your intuition to the crowd after results unlock.
          </p>
        </div>

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => {
              setStep("answer");
              setError(null);
            }}
            className="rounded-lg border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Back
          </button>
          {optionalCrowd && (
            <button
              type="button"
              onClick={handleSkipCrowd}
              disabled={isPending}
              className="rounded-lg border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              Skip
            </button>
          )}
          <button
            type="submit"
            disabled={isPending}
            className={`flex-1 rounded-xl px-4 py-3 text-sm font-bold transition-colors disabled:opacity-50 ${speciesStyle.cta}`}
          >
            {isPending ? (
              <Spinner label="Submitting…" />
            ) : (
              "Submit & see results"
            )}
          </button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={handleAnswerStep} className="space-y-5">
      <div className={`rounded-2xl border p-4 ${speciesStyle.header}`}>
        <p className={`text-sm font-semibold ${speciesStyle.muted}`}>
          Lock in your answer before seeing others
        </p>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          {usesCrowdStep
            ? "Step 1 of 2 — then you can estimate crowd agreement."
            : "Your response unlocks the results view for this question."}
        </p>
      </div>

      <div>
        <label
          htmlFor="answer"
          className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          {getAnswerLabel(question)}
        </label>
        {inputMode === "select" ? (
          <>
            <AnswerChoiceSelect
              question={question}
              value={answer}
              choices={answerChoices}
              onChange={setAnswer}
            />
            <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">
              Choose one option — add your explanation below.
            </p>
          </>
        ) : inputMode === "number" ? (
          <input
            id="answer"
            type="number"
            required
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder={getAnswerPlaceholder(question)}
            className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-base outline-none focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-zinc-500"
          />
        ) : (
          <textarea
            id="answer"
            required
            rows={3}
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder={getAnswerPlaceholder(question)}
            className="w-full resize-none rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-base outline-none focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-zinc-500"
          />
        )}
      </div>

      <div>
        <label
          htmlFor="reasoning"
          className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Why do you think that?{" "}
          <span className="font-normal text-zinc-400">
            {reasoningRequired ? "(required for Other)" : "(optional)"}
          </span>
        </label>
        <textarea
          id="reasoning"
          rows={3}
          required={reasoningRequired}
          value={reasoning}
          onChange={(e) => setReasoning(e.target.value)}
          placeholder="Explain your reasoning…"
          className="w-full resize-none rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-base outline-none focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-zinc-500"
        />
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className={`w-full rounded-xl px-4 py-3 text-sm font-bold transition-colors disabled:opacity-50 ${speciesStyle.cta}`}
      >
        {isPending ? (
          <Spinner label="Submitting…" />
        ) : usesCrowdStep ? (
          "Continue"
        ) : (
          "Submit answer"
        )}
      </button>
    </form>
  );
}
