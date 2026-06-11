import type { Question } from "@/types/question";
import type { BranchingRule } from "@/types/rule";

export type FlowNodeKind = "start" | "survey" | "target" | "end";

export type FlowNode = {
  id: string;
  name: string;
  title: string;
  titleLines: string[];
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
  labelLines: string[];
  kind: FlowEdgeKind;
};

export type BranchFlowLayout = {
  nodes: FlowNode[];
  edges: FlowEdge[];
  width: number;
  height: number;
};

const NODE_W = 240;
const LINE_HEIGHT = 15;
const PAD_Y = 12;
const SUBTITLE_H = 16;
const SMALL_H = 40;
const V_GAP = 28;
const BRANCH_V_GAP = 12;
const MAIN_X = 40;
const BRANCH_X = 340;
const PADDING = 24;
const MAX_TITLE_LINES = 3;
const MAX_LABEL_LINES = 2;

function questionName(question: Question): string {
  return question.slug ?? question.id;
}

export function wrapFlowText(text: string, maxCharsPerLine: number, maxLines: number): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [""];

  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= maxCharsPerLine) {
      current = candidate;
      continue;
    }

    if (current) {
      lines.push(current);
      current = word;
    } else {
      lines.push(`${word.slice(0, maxCharsPerLine - 1)}…`);
      current = "";
    }

    if (lines.length >= maxLines) break;
  }

  if (lines.length < maxLines && current) {
    lines.push(current.length > maxCharsPerLine ? `${current.slice(0, maxCharsPerLine - 1)}…` : current);
  }

  if (lines.length > maxLines) {
    const trimmed = lines.slice(0, maxLines);
    const last = trimmed[maxLines - 1];
    trimmed[maxLines - 1] = last.endsWith("…") ? last : `${last.slice(0, maxCharsPerLine - 1)}…`;
    return trimmed;
  }

  return lines.length > 0 ? lines : [""];
}

function nodeHeight(titleLines: string[], hasSubtitle: boolean): number {
  const titleBlock = titleLines.length * LINE_HEIGHT;
  const subtitleBlock = hasSubtitle ? SUBTITLE_H : 0;
  return Math.max(SMALL_H, PAD_Y * 2 + titleBlock + subtitleBlock);
}

function buildNodeTitle(question: Question | undefined, fallback: string): { titleLines: string[]; subtitle?: string } {
  const titleLines = wrapFlowText(question?.text ?? fallback, 34, MAX_TITLE_LINES);
  const subtitle = question ? questionName(question) : fallback;
  return { titleLines, subtitle };
}

function buildEdgeLabel(rules: BranchingRule[]): string[] {
  if (rules.length === 0) return [];
  const combined =
    rules.length === 1
      ? rules[0].triggerValue
      : rules.map((rule) => rule.triggerValue).join(" · ");
  return wrapFlowText(combined, 22, MAX_LABEL_LINES);
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
    titleLines: ["Survey start"],
    kind: "start",
    x: MAIN_X,
    y: cursorY,
    width: NODE_W,
    height: SMALL_H
  });

  cursorY += SMALL_H + V_GAP;

  surveyFlow.forEach((question, index) => {
    const name = questionName(question);
    const inboundRules = rulesBySource.get(name) ?? [];
    const uniqueTargets = [...new Set(inboundRules.map((rule) => rule.targetQuestionName))];

    const { titleLines, subtitle } = buildNodeTitle(question, name);
    const surveyHeight = nodeHeight(titleLines, true);

    const branchHeights = uniqueTargets.map((targetName) => {
      const targetQuestion = targetByName.get(targetName);
      const targetTitle = buildNodeTitle(targetQuestion, targetName);
      return nodeHeight(targetTitle.titleLines, true);
    });

    const branchBlockHeight =
      branchHeights.length > 0
        ? branchHeights.reduce((sum, h, i) => sum + h + (i > 0 ? BRANCH_V_GAP : 0), 0)
        : 0;
    const rowHeight = Math.max(surveyHeight, branchBlockHeight);

    nodes.push({
      id: `survey:${name}`,
      name,
      title: question.text,
      titleLines,
      subtitle,
      kind: "survey",
      x: MAIN_X,
      y: cursorY + (rowHeight - surveyHeight) / 2,
      width: NODE_W,
      height: surveyHeight
    });

    const sourceCenterY = cursorY + rowHeight / 2;
    let branchCursorY = sourceCenterY - branchBlockHeight / 2;

    uniqueTargets.forEach((targetName, targetIndex) => {
      const targetQuestion = targetByName.get(targetName);
      const matchingRules = inboundRules.filter((rule) => rule.targetQuestionName === targetName);
      const targetTitle = buildNodeTitle(targetQuestion, targetName);
      const targetHeight = branchHeights[targetIndex] ?? nodeHeight(targetTitle.titleLines, true);
      const targetId = `target:${targetName}`;

      if (!targetNodes.has(targetName)) {
        const targetNode: FlowNode = {
          id: targetId,
          name: targetName,
          title: targetQuestion?.text ?? targetName,
          titleLines: targetTitle.titleLines,
          subtitle: targetName,
          kind: "target",
          x: BRANCH_X,
          y: branchCursorY,
          width: NODE_W,
          height: targetHeight
        };
        targetNodes.set(targetName, targetNode);
        nodes.push(targetNode);
      }

      edges.push({
        id: `branch:${name}:${targetName}:${targetIndex}`,
        from: `survey:${name}`,
        to: targetId,
        label: matchingRules.map((rule) => rule.triggerValue).join(" · "),
        labelLines: buildEdgeLabel(matchingRules),
        kind: "branch"
      });

      branchCursorY += targetHeight + BRANCH_V_GAP;
    });

    const previousId = index === 0 ? "__start__" : `survey:${questionName(surveyFlow[index - 1])}`;
    edges.push({
      id: `sequence:${previousId}:survey:${name}`,
      from: previousId,
      to: `survey:${name}`,
      labelLines: [],
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
    titleLines: ["Survey complete"],
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
    labelLines: [],
    kind: "sequence"
  });

  const orphanTargets = [...targetByName.entries()].filter(([name]) => !targetNodes.has(name));

  if (orphanTargets.length > 0) {
    cursorY += V_GAP;
    orphanTargets.forEach(([name, question]) => {
      const targetTitle = buildNodeTitle(question, name);
      const height = nodeHeight(targetTitle.titleLines, true);
      nodes.push({
        id: `target:${name}`,
        name,
        title: question.text,
        titleLines: targetTitle.titleLines,
        subtitle: `${name} (unlinked)`,
        kind: "target",
        x: BRANCH_X,
        y: cursorY,
        width: NODE_W,
        height
      });
      cursorY += height + BRANCH_V_GAP;
    });
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
  return { path, labelX: midX, labelY: (start.y + end.y) / 2 - 10 };
}
