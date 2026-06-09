"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import styles from "./BranchingRulesPanel.module.css";
import { RuleFormFields } from "./RuleFormFields";
import type { BranchingRuleFormFields, BranchingRuleQuestion } from "@/types/rule";

type RuleCreateFormProps = {
  fields: BranchingRuleFormFields;
  surveyQuestions: BranchingRuleQuestion[];
  branchQuestions: BranchingRuleQuestion[];
  saving: boolean;
  validationError: string | null;
  saveError: string | null;
  onChange: (fields: BranchingRuleFormFields) => void;
  onSave: () => void;
  onCancel: () => void;
};

export function RuleCreateForm({
  fields,
  surveyQuestions,
  branchQuestions,
  saving,
  validationError,
  saveError,
  onChange,
  onSave,
  onCancel
}: RuleCreateFormProps) {
  useEffect(() => {
    document.getElementById("create-rule-source")?.focus();
  }, []);

  return (
    <div id="create-rule-form" role="form" aria-label="Add branching rule" className={styles.formCard}>
      <RuleFormFields
        idPrefix="create-rule"
        fields={fields}
        surveyQuestions={surveyQuestions}
        branchQuestions={branchQuestions}
        disabled={saving}
        onChange={onChange}
      />
      <div className={styles.formActions}>
        <Button type="button" variant="ghost" size="sm" disabled={saving} onClick={onCancel}>
          Cancel
        </Button>
        <Button type="button" size="sm" loading={saving} onClick={onSave}>
          Save
        </Button>
      </div>
      {validationError ? <p className={styles.errorText}>{validationError}</p> : null}
      {saveError ? <p className={styles.errorText}>{saveError}</p> : null}
    </div>
  );
}
