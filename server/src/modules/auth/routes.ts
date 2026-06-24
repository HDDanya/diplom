import { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { env } from "../../config/env";
import { createRateLimit } from "../../utils/rate-limit";
import { hashPassword, verifyPassword } from "../../utils/password";
import { issueAuthTokens } from "../../utils/tokens";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
  displayName: z.string().min(2).max(40)
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100)
});

const refreshSchema = z.object({
  refreshToken: z.string().min(10)
});

export const authRoutes: FastifyPluginAsync = async (app) => {
  const registerRateLimit = createRateLimit({
    max: 5,
    windowMs: 15 * 60_000,
    keyPrefix: "register"
  });
  const loginRateLimit = createRateLimit({
    max: 10,
    windowMs: 15 * 60_000,
    keyPrefix: "login"
  });
  const refreshRateLimit = createRateLimit({
    max: 30,
    windowMs: 15 * 60_000,
    keyPrefix: "refresh"
  });

  app.post("/register", { preHandler: [registerRateLimit] }, async (request, reply) => {
    const payload = registerSchema.parse(request.body);

    const existing = await app.prisma.user.findUnique({ where: { email: payload.email } });
    if (existing) {
      return reply.conflict("Пользователь с таким email уже существует");
    }

    const user = await app.prisma.user.create({
      data: {
        email: payload.email,
        passwordHash: await hashPassword(payload.password),
        displayName: payload.displayName
      }
    });

    const tokens = await issueAuthTokens(app, user.id, user.email);

    return reply.code(201).send({
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        bio: user.bio,
        avatarUrl: user.avatarUrl
      },
      ...tokens
    });
  });

  app.post("/login", { preHandler: [loginRateLimit] }, async (request, reply) => {
    const payload = loginSchema.parse(request.body);

    const user = await app.prisma.user.findUnique({ where: { email: payload.email } });
    if (!user) {
      return reply.unauthorized("Неверный email или пароль");
    }

    const isValidPassword = await verifyPassword(payload.password, user.passwordHash);
    if (!isValidPassword) {
      return reply.unauthorized("Неверный email или пароль");
    }

    const tokens = await issueAuthTokens(app, user.id, user.email);

    return {
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        bio: user.bio,
        avatarUrl: user.avatarUrl
      },
      ...tokens
    };
  });

  app.post("/refresh", { preHandler: [refreshRateLimit] }, async (request, reply) => {
    const { refreshToken } = refreshSchema.parse(request.body);

    try {
      const payload = await app.jwt.verify<{ userId: string; email: string }>(refreshToken, {
        key: env.JWT_REFRESH_SECRET
      });

      const tokens = await issueAuthTokens(app, payload.userId, payload.email);
      return tokens;
    } catch {
      return reply.unauthorized("Refresh token недействителен");
    }
  });

  app.get("/me", { preHandler: [app.authenticate] }, async (request) => {
    const user = await app.prisma.user.findUnique({
      where: { id: request.authUser.userId },
      select: {
        id: true,
        email: true,
        displayName: true,
        bio: true,
        avatarUrl: true,
        createdAt: true
      }
    });

    return { user };
  });
};
