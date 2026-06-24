import { FastifyReply, FastifyRequest } from "fastify";
import { describe, expect, it } from "vitest";
import { createRateLimit } from "./rate-limit";

function createReplyMock() {
  const state = {
    headers: {} as Record<string, string>,
    statusCode: 200,
    payload: null as unknown
  };

  const reply = {
    header(name: string, value: string) {
      state.headers[name] = value;
      return reply;
    },
    code(statusCode: number) {
      state.statusCode = statusCode;
      return reply;
    },
    send(payload: unknown) {
      state.payload = payload;
      return reply;
    }
  };

  return { reply: reply as unknown as FastifyReply, state };
}

describe("rate limiting", () => {
  it("allows requests within the limit and rejects the next one", async () => {
    const limiter = createRateLimit({
      max: 2,
      windowMs: 60_000,
      keyPrefix: "test"
    });
    const request = { ip: "127.0.0.1" } as FastifyRequest;

    const first = createReplyMock();
    await limiter(request, first.reply);
    expect(first.state.statusCode).toBe(200);
    expect(first.state.headers["x-ratelimit-remaining"]).toBe("1");

    const second = createReplyMock();
    await limiter(request, second.reply);
    expect(second.state.statusCode).toBe(200);

    const third = createReplyMock();
    await limiter(request, third.reply);
    expect(third.state.statusCode).toBe(429);
    expect(third.state.payload).toMatchObject({ code: "RATE_LIMITED" });
  });
});
