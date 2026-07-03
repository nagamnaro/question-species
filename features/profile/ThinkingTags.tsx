import type { ThinkingTag } from "./thinking-tags";

interface ThinkingTagsProps {
  tags: ThinkingTag[];
}

export function ThinkingTags({ tags }: ThinkingTagsProps) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
        Thinking tags
      </h2>
      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
        Derived from answer patterns across question species.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {tags.map((tag) => (
          <span
            key={tag.label}
            title={tag.description}
            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${tag.className}`}
          >
            {tag.label}
          </span>
        ))}
      </div>

      <ul className="mt-4 space-y-2">
        {tags.map((tag) => (
          <li
            key={`${tag.label}-detail`}
            className="text-sm text-zinc-600 dark:text-zinc-400"
          >
            <span className="font-medium text-zinc-800 dark:text-zinc-200">
              {tag.label}
            </span>
            {" — "}
            {tag.description}
          </li>
        ))}
      </ul>
    </div>
  );
}
