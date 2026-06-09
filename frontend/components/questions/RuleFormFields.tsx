"use client";

import styles from "./BranchingRulesPanel.module.css";
import {
  formatQuestionOptionLabel,
  getTriggerChoices
} from "@/services/branchingRulesService";
import type { BranchingRuleFormFields, BranchingRuleQuestion } from "@/types/rule";

type RuleFormFieldsProps = {
  idPrefix: string;
  fields: BranchingRuleFormFields;
  surveyQuestions: BranchingRuleQuestion[];
  branchQuestions: BranchingRuleQuestion[];
  disabled?: boolean;
  onChange: (fields: BranchingRuleFormFields) => void;
};

export function RuleFormFields({
  idPrefix,
  fields,
  surveyQuestions,
  branchQuestions,
  disabled,
  onChange
}: RuleFormFieldsProps) {
  const selectedSource = surveyQuestions.find((question) => question.name === fields.sourceQuestionName);
  const triggerChoices = getTriggerChoices(selectedSource);
  const triggerOptions =
    fields.triggerValue &&
    triggerChoices.length > 0 &&
    !triggerChoices.some((option) => option.value === fields.triggerValue)
      ? [...triggerChoices, { value: fields.triggerValue, label: fields.triggerValue }]
      : triggerChoices;
  const triggerSelectId = idPrefix === "create-rule" ? "create-rule-trigger" : `${idPrefix}-trigger`;

  const handleSourceChange = (sourceQuestionName: string) => {
    const nextSource = surveyQuestions.find((question) => question.name === sourceQuestionName);
    const nextChoices = getTriggerChoices(nextSource);
    const triggerStillValid = nextChoices.some((option) => option.value === fields.triggerValue);

    onChange({
      ...fields,
      sourceQuestionName,
      triggerValue: triggerStillValid ? fields.triggerValue : ""
    });
  };

  return (
    <div className={styles.formGrid}>
      <div className={styles.field}>
        <label className={styles.label} htmlFor={`${idPrefix}-source`}>
          Source question
        </label>
        <select
          id={idPrefix === "create-rule" ? "create-rule-source" : `${idPrefix}-source`}
          className={styles.select}
          value={fields.sourceQuestionName}
          disabled={disabled}
          onChange={(event) => handleSourceChange(event.target.value)}
        >
          <option value="" disabled>
            Select source question
          </option>
          {surveyQuestions.map((question) => (
            <option key={question.name} value={question.name}>
              {formatQuestionOptionLabel(question)}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor={triggerSelectId}>
          Trigger value
        </label>
        {!fields.sourceQuestionName ? (
          <div className={styles.warningBox}>Select a source question first.</div>
        ) : triggerOptions.length > 0 ? (
          <>
            <select
              id={triggerSelectId}
              className={styles.select}
              value={fields.triggerValue}
              disabled={disabled}
              onChange={(event) => onChange({ ...fields, triggerValue: event.target.value })}
            >
              <option value="" disabled>
                Select answer value
              </option>
              {triggerOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label} ({option.value})
                </option>
              ))}
            </select>
            <span className={styles.fieldNote}>Options from the selected source question</span>
          </>
        ) : (
          <>
            <input
              id={triggerSelectId}
              type="text"
              className={styles.input}
              value={fields.triggerValue}
              disabled={disabled}
              placeholder="Enter exact answer value"
              onChange={(event) => onChange({ ...fields, triggerValue: event.target.value })}
            />
            <span className={styles.fieldNote}>
              This question has no choice options — enter the exact value to match.
            </span>
          </>
        )}
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor={`${idPrefix}-target`}>
          Target question
        </label>
        {branchQuestions.length === 0 ? (
          <div className={styles.warningBox}>
            ⚠ No target questions yet. Go to Questions → Target questions to create one first.
          </div>
        ) : (
          <>
            <select
              id={`${idPrefix}-target`}
              className={styles.select}
              value={fields.targetQuestionName}
              disabled={disabled}
              onChange={(event) => onChange({ ...fields, targetQuestionName: event.target.value })}
            >
              <option value="" disabled>
                Select target question
              </option>
              {branchQuestions.map((question) => (
                <option key={question.name} value={question.name}>
                  {formatQuestionOptionLabel(question)}
                </option>
              ))}
            </select>
            <span className={styles.fieldNote}>Custom questions from the Target questions tab</span>
          </>
        )}
      </div>
    </div>
  );
}
