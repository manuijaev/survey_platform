"use client";

import type { Survey } from "@/types/survey";

export function SurveySelector({
  surveys,
  value,
  onChange,
  id = "survey-selector",
  placeholder = "Select a survey…",
  className
}: {
  surveys: Survey[];
  value?: string;
  onChange: (surveyId: string) => void;
  id?: string;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={className ?? "flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center"}>
      <label className="text-sm font-medium text-[color:var(--text-secondary)]" htmlFor={id}>
        Survey
      </label>
      <select
        id={id}
        value={value ?? ""}
        onChange={(event) => {
          const nextId = event.target.value;
          if (nextId) onChange(nextId);
        }}
        className="focus-ring h-11 w-full min-w-0 rounded-xl border border-[color:var(--border)] bg-[color:var(--bg-surface)] px-4 text-sm text-[color:var(--text-primary)] sm:min-w-[240px] sm:w-auto"
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {surveys.map((survey) => (
          <option key={survey.id} value={survey.id}>
            {survey.name}
          </option>
        ))}
      </select>
    </div>
  );
}
