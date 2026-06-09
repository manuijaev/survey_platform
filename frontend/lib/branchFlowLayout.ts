import type { Question } from "@/types/question";
import type { BranchingRule } from "@/types/rule";

export type FlowNodeKind = "start" | "survey" | "target" | "end";

export type FlowNode = {
  id: string;
  name: string;
  title: string;
  subtitle?: string;
  kind: FlowNodeKind;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type FlowEdgeKind = "sequence" | "branch";

export type FlowEdge = {
  id: string;
  from: string;
  to: string;
  label?: string;
  kind: FlowEdgeKind;
};

export type BranchFlowLayout = {
  nodes: FlowNode[];
  edges: FlowEdge[];
  width: number;
  height: number;
};

const NODE_W = 220;
const NODE_H = 64;
const SMALL_H = 40;
const V_GAP = 28;
const BRANCH_V_GAP = 12;
const MAIN_X = 40;
const BRANCH_X = 320;
const PADDING = 24;

function questionName(question: Question): string {
  return question.slug ?? question.id;
}

function truncate(text: string, max = 42): string {
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1)}…`;
}

export function buildBranchFlowLayout(questions: Question[], rules: BranchingRule[]): BranchFlowLayout {
  const surveyFlow = [...questions]
    .filter((question) => !question.branchOnly)
    .sort((left, right) => (left.order ?? 0) - (right.order ?? 0));

  const targetByName = new Map(
    questions.filter((question) => question.branchOnly).map((question) => [questionName(question), question])
  );

  const rulesBySource = new Map<string, BranchingRule[]>();
  for (const rule of rules) {
    const bucket = rulesBySource.get(rule.sourceQuestionName) ?? [];
    bucket.push(rule);
    rulesBySource.set(rule.sourceQuestionName, bucket);
  }

  const nodes: FlowNode[] = [];
  const edges: FlowEdge[] = [];
  const targetNodes = new Map<string, FlowNode>();

  let cursorY = PADDING;

  nodes.push({
    id: "__start__",
    name: "start",
    title: "Survey start",
    kind: "start",
    x: MAIN_X,
    y: cursorY,
    width: NODE_W,
    height: SMALL_H
  });

  cursorY += SMALL_H + V_GAP;

  const surveyPositions = new Map<string, number>();

  surveyFlow.forEach((question, index) => {
    const name = questionName(question);
    const inboundRules = rulesBySource.get(name) ?? [];
    const uniqueTargets = [...new Set(inboundRules.map((rule) => rule.targetQuestionName))];
    const branchBlockHeight = Math.max(
      NODE_H,
      uniqueTargets.length * NODE_H + Math.max(0, uniqueTargets.length - 1) * BRANCH_V_GAP
    );
    const rowHeight = Math.max(NODE_H, branchBlockHeight);

    surveyPositions.set(name, cursorY);

    nodes.push({
      id: `survey:${name}`,
      name,
      title: truncate(question.text),
      subtitle: name,
      kind: "survey",
      x: MAIN_X,
      y: cursorY + (rowHeight - NODE_H) / 2,
      width: NODE_W,
      height: NODE_H
    });

    const sourceCenterY = cursorY + rowHeight / 2;
    const targetStartY = sourceCenterY - branchBlockHeight / 2;

    uniqueTargets.forEach((targetName, targetIndex) => {
      const targetQuestion = targetByName.get(targetName);
      const matchingRules = inboundRules.filter((rule) => rule.targetQuestionName === targetName);
      const triggerLabel =
        matchingRules.length === 1
          ? matchingRules[0].triggerValue
          : matchingRules.map((rule) => rule.triggerValue).join(" / ");

      const targetY = targetStartY + targetIndex * (NODE_H + BRANCH_V_GAP);
      const targetId = `target:${targetName}`;

      if (!targetNodes.has(targetName)) {
        const targetNode: FlowNode = {
          id: targetId,
          name: targetName,
          title: truncate(targetQuestion?.text ?? targetName),
          subtitle: targetName,
          kind: "target",
          x: BRANCH_X,
          y: targetY,
          width: NODE_W,
          height: NODE_H
        };
        targetNodes.set(targetName, targetNode);
        nodes.push(targetNode);
      }

      edges.push({
        id: `branch:${name}:${targetName}:${targetIndex}`,
        from: `survey:${name}`,
        to: targetId,
        label: triggerLabel,
        kind: "branch"
      });
    });

    const previousId = index === 0 ? "__start__" : `survey:${questionName(surveyFlow[index - 1])}`;
    edges.push({
      id: `sequence:${previousId}:survey:${name}`,
      from: previousId,
      to: `survey:${name}`,
      kind: "sequence"
    });

    cursorY += rowHeight + V_GAP;
  });

  const lastMainId =
    surveyFlow.length > 0 ? `survey:${questionName(surveyFlow[surveyFlow.length - 1])}` : "__start__";

  nodes.push({
    id: "__end__",
    name: "end",
    title: "Survey complete",
    kind: "end",
    x: MAIN_X,
    y: cursorY,
    width: NODE_W,
    height: SMALL_H
  });

  edges.push({
    id: `sequence:${lastMainId}:__end__`,
    from: lastMainId,
    to: "__end__",
    kind: "sequence"
  });

  const orphanTargets = [...targetByName.entries()].filter(([name]) => !targetNodes.has(name));

  if (orphanTargets.length > 0) {
    cursorY += V_GAP;
    orphanTargets.forEach(([name, question], index) => {
      nodes.push({
        id: `target:${name}`,
        name,
        title: truncate(question.text),
        subtitle: `${name} (unlinked)`,
        kind: "target",
        x: BRANCH_X,
        y: cursorY + index * (NODE_H + BRANCH_V_GAP),
        width: NODE_W,
        height: NODE_H
      });
    });
    cursorY += orphanTargets.length * (NODE_H + BRANCH_V_GAP);
  }

  const maxNodeBottom = nodes.reduce((max, node) => Math.max(max, node.y + node.height), 0);
  const width = BRANCH_X + NODE_W + PADDING;
  const height = Math.max(maxNodeBottom + PADDING, PADDING * 2 + SMALL_H);

  return { nodes, edges, width, height };
}

export function getNodeCenter(node: FlowNode): { x: number; y: number } {
  return { x: node.x + node.width / 2, y: node.y + node.height / 2 };
}

export function buildEdgePath(
  from: FlowNode,
  to: FlowNode,
  kind: FlowEdgeKind
): { path: string; labelX: number; labelY: number } {
  const start = getNodeCenter(from);
  const end = getNodeCenter(to);

  if (kind === "sequence") {
    const path = `M ${start.x} ${from.y + from.height} L ${end.x} ${to.y}`;
    return { path, labelX: start.x, labelY: (from.y + from.height + to.y) / 2 };
  }

  const startX = from.x + from.width;
  const endX = to.x;
  const midX = (startX + endX) / 2;
  const path = `M ${startX} ${start.y} C ${midX} ${start.y}, ${midX} ${end.y}, ${endX} ${end.y}`;
  return { path, labelX: midX, labelY: (start.y + end.y) / 2 - 8 };
}
