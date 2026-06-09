"use client";

import { useMemo } from "react";
import { GitBranch } from "lucide-react";
import { buildBranchFlowLayout, buildEdgePath } from "@/lib/branchFlowLayout";
import type { Question } from "@/types/question";
import type { BranchingRule } from "@/types/rule";
import styles from "./BranchFlowDiagram.module.css";

type BranchFlowDiagramProps = {
  questions: Question[];
  rules: BranchingRule[];
  surveyName?: string;
};

function nodeClass(kind: string): string {
  switch (kind) {
    case "start":
    case "end":
      return styles.nodeStart;
    case "target":
      return styles.nodeTarget;
    case "survey":
    default:
      return styles.nodeSurvey;
  }
}

export function BranchFlowDiagram({ questions, rules, surveyName }: BranchFlowDiagramProps) {
  const layout = useMemo(() => buildBranchFlowLayout(questions, rules), [questions, rules]);
  const nodeById = useMemo(() => new Map(layout.nodes.map((node) => [node.id, node])), [layout.nodes]);

  const surveyFlowCount = questions.filter((question) => !question.branchOnly).length;

  if (surveyFlowCount === 0) {
    return (
      <div className={styles.wrap}>
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>No survey flow to diagram yet</p>
          <p>Add source questions first, then create branching rules to visualize the path.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <div>
          <div className={styles.title}>Branch flow diagram</div>
          <div className={styles.subtitle}>
            {surveyName ? `${surveyName} · ` : ""}
            Updates when you reorder questions or edit rules
          </div>
        </div>
        <div className={styles.legend} aria-hidden>
          <span className={styles.legendItem}>
            <span className={`${styles.legendSwatch} ${styles.legendSurvey}`} />
            Source flow
          </span>
          <span className={styles.legendItem}>
            <span className={`${styles.legendSwatch} ${styles.legendTarget}`} />
            Branch target
          </span>
          <span className={styles.legendItem}>
            <GitBranch className="h-3.5 w-3.5 text-[color:var(--primary)]" />
            Rule trigger
          </span>
        </div>
      </div>

      <div className={styles.canvas}>
        <svg
          className={styles.svg}
          viewBox={`0 0 ${layout.width} ${layout.height}`}
          role="img"
          aria-label="Survey branching flow diagram"
        >
          <defs>
            <marker
              id="flow-arrow-sequence"
              markerWidth="8"
              markerHeight="8"
              refX="7"
              refY="4"
              orient="auto"
            >
              <path d="M0,0 L8,4 L0,8 Z" fill="rgba(148, 163, 184, 0.75)" />
            </marker>
            <marker
              id="flow-arrow-branch"
              markerWidth="8"
              markerHeight="8"
              refX="7"
              refY="4"
              orient="auto"
            >
              <path d="M0,0 L8,4 L0,8 Z" fill="rgba(45, 212, 191, 0.9)" />
            </marker>
          </defs>

          {layout.edges.map((edge) => {
            const from = nodeById.get(edge.from);
            const to = nodeById.get(edge.to);
            if (!from || !to) return null;

            const { path, labelX, labelY } = buildEdgePath(from, to, edge.kind);
            const isBranch = edge.kind === "branch";

            return (
              <g key={edge.id}>
                <path
                  d={path}
                  className={`${styles.edge} ${isBranch ? styles.edgeBranch : styles.edgeSequence}`}
                  markerEnd={`url(#${isBranch ? "flow-arrow-branch" : "flow-arrow-sequence"})`}
                />
                {edge.label ? (
                  <text x={labelX} y={labelY} textAnchor="middle" className={styles.edgeLabel}>
                    {edge.label}
                  </text>
                ) : null}
              </g>
            );
          })}

          {layout.nodes.map((node) => (
            <g key={node.id} transform={`translate(${node.x}, ${node.y})`}>
              <rect
                width={node.width}
                height={node.height}
                rx={node.kind === "start" || node.kind === "end" ? 999 : 14}
                className={`${styles.nodeRect} ${nodeClass(node.kind)}`}
              />
              <text x={14} y={26} className={styles.nodeTitle}>
                {node.title}
              </text>
              {node.subtitle ? (
                <text x={14} y={44} className={styles.nodeSubtitle}>
                  {node.subtitle}
                </text>
              ) : null}
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}
