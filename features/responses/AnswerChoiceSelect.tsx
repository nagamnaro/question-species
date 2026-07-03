import { getSelectPlaceholder } from "./answer-input";
import type { Question } from "@/types";

interface AnswerChoiceSelectProps {
  question: Pick<Question, "species" | "text">;
  id?: string;
  value: string;
  choices: string[];
  onChange: (value: string) => void;
}

export function AnswerChoiceSelect({
  question,
  id = "answer",
  value,
  choices,
  onChange,
}: AnswerChoiceSelectProps) {
  return (
    <select
      id={id}
      required
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-base outline-none focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-zinc-500"
    >
      <option value="" disabled>
        {getSelectPlaceholder(question)}
      </option>
      {choices.map((choice) => (
        <option key={choice} value={choice}>
          {choice}
        </option>
      ))}
    </select>
  );
}
