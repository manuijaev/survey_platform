"use client";

import { ChevronDown, ChevronRight, GitBranch, ScrollText } from "lucide-react";
import { cn } from "@/lib/utils";
import styles from "./QuestionManagementSidebar.module.css";

export type QuestionManagementSection = "questions" | "branching";
export type QuestionTab = "source" | "target";

type QuestionManagementSidebarProps = {
  activeSection: QuestionManagementSection;
  questionTab: QuestionTab;
  onSectionChange: (section: QuestionManagementSection) => void;
  onQuestionTabChange: (tab: QuestionTab) => void;
};

export function QuestionManagementSidebar({
  activeSection,
  questionTab,
  onSectionChange,
  onQuestionTabChange
}: QuestionManagementSidebarProps) {
  const questionsExpanded = activeSection === "questions";

  return (
    <nav className={styles.sidebar} aria-label="Question management sections">
      <button
        type="button"
        className={cn(styles.item, questionsExpanded && styles.itemActive)}
        aria-expanded={questionsExpanded}
        onClick={() => onSectionChange("questions")}
      >
        <ScrollText className="h-4 w-4" />
        <span>Questions</span>
        {questionsExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </button>

      {questionsExpanded ? (
        <div className={styles.subItems}>
          <button
            type="button"
            className={cn(styles.subItem, questionTab === "source" && styles.subItemActive)}
            onClick={() => {
              onSectionChange("questions");
              onQuestionTabChange("source");
            }}
          >
            Source questions
          </button>
          <button
            type="button"
            className={cn(styles.subItem, questionTab === "target" && styles.subItemActive)}
            onClick={() => {
              onSectionChange("questions");
              onQuestionTabChange("target");
            }}
          >
            Target questions
          </button>
        </div>
      ) : null}

      <button
        type="button"
        className={cn(styles.item, activeSection === "branching" && styles.itemActive)}
        onClick={() => onSectionChange("branching")}
      >
        <GitBranch className="h-4 w-4" />
        <span>Branching rules</span>
      </button>
    </nav>
  );
}
