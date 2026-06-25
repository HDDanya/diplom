import jwt from "@fastify/jwt";
import { PrismaClient } from "@prisma/client";
import Fastify from "fastify";
import { Page } from "@playwright/test";
import { env } from "../server/src/config/env";
import { issueAuthTokens } from "../server/src/utils/tokens";

export async function installAuthorSession(page: Page) {
  const prisma = new PrismaClient();
  const app = Fastify({ logger: false });

  try {
    const user = await prisma.user.findUniqueOrThrow({
      where: { email: "author@inkflow.app" },
      select: {
        id: true,
        email: true,
        displayName: true,
        bio: true,
        avatarUrl: true
      }
    });

    await app.register(jwt, { secret: env.JWT_ACCESS_SECRET });
    const tokens = await issueAuthTokens(app, user.id, user.email);
    const session = { user, ...tokens };

    await page.addInitScript((authSession) => {
      window.localStorage.setItem("inkflow-auth", JSON.stringify(authSession));
    }, session);
  } finally {
    await app.close();
    await prisma.$disconnect();
  }
}
