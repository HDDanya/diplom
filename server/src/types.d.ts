import "@fastify/jwt";
import "@fastify/multipart";

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: {
      userId: string;
      email: string;
    };
    user: {
      userId: string;
      email: string;
    };
  }
}
