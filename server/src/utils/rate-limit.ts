import { FastifyReply, FastifyRequest } from "fastify";

type RateLimitOptions = {
  max: number;
  windowMs: number;
  keyPrefix: string;
  key?: (request: FastifyRequest) => string;
};

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

export function createRateLimit(options: RateLimitOptions) {
  const entries = new Map<string, RateLimitEntry>();

  return async function rateLimit(request: FastifyRequest, reply: FastifyReply) {
    const now = Date.now();
    const identity = options.key?.(request) ?? request.ip;
    const entryKey = `${options.keyPrefix}:${identity}`;
    const current = entries.get(entryKey);
    const entry = !current || current.resetAt <= now ? { count: 0, resetAt: now + options.windowMs } : current;

    entry.count += 1;
    entries.set(entryKey, entry);

    const remaining = Math.max(options.max - entry.count, 0);
    reply.header("x-ratelimit-limit", String(options.max));
    reply.header("x-ratelimit-remaining", String(remaining));
    reply.header("x-ratelimit-reset", String(Math.ceil(entry.resetAt / 1000)));

    if (entries.size > 2_000) {
      for (const [key, value] of entries) {
        if (value.resetAt <= now) {
          entries.delete(key);
        }
      }
    }

    if (entry.count > options.max) {
      const retryAfter = Math.max(Math.ceil((entry.resetAt - now) / 1000), 1);
      reply.header("retry-after", String(retryAfter));
      return reply.code(429).send({
        message: `Слишком много запросов. Повторите через ${retryAfter} сек.`,
        code: "RATE_LIMITED"
      });
    }
  };
}
