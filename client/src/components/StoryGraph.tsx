import { Badge, Group, Paper, Stack, Text } from "@mantine/core";
import { IconArrowNarrowRight, IconGripVertical } from "@tabler/icons-react";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

type StoryGraphPage = {
  pageKey: string;
  title: string;
  isStart: boolean;
  choices: Array<{
    label: string;
    targetPageKey: string;
  }>;
};

type Point = {
  x: number;
  y: number;
};

const NODE_WIDTH = 190;
const NODE_HEIGHT = 92;
const COLUMN_GAP = 42;
const ROW_GAP = 54;
const CANVAS_PADDING = 28;

function defaultPoint(index: number): Point {
  return {
    x: CANVAS_PADDING + (index % 4) * (NODE_WIDTH + COLUMN_GAP),
    y: CANVAS_PADDING + Math.floor(index / 4) * (NODE_HEIGHT + ROW_GAP)
  };
}

export function StoryGraph({
  pages,
  onSelect
}: {
  pages: StoryGraphPage[];
  onSelect?: (pageKey: string) => void;
}) {
  const [positions, setPositions] = useState<Record<string, Point>>({});

  useEffect(() => {
    setPositions((current) =>
      Object.fromEntries(
        pages.map((page, index) => [page.pageKey, current[page.pageKey] ?? defaultPoint(index)])
      )
    );
  }, [pages]);

  const canvasHeight = Math.max(
    420,
    CANVAS_PADDING * 2 + Math.ceil(Math.max(pages.length, 1) / 4) * (NODE_HEIGHT + ROW_GAP)
  );
  const canvasWidth = CANVAS_PADDING * 2 + 4 * NODE_WIDTH + 3 * COLUMN_GAP;

  const edges = useMemo(
    () =>
      pages.flatMap((page) =>
        page.choices
          .filter((choice) => positions[page.pageKey] && positions[choice.targetPageKey])
          .map((choice, index) => ({
            id: `${page.pageKey}-${choice.targetPageKey}-${index}`,
            label: choice.label,
            from: positions[page.pageKey],
            to: positions[choice.targetPageKey]
          }))
      ),
    [pages, positions]
  );

  return (
    <Stack gap="xs">
      <Group justify="space-between">
        <Text size="sm" c="dimmed">
          Перетаскивайте узлы, чтобы разложить ветки перед защитой или редактированием.
        </Text>
        <Badge color="dark" variant="outline">
          {pages.length} узлов, {edges.length} переходов
        </Badge>
      </Group>

      <div className="story-graph-scroll">
        <div className="story-graph-canvas" style={{ width: canvasWidth, height: canvasHeight }}>
          <svg className="story-graph-lines" width={canvasWidth} height={canvasHeight} aria-hidden="true">
            <defs>
              <marker id="story-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#202020" />
              </marker>
            </defs>
            {edges.map((edge) => {
              const fromX = edge.from.x + NODE_WIDTH;
              const fromY = edge.from.y + NODE_HEIGHT / 2;
              const toX = edge.to.x;
              const toY = edge.to.y + NODE_HEIGHT / 2;
              const bend = Math.max(28, Math.abs(toX - fromX) / 2);
              const path = `M ${fromX} ${fromY} C ${fromX + bend} ${fromY}, ${toX - bend} ${toY}, ${toX} ${toY}`;
              return <path key={edge.id} d={path} fill="none" stroke="#202020" strokeWidth="2" markerEnd="url(#story-arrow)" />;
            })}
          </svg>

          {pages.map((page, index) => {
            const position = positions[page.pageKey] ?? defaultPoint(index);
            return (
              <motion.div
                key={page.pageKey}
                className="story-graph-node"
                style={{ left: position.x, top: position.y }}
                drag
                dragMomentum={false}
                dragElastic={0}
                onDragEnd={(_, info) => {
                  setPositions((current) => ({
                    ...current,
                    [page.pageKey]: {
                      x: Math.max(CANVAS_PADDING, Math.min(position.x + info.offset.x, canvasWidth - NODE_WIDTH - CANVAS_PADDING)),
                      y: Math.max(CANVAS_PADDING, Math.min(position.y + info.offset.y, canvasHeight - NODE_HEIGHT - CANVAS_PADDING))
                    }
                  }));
                }}
                whileDrag={{ scale: 1.03, zIndex: 4 }}
              >
                <Paper
                  withBorder
                  p="sm"
                  className="story-graph-node-paper"
                  onClick={() => onSelect?.(page.pageKey)}
                >
                  <Group justify="space-between" gap={6} wrap="nowrap">
                    <Group gap={5} wrap="nowrap">
                      <IconGripVertical size={14} aria-hidden="true" />
                      <Text size="xs" fw={800} lineClamp={1}>
                        {page.title || page.pageKey}
                      </Text>
                    </Group>
                    {page.isStart && <Badge size="xs" color="dark">Старт</Badge>}
                  </Group>
                  <Text size="xs" c="dimmed" lineClamp={1}>
                    {page.pageKey}
                  </Text>
                  <Group gap={4} mt={5}>
                    <IconArrowNarrowRight size={13} />
                    <Text size="xs">{page.choices.length} перехода</Text>
                  </Group>
                </Paper>
              </motion.div>
            );
          })}
        </div>
      </div>
    </Stack>
  );
}
