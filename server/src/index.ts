import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import jwt from "@fastify/jwt";
import multipart from "@fastify/multipart";
import sensible from "@fastify/sensible";
import fastifyStatic from "@fastify/static";
import Fastify from "fastify";
import fs from "node:fs/promises";
import path from "node:path";
import { ZodError } from "zod";
import { env } from "./config/env";
import { authRoutes } from "./modules/auth/routes";
import { comicsRoutes } from "./modules/comics/routes";
import { uploadsRoutes } from "./modules/uploads/routes";
import { authPlugin } from "./plugins/auth";
import { prismaPlugin } from "./plugins/prisma";

export async function buildServer() {
  const app = Fastify({
    logger: true,
    bodyLimit: 1024 * 1024,
    requestTimeout: 30_000
  });

  await app.register(sensible);
  await app.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        connectSrc: ["'self'"]
      }
    },
    crossOriginResourcePolicy: { policy: "cross-origin" }
  });
  await app.register(cors, {
    origin: env.CLIENT_ORIGIN,
    credentials: true
  });

  await app.register(jwt, { secret: env.JWT_ACCESS_SECRET });
  await app.register(multipart, {
    limits: {
      fileSize: 8 * 1024 * 1024,
      files: 1
    }
  });

  const uploadsRoot = path.resolve(process.cwd(), "uploads");
  await fs.mkdir(uploadsRoot, { recursive: true });
  await app.register(fastifyStatic, {
    root: uploadsRoot,
    prefix: "/uploads/",
    decorateReply: false
  });

  await app.register(prismaPlugin);
  await app.register(authPlugin);

  const metrics = {
    requests: 0,
    errors: 0,
    totalDurationMs: 0
  };
  const requestStartedAt = new WeakMap<object, number>();

  app.addHook("onRequest", async (request, reply) => {
    requestStartedAt.set(request, performance.now());
    reply.header("x-request-id", request.id);
  });

  app.addHook("onResponse", async (request, reply) => {
    const startedAt = requestStartedAt.get(request) ?? performance.now();
    const durationMs = performance.now() - startedAt;
    metrics.requests += 1;
    metrics.totalDurationMs += durationMs;
    if (reply.statusCode >= 500) {
      metrics.errors += 1;
    }
    request.log.info({ durationMs: Number(durationMs.toFixed(1)), statusCode: reply.statusCode }, "request completed");
  });

  app.get("/api/health", async () => ({
    status: "ok",
    aiConfigured: Boolean(env.OPENAI_API_KEY),
    imageModel: env.OPENAI_IMAGE_MODEL,
    uptimeSeconds: Math.round(process.uptime())
  }));

  app.get("/api/metrics", async () => ({
    requests: metrics.requests,
    errors: metrics.errors,
    averageDurationMs:
      metrics.requests === 0 ? 0 : Number((metrics.totalDurationMs / metrics.requests).toFixed(1))
  }));

  await app.register(authRoutes, { prefix: "/api/auth" });
  await app.register(uploadsRoutes, { prefix: "/api/uploads" });
  await app.register(comicsRoutes, { prefix: "/api/comics" });

  app.setErrorHandler((error: any, request, reply) => {
    if (error instanceof ZodError) {
      return reply.badRequest(error.issues.map((issue) => issue.message).join("; "));
    }

    request.log.error(error);
    return reply.code(error.statusCode ?? 500).send({
      message: error.message ?? "Внутренняя ошибка сервера"
    });
  });

  return app;
}

async function start() {
  const app = await buildServer();
  try {
    await app.listen({ port: env.PORT, host: "0.0.0.0" });
  } catch (error: unknown) {
    app.log.error(error);
    process.exit(1);
  }
}

if (require.main === module) {
  void start();
}
