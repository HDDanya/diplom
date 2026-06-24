import { MantineProvider } from "@mantine/core";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { StoryGraph } from "./StoryGraph";

describe("StoryGraph", () => {
  it("renders nodes, transition count and selects a node", async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();

    render(
      <MantineProvider>
        <StoryGraph
          pages={[
            {
              pageKey: "start",
              title: "Начало",
              isStart: true,
              choices: [{ label: "Вперёд", targetPageKey: "finish" }]
            },
            {
              pageKey: "finish",
              title: "Финал",
              isStart: false,
              choices: []
            }
          ]}
          onSelect={onSelect}
        />
      </MantineProvider>
    );

    expect(screen.getByText("2 узлов, 1 переходов")).toBeInTheDocument();
    await user.click(screen.getByText("Начало"));
    expect(onSelect).toHaveBeenCalledWith("start");
  });
});
