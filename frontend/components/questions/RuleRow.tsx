"use client";

import { useEffect } from "react";
import { Edit3, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import styles from "./BranchingRulesPanel.module.css";
import { RuleFormFields } from "./RuleFormFields";
import type { BranchingRule, BranchingRuleFormFields, BranchingRuleQuestion } from "@/types/rule";

type RuleRowProps = {
  rule: BranchingRule;
  editing: boolean;
  editFields: BranchingRuleFormFields;
  editSaving: boolean;
  editValidationError: string | null;
  editSaveError: string | null;
  surveyQuestions: BranchingRuleQuestion[];
  branchQuestions: BranchingRuleQuestion[];
  onEdit: () => void;
  onDelete: () => void;
  onEditChange: (fields: BranchingRuleFormFields) => void;
  onEditSave: () => void;
  onEditCancel: () => void;
};

export function RuleRow({
  rule,
  editing,
  editFields,
  editSaving,
  editValidationError,
  editSaveError,
  surveyQuestions,
  branchQuestions,
  onEdit,
  onDelete,
  onEditChange,
  onEditSave,
  onEditCancel
}: RuleRowProps) {
  useEffect(() => {
    if (editing) {
      document.getElementById(`edit-rule-${rule.id}-source`)?.focus();
    }
  }, [editing, rule.id]);

  if (editing) {
    return (
      <tr className={styles.editRow}>
        <td colSpan={4}>
          <RuleFormFields
            idPrefix={`edit-rule-${rule.id}`}
            fields={editFields}
            surveyQuestions={surveyQuestions}
            branchQuestions={branchQuestions}
            disabled={editSaving}
            onChange={onEditChange}
          />
          <div className={styles.formActions}>
            <Button type="button" variant="ghost" size="sm" disabled={editSaving} onClick={onEditCancel}>
              Cancel
            </Button>
            <Button type="button" size="sm" loading={editSaving} onClick={onEditSave}>
              Save
            </Button>
          </div>
          {editValidationError ? <p className={styles.errorText}>{editValidationError}</p> : null}
          {editSaveError ? <p className={styles.errorText}>{editSaveError}</p> : null}
        </td>
      </tr>
    );
  }

  return (
    <tr>
      <td className={styles.colSource} data-label="Source">
        <code className={styles.codeChip}>{rule.sourceQuestionName}</code>
      </td>
      <td className={styles.colTrigger} data-label="If answer is">
        <span className={styles.triggerPill}>{rule.triggerValue}</span>
      </td>
      <td className={styles.colTarget} data-label="Target">
        <code className={styles.codeChip}>{rule.targetQuestionName}</code>
      </td>
      <td className={styles.colActions} data-label="Actions">
        <div className={styles.rowActions}>
          <button
            type="button"
            className={styles.iconButton}
            aria-label={`Edit rule: ${rule.sourceQuestionName} → ${rule.triggerValue}`}
            onClick={onEdit}
          >
            <Edit3 className="h-4 w-4" />
          </button>
          <button
            type="button"
            className={`${styles.iconButton} ${styles.iconButtonDanger}`}
            aria-label={`Delete rule: ${rule.sourceQuestionName} → ${rule.triggerValue}`}
            onClick={onDelete}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}
