import { describe, expect, it } from "vitest";
import {
  createTransitionVariants,
  TRANSITIONS,
  TRANSITION_LABELS,
  transitionClassName
} from "./transitions";

describe("comic transitions", () => {
  it("provides 20 animated transitions and a no-animation option", () => {
    const animated = TRANSITIONS.filter((transition) => transition !== "NONE");
    expect(animated).toHaveLength(20);
    expect(new Set(TRANSITIONS).size).toBe(TRANSITIONS.length);
  });

  it("provides labels, variants and CSS class names for every transition", () => {
    for (const transition of TRANSITIONS) {
      expect(TRANSITION_LABELS[transition]).toBeTruthy();
      expect(createTransitionVariants(transition, 1)).toEqual(
        expect.objectContaining({
          initial: expect.any(Object),
          animate: expect.any(Object),
          exit: expect.any(Object)
        })
      );
      expect(transitionClassName(transition)).toMatch(/^comic-canvas--/);
    }
  });
});
