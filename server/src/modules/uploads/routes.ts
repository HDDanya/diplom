import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import { createWriteStream } from "node:fs";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { env } from "../../config/env";

const uploadRoot = path.resolve(process.cwd(), "uploads", "comics");

const mimeToExtension: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif"
};

const generateImageSchema = z.object({
  prompt: z.string().min(10).max(1000),
  size: z.enum(["1024x1024", "1024x1536", "1536x1024"]).optional().default("1536x1024")
});

export const uploadsRoutes: FastifyPluginAsync = async (app) => {
  await fs.mkdir(uploadRoot, { recursive: true });

  app.post("/image", { preHandler: [app.authenticate] }, async (request, reply) => {
    const file = await request.file();

    if (!file) {
      return reply.badRequest("Файл не передан");
    }

    const extension = mimeToExtension[file.mimetype];
    if (!extension) {
      file.file.resume();
      return reply.badRequest("Поддерживаются только JPEG, PNG, WEBP и GIF");
    }

    const filename = `${Date.now()}-${randomUUID()}.${extension}`;
    const destination = path.join(uploadRoot, filename);

    await pipeline(file.file, createWriteStream(destination));

    return {
      url: `/uploads/comics/${filename}`,
      filename,
      mimetype: file.mimetype
    };
  });

  app.post("/generate", { preHandler: [app.authenticate] }, async (request, reply) => {
    const payload = generateImageSchema.parse(request.body);

    if (!env.OPENAI_API_KEY) {
      return reply.badRequest("OPENAI_API_KEY не задан. Добавьте ключ в .env и перезапустите сервер.");
    }

    const generationResponse = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-image-1",
        prompt: payload.prompt,
        size: payload.size
      })
    });

    if (!generationResponse.ok) {
      const errorText = await generationResponse.text();
      request.log.error({ errorText }, "OpenAI image generation failed");
      return reply.badRequest("Не удалось сгенерировать изображение по prompt.");
    }

    const data = (await generationResponse.json()) as { data?: Array<{ b64_json?: string }> };
    const base64Image = data.data?.[0]?.b64_json;

    if (!base64Image) {
      return reply.badRequest("Сервис генерации не вернул изображение.");
    }

    const filename = `${Date.now()}-${randomUUID()}.png`;
    const destination = path.join(uploadRoot, filename);
    await fs.writeFile(destination, Buffer.from(base64Image, "base64"));

    return {
      url: `/uploads/comics/${filename}`,
      filename,
      mimetype: "image/png"
    };
  });
};
