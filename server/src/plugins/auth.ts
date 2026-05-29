import fp from "fastify-plugin";
import { FastifyReply, FastifyRequest } from "fastify";

declare module "fastify" {
  interface FastifyRequest {
    authUser: {
      userId: string;
      email: string;
    };
  }

  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

export const authPlugin = fp(async (app) => {
  app.decorate("authenticate", async (request, reply) => {
    try {
      await request.jwtVerify<{ userId: string; email: string }>();
      request.authUser = {
        userId: request.user.userId,
        email: request.user.email
      };
    } catch {
      reply.unauthorized("Требуется авторизация");
    }
  });
});
