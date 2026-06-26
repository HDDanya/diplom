const imageSignatures: Array<{
  mimetype: string;
  extension: string;
  matches: (buffer: Buffer) => boolean;
}> = [
  {
    mimetype: "image/jpeg",
    extension: "jpg",
    matches: (buffer) => buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff
  },
  {
    mimetype: "image/png",
    extension: "png",
    matches: (buffer) =>
      buffer.length >= 8 &&
      buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  },
  {
    mimetype: "image/gif",
    extension: "gif",
    matches: (buffer) => {
      const header = buffer.subarray(0, 6).toString("ascii");
      return header === "GIF87a" || header === "GIF89a";
    }
  },
  {
    mimetype: "image/webp",
    extension: "webp",
    matches: (buffer) =>
      buffer.length >= 12 &&
      buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
      buffer.subarray(8, 12).toString("ascii") === "WEBP"
  }
];

export function detectImageType(buffer: Buffer) {
  return imageSignatures.find((signature) => signature.matches(buffer)) ?? null;
}

export type OpenAIImageError = {
  message?: string;
  code?: string;
  type?: string;
  moderation_details?: {
    moderation_stage?: "input" | "output" | "unknown";
    categories?: string[];
  };
};

export function isModerationBlocked(error?: OpenAIImageError | null) {
  return (
    error?.code === "moderation_blocked" ||
    /safety system|safety requirements|content policy/i.test(error?.message ?? "")
  );
}

export function buildSafetyAdjustedPrompt(prompt: string) {
  const source = prompt.toLowerCase();
  const theme =
    /space|planet|cosmic|rocket|orbit|star|sci-fi|science fiction|косм|планет|ракет|орбит/.test(source)
      ? "retro science-fiction"
      : /noir|detective|mystery|city|нуар|детектив|город/.test(source)
        ? "noir mystery"
        : /fantasy|magic|castle|dragon|фэнтези|маг|замок/.test(source)
          ? "fantasy adventure"
          : "graphic adventure";

  return [
    `Create an original family-friendly ${theme} comic illustration.`,
    "Show fictional adult characters in a dramatic but non-violent moment.",
    "Use expressive poses, cinematic framing, detailed environment, bold ink lines and vintage halftone print texture.",
    "All characters are fully clothed and calm; the scene is suitable for a general audience.",
    "Do not include readable text, logos, real people, or existing named characters."
  ].join(" ");
}

export function normalizeOpenAIError(
  status: number,
  rawMessage?: string,
  options?: {
    code?: string;
    requestId?: string | null;
    moderationStage?: string;
    moderationCategories?: string[];
  }
) {
  const detail = rawMessage?.trim().replace(/\s+/g, " ").slice(0, 240);
  const requestSuffix = options?.requestId ? ` Request ID: ${options.requestId}.` : "";

  if (status === 401) {
    return {
      statusCode: 401,
      code: "OPENAI_INVALID_KEY",
      message: "OpenAI отклонил API-ключ. Проверьте OPENAI_API_KEY и перезапустите сервер."
    };
  }

  if (status === 403) {
    const accessDenied =
      !detail ||
      /access|permission|not available|not enabled|organization verification|verify your organization|verified organization|project/i.test(
        detail
      );

    if (!accessDenied) {
      return {
        statusCode: 403,
        code: "OPENAI_FORBIDDEN",
        message: `OpenAI отклонил запрос генерации: ${detail}${requestSuffix}`
      };
    }

    return {
      statusCode: 403,
      code: "OPENAI_ACCESS_DENIED",
      message: detail
        ? `OpenAI отказал в доступе к модели изображений: ${detail}${requestSuffix}`
        : "У проекта OpenAI нет доступа к модели изображений. Проверьте права проекта и верификацию организации."
    };
  }

  if (status === 429) {
    return {
      statusCode: 429,
      code: "OPENAI_QUOTA",
      message: "OpenAI временно ограничил запрос или исчерпана квота проекта. Проверьте Billing и Limits."
    };
  }

  if (options?.code === "moderation_blocked" || /safety system|safety requirements|content policy/i.test(detail ?? "")) {
    const stageHint =
      options?.moderationStage === "output"
        ? "Сгенерированный результат не прошёл проверку."
        : "Prompt не прошёл проверку.";
    const categoryHint = options?.moderationCategories?.length
      ? ` Категория: ${options.moderationCategories.join(", ")}.`
      : "";

    return {
      statusCode: 400,
      code: "OPENAI_SAFETY_BLOCKED",
      message:
        `${stageHint} Уберите реальные имена, оскорбления и откровенно жестокие или взрослые детали.${categoryHint}${requestSuffix}`.trim()
    };
  }

  return {
    statusCode: 502,
    code: "OPENAI_GENERATION_FAILED",
    message: detail ? `OpenAI не создал изображение: ${detail}${requestSuffix}` : `OpenAI не создал изображение.${requestSuffix}`
  };
}
