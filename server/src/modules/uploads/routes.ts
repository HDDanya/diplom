import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { env } from "../../config/env";
import { createRateLimit } from "../../utils/rate-limit";
import {
  buildSafetyAdjustedPrompt,
  detectImageType,
  isModerationBlocked,
  normalizeOpenAIError,
  OpenAIImageError
} from "./image-utils";

const uploadRoot = path.resolve(process.cwd(), "uploads", "comics");

const generateImageSchema = z.object({
  prompt: z.string().min(10).max(1000),
  size: z.enum(["1024x1024", "1024x1536", "1536x1024"]).optional().default("1536x1024"),
  count: z.number().int().min(1).max(4).optional().default(1)
});

export const uploadsRoutes: FastifyPluginAsync = async (app) => {
  await fs.mkdir(uploadRoot, { recursive: true });

  const uploadRateLimit = createRateLimit({
    max: 30,
    windowMs: 60_000,
    keyPrefix: "uploads",
    key: (request) => request.authUser?.userId ?? request.ip
  });
  const generationRateLimit = createRateLimit({
    max: 6,
    windowMs: 60_000,
    keyPrefix: "generation",
    key: (request) => request.authUser?.userId ?? request.ip
  });

  app.get("/generate/status", { preHandler: [app.authenticate] }, async () => ({
    configured: Boolean(env.OPENAI_API_KEY),
    model: env.OPENAI_IMAGE_MODEL
  }));

  app.post("/image", { preHandler: [app.authenticate, uploadRateLimit] }, async (request, reply) => {
    const file = await request.file();

    if (!file) {
      return reply.badRequest("Файл не передан");
    }

    const buffer = await file.toBuffer();
    const detectedType = detectImageType(buffer);
    if (!detectedType || detectedType.mimetype !== file.mimetype) {
      return reply.badRequest("Содержимое файла не соответствует JPEG, PNG, WEBP или GIF.");
    }

    const filename = `${Date.now()}-${randomUUID()}.${detectedType.extension}`;
    const destination = path.join(uploadRoot, filename);
    await fs.writeFile(destination, buffer, { flag: "wx" });

    return {
      url: `/uploads/comics/${filename}`,
      filename,
      mimetype: detectedType.mimetype
    };
  });

  app.post("/generate", { preHandler: [app.authenticate, generationRateLimit] }, async (request, reply) => {
    const payload = generateImageSchema.parse(request.body);

    if (!env.OPENAI_API_KEY) {
      return reply.code(503).send({
        message: "OPENAI_API_KEY не задан. Добавьте ключ в корневой .env и перезапустите сервер.",
        code: "OPENAI_NOT_CONFIGURED"
      });
    }

    const requestGeneration = async (prompt: string) =>
      fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: env.OPENAI_IMAGE_MODEL,
          prompt,
          size: payload.size,
          quality: env.OPENAI_IMAGE_QUALITY,
          moderation: env.OPENAI_IMAGE_MODERATION,
          n: payload.count
        }),
        signal: AbortSignal.timeout(env.OPENAI_TIMEOUT_MS)
      });

    let generationResponse: Response;
    let safetyAdjusted = false;
    let usedPrompt = payload.prompt;
    try {
      generationResponse = await requestGeneration(payload.prompt);
    } catch (error) {
      request.log.error({ error }, "OpenAI image generation request failed");
      return reply.code(504).send({
        message: "OpenAI не ответил вовремя. Проверьте сеть и повторите запрос.",
        code: "OPENAI_TIMEOUT"
      });
    }

    if (!generationResponse.ok) {
      const errorPayload = (await generationResponse.json().catch(() => null)) as
        | { error?: OpenAIImageError }
        | null;
      const firstRequestId = generationResponse.headers.get("x-request-id");

      if (isModerationBlocked(errorPayload?.error)) {
        safetyAdjusted = true;
        usedPrompt = buildSafetyAdjustedPrompt(payload.prompt);
        request.log.warn(
          {
            requestId: firstRequestId,
            moderationStage: errorPayload?.error?.moderation_details?.moderation_stage,
            moderationCategories: errorPayload?.error?.moderation_details?.categories
          },
          "OpenAI blocked image prompt; retrying with a safety-adjusted prompt"
        );

        try {
          generationResponse = await requestGeneration(usedPrompt);
        } catch (error) {
          request.log.error({ error }, "OpenAI safety-adjusted image generation request failed");
          return reply.code(504).send({
            message: "OpenAI не ответил на безопасный повторный запрос. Повторите позже.",
            code: "OPENAI_TIMEOUT"
          });
        }
      }

      if (!generationResponse.ok) {
        const finalErrorPayload =
          safetyAdjusted
            ? ((await generationResponse.json().catch(() => null)) as { error?: OpenAIImageError } | null)
            : errorPayload;
        const requestId = generationResponse.headers.get("x-request-id") ?? firstRequestId;
        const normalized = normalizeOpenAIError(generationResponse.status, finalErrorPayload?.error?.message, {
          code: finalErrorPayload?.error?.code,
          requestId,
          moderationStage: finalErrorPayload?.error?.moderation_details?.moderation_stage,
          moderationCategories: finalErrorPayload?.error?.moderation_details?.categories
        });
        request.log.error(
          {
            status: generationResponse.status,
            code: finalErrorPayload?.error?.code,
            requestId,
            safetyAdjusted
          },
          "OpenAI image generation failed"
        );
        return reply.code(normalized.statusCode).send({
          message: normalized.message,
          code: normalized.code,
          requestId,
          safetyAdjusted
        });
      }

      request.log.info(
        {
          originalRequestId: firstRequestId,
          retryRequestId: generationResponse.headers.get("x-request-id")
        },
        "OpenAI safety-adjusted image generation succeeded"
      );
    }

    const data = (await generationResponse.json()) as {
      data?: Array<{ b64_json?: string; url?: string; revised_prompt?: string }>;
    };
    const generatedItems = data.data ?? [];
    if (generatedItems.length === 0) {
      return reply.code(502).send({
        message: "OpenAI ответил успешно, но не вернул изображение.",
        code: "OPENAI_EMPTY_RESPONSE"
      });
    }

    const images = [];
    for (const item of generatedItems.slice(0, payload.count)) {
      let buffer: Buffer | null = item.b64_json ? Buffer.from(item.b64_json, "base64") : null;
      if (!buffer && item.url) {
        const imageResponse = await fetch(item.url, {
          signal: AbortSignal.timeout(env.OPENAI_TIMEOUT_MS)
        });
        if (imageResponse.ok) {
          buffer = Buffer.from(await imageResponse.arrayBuffer());
        }
      }

      if (!buffer || buffer.length === 0) {
        continue;
      }

      const detectedType = detectImageType(buffer);
      const extension = detectedType?.extension ?? "png";
      const mimetype = detectedType?.mimetype ?? "image/png";
      const filename = `${Date.now()}-${randomUUID()}.${extension}`;
      await fs.writeFile(path.join(uploadRoot, filename), buffer, { flag: "wx" });
      images.push({
        url: `/uploads/comics/${filename}`,
        filename,
        mimetype,
        revisedPrompt: item.revised_prompt
      });
    }

    if (images.length === 0) {
      return reply.code(502).send({
        message: "Не удалось сохранить изображение, полученное от OpenAI.",
        code: "OPENAI_INVALID_IMAGE"
      });
    }

    return {
      ...images[0],
      images,
      safetyAdjusted,
      usedPrompt: safetyAdjusted ? usedPrompt : undefined
    };
  });
};
