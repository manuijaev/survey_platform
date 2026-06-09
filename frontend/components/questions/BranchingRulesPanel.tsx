"use client";

import { useCallback, useEffect, useState } from "react";
import { GitBranch, Info, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import styles from "./BranchingRulesPanel.module.css";
import { BranchFlowDiagram } from "./BranchFlowDiagram";
import { RuleCreateForm } from "./RuleCreateForm";
import { RuleDeleteConfirm } from "./RuleDeleteConfirm";
import { RuleRow } from "./RuleRow";
import { surveyApi } from "@/lib/api";
import type { Question } from "@/types/question";
import {
  createRule,
  deleteRule,
  fetchBranchQuestions,
  fetchRules,
  fetchSurveyQuestions,
  formatApiError,
  updateRule,
  validateRuleFields
} from "@/services/branchingRulesService";
import type { BranchingRule, BranchingRuleFormFields, BranchingRuleQuestion } from "@/types/rule";

const emptyFields: BranchingRuleFormFields = {
  sourceQuestionName: "",
  triggerValue: "",
  targetQuestionName: ""
};

type BranchingRulesPanelProps = {
  surveyId: string | number;
  surveyName?: string;
};

export function BranchingRulesPanel({ surveyId, surveyName }: BranchingRulesPanelProps) {
  const [rules, setRules] = useState<BranchingRule[]>([]);
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [surveyQuestions, setSurveyQuestions] = useState<BranchingRuleQuestion[]>([]);
  const [branchQuestions, setBranchQuestions] = useState<BranchingRuleQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createFields, setCreateFields] = useState<BranchingRuleFormFields>(emptyFields);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createValidationError, setCreateValidationError] = useState<string | null>(null);
  const [createSaving, setCreateSaving] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFields, setEditFields] = useState<BranchingRuleFormFields>(emptyFields);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editValidationError, setEditValidationError] = useState<string | null>(null);

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const clearAllOperations = useCallback(() => {
    setShowCreateForm(false);
    setEditingId(null);
    setDeletingId(null);
    setCreateError(null);
    setCreateValidationError(null);
    setEditError(null);
    setEditValidationError(null);
    setDeleteError(null);
  }, []);

  const loadData = useCallback(async () => {
    if (!surveyId) return;
    setLoading(true);
    setError(null);
    try {
      const [rulesData, questionsData, surveyQData, branchQData] = await Promise.all([
        fetchRules(surveyId),
        surveyApi.getQuestions(String(surveyId)),
        fetchSurveyQuestions(surveyId),
        fetchBranchQuestions(surveyId)
      ]);
      setRules(rulesData);
      setAllQuestions(questionsData);
      setSurveyQuestions(surveyQData);
      setBranchQuestions(branchQData);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setLoading(false);
    }
  }, [surveyId]);

  useEffect(() => {
    void loadData();
  }, [loadData, reloadToken]);

  useEffect(() => {
    const refreshOnFocus = () => {
      if (document.visibilityState === "visible") {
        void loadData();
      }
    };
    window.addEventListener("focus", refreshOnFocus);
    document.addEventListener("visibilitychange", refreshOnFocus);
    return () => {
      window.removeEventListener("focus", refreshOnFocus);
      document.removeEventListener("visibilitychange", refreshOnFocus);
    };
  }, [loadData]);

  const handleOpenCreate = () => {
    clearAllOperations();
    setCreateFields(emptyFields);
    setShowCreateForm(true);
  };

  const handleOpenEdit = (rule: BranchingRule) => {
    clearAllOperations();
    setEditingId(rule.id);
    setEditFields({
      sourceQuestionName: rule.sourceQuestionName,
      triggerValue: rule.triggerValue,
      targetQuestionName: rule.targetQuestionName
    });
  };

  const handleOpenDelete = (rule: BranchingRule) => {
    clearAllOperations();
    setDeletingId(rule.id);
  };

  const handleCreateSave = async () => {
    const validation = validateRuleFields({
      ...createFields,
      triggerValue: createFields.triggerValue.trim()
    });
    if (validation) {
      setCreateValidationError(validation);
      return;
    }

    setCreateValidationError(null);
    setCreateError(null);
    setCreateSaving(true);
    try {
      const created = await createRule(surveyId, {
        ...createFields,
        triggerValue: createFields.triggerValue.trim()
      });
      setRules((current) => [created, ...current]);
      setShowCreateForm(false);
      setCreateFields(emptyFields);
      void loadData();
    } catch (err) {
      setCreateError(formatApiError(err));
    } finally {
      setCreateSaving(false);
    }
  };

  const handleEditSave = async () => {
    if (!editingId) return;
    const validation = validateRuleFields({
      ...editFields,
      triggerValue: editFields.triggerValue.trim()
    });
    if (validation) {
      setEditValidationError(validation);
      return;
    }

    setEditValidationError(null);
    setEditError(null);
    setEditSaving(true);
    try {
      const updated = await updateRule(surveyId, editingId, {
        ...editFields,
        triggerValue: editFields.triggerValue.trim()
      });
      setRules((current) => current.map((rule) => (rule.id === editingId ? updated : rule)));
      setEditingId(null);
      setEditFields(emptyFields);
      void loadData();
    } catch (err) {
      setEditError(formatApiError(err));
    } finally {
      setEditSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;
    setDeleteError(null);
    setDeleteLoading(true);
    try {
      await deleteRule(surveyId, deletingId);
      setRules((current) => current.filter((rule) => rule.id !== deletingId));
      setDeletingId(null);
      void loadData();
    } catch (err) {
      setDeleteError(formatApiError(err));
    } finally {
      setDeleteLoading(false);
    }
  };

  const pendingDeleteRule = deletingId ? rules.find((rule) => rule.id === deletingId) : null;

  if (loading) {
    return (
      <div className={styles.panel}>
        <div className={styles.header}>
          <div className={styles.headerTitle}>
            <GitBranch className="h-5 w-5" />
            Branching rules
          </div>
        </div>
        <div className={styles.skeletonRow} />
        <div className={styles.skeletonRow} />
        <div className={styles.skeletonRow} />
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.panel}>
        <div className={styles.loadError}>
          <p className={styles.emptyTitle}>Could not load rules</p>
          <p className={styles.errorText}>{error}</p>
          <Button type="button" size="sm" onClick={() => setReloadToken((value) => value + 1)}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <GitBranch className="h-5 w-5" />
          Branching rules
          {surveyName ? <span className={styles.surveyPill}>{surveyName}</span> : null}
        </div>
        <Button
          type="button"
          size="sm"
          leftIcon={<Plus className="h-4 w-4" />}
          aria-expanded={showCreateForm}
          aria-controls="create-rule-form"
          onClick={handleOpenCreate}
        >
          Add rule
        </Button>
      </div>

      <div className={styles.infoBanner}>
        <Info className={`h-4 w-4 ${styles.infoIcon}`} aria-hidden />
        <div>
          Source questions come from the Source questions tab. Create custom target questions in the Target
          questions tab, then link them here with a trigger value.
        </div>
      </div>

      <BranchFlowDiagram questions={allQuestions} rules={rules} surveyName={surveyName} />

      {showCreateForm ? (
        <RuleCreateForm
          fields={createFields}
          surveyQuestions={surveyQuestions}
          branchQuestions={branchQuestions}
          saving={createSaving}
          validationError={createValidationError}
          saveError={createError}
          onChange={setCreateFields}
          onSave={() => void handleCreateSave()}
          onCancel={() => {
            setShowCreateForm(false);
            setCreateFields(emptyFields);
            setCreateError(null);
            setCreateValidationError(null);
          }}
        />
      ) : null}

      {pendingDeleteRule ? (
        <RuleDeleteConfirm
          rule={pendingDeleteRule}
          loading={deleteLoading}
          error={deleteError}
          onCancel={() => {
            setDeletingId(null);
            setDeleteError(null);
          }}
          onConfirm={() => void handleDeleteConfirm()}
        />
      ) : null}

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.colSource}>Source question</th>
              <th className={styles.colTrigger}>If answer is</th>
              <th className={styles.colTarget}>Show target question</th>
              <th className={styles.colActions}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rules.length === 0 ? (
              <tr className={styles.emptyRow}>
                <td colSpan={4}>
                  <div className={styles.emptyState}>
                    <GitBranch className="h-6 w-6" aria-hidden />
                    <p className={styles.emptyTitle}>No branching rules yet.</p>
                    <p>Add a rule above to start building adaptive survey paths.</p>
                  </div>
                </td>
              </tr>
            ) : (
              rules.map((rule) => (
                <RuleRow
                  key={rule.id}
                  rule={rule}
                  editing={editingId === rule.id}
                  editFields={editFields}
                  editSaving={editSaving}
                  editValidationError={editValidationError}
                  editSaveError={editError}
                  surveyQuestions={surveyQuestions}
                  branchQuestions={branchQuestions}
                  onEdit={() => handleOpenEdit(rule)}
                  onDelete={() => handleOpenDelete(rule)}
                  onEditChange={setEditFields}
                  onEditSave={() => void handleEditSave()}
                  onEditCancel={() => {
                    setEditingId(null);
                    setEditFields(emptyFields);
                    setEditError(null);
                    setEditValidationError(null);
                  }}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
