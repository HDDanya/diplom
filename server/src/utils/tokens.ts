import { FastifyInstance } from "fastify";
import { env } from "../config/env";

export async function issueAuthTokens(app: FastifyInstance, userId: string, email: string) {
  const payload = { userId, email };

  const accessToken = app.jwt.sign(payload, {
    expiresIn: env.ACCESS_TOKEN_TTL,
    key: env.JWT_ACCESS_SECRET
  });

  const refreshToken = app.jwt.sign(payload, {
    expiresIn: env.REFRESH_TOKEN_TTL,
    key: env.JWT_REFRESH_SECRET
  });

  return { accessToken, refreshToken };
}
