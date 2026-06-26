import { describe, expect, it } from "vitest";
import {
  buildSafetyAdjustedPrompt,
  detectImageType,
  isModerationBlocked,
  normalizeOpenAIError
} from "./image-utils";

describe("image upload security", () => {
  it("detects supported image signatures instead of trusting a filename", () => {
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);
    const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xdb]);
    const executable = Buffer.from("MZ fake executable");

    expect(detectImageType(png)).toMatchObject({ mimetype: "image/png", extension: "png" });
    expect(detectImageType(jpeg)).toMatchObject({ mimetype: "image/jpeg", extension: "jpg" });
    expect(detectImageType(executable)).toBeNull();
  });

  it("maps OpenAI auth and quota failures to actionable safe messages", () => {
    expect(normalizeOpenAIError(401).code).toBe("OPENAI_INVALID_KEY");
    expect(normalizeOpenAIError(403).code).toBe("OPENAI_ACCESS_DENIED");
    expect(
      normalizeOpenAIError(403, "Project does not have access to model gpt-image-1.").code
    ).toBe("OPENAI_ACCESS_DENIED");
    expect(
      normalizeOpenAIError(403, "This prompt cannot be used for image generation.", {
        requestId: "req_forbidden"
      })
    ).toMatchObject({
      code: "OPENAI_FORBIDDEN",
      statusCode: 403
    });
    expect(normalizeOpenAIError(429).code).toBe("OPENAI_QUOTA");
    expect(normalizeOpenAIError(500, "provider exploded").message).toContain("provider exploded");
  });

  it("detects moderation blocks and creates a neutral retry prompt", () => {
    expect(isModerationBlocked({ code: "moderation_blocked" })).toBe(true);
    expect(isModerationBlocked({ message: "Your request was rejected by the safety system." })).toBe(true);

    const adjusted = buildSafetyAdjustedPrompt(
      "Batman violently attacks a villain in Gotham with blood and weapons"
    );
    expect(adjusted).toContain("family-friendly");
    expect(adjusted).not.toContain("Batman");
    expect(adjusted).not.toContain("blood");

    expect(
      normalizeOpenAIError(400, "Your request was rejected by the safety system.", {
        code: "moderation_blocked",
        requestId: "req_test"
      })
    ).toMatchObject({
      statusCode: 400,
      code: "OPENAI_SAFETY_BLOCKED"
    });
  });
});
