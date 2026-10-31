import { describe, expect, test } from "bun:test";

import { limitRequestBody } from "./request-body";

const post = (body: BodyInit, headers?: HeadersInit) => new Request("https://fsx.example/api/trpc/x", { method: "POST", body, headers });

describe("limitRequestBody", () => {
  test("passes requests without a body", async () => {
    const request = new Request("https://fsx.example/api/trpc/x");
    expect(await limitRequestBody(request, 10)).toBe(request);
  });

  test("rejects a declared length over the limit", async () => {
    expect(await limitRequestBody(post("x".repeat(20)), 10)).toBeNull();
  });

  test("rejects a nonsense Content-Length", async () => {
    expect(await limitRequestBody(post("x", { "Content-Length": "abc" }), 10)).toBeNull();
  });

  test("accepts a body within the limit", async () => {
    expect(await (await limitRequestBody(post("hello"), 10))?.text()).toBe("hello");
  });

  test("counts a body that has no Content-Length", async () => {
    const stream = (text: string) =>
      new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(text));
          controller.close();
        },
      });
    const chunked = (text: string) => new Request("https://fsx.example/x", { method: "POST", body: stream(text), duplex: "half" } as RequestInit);

    const ok = await limitRequestBody(chunked("hello"), 10);
    expect(await ok?.text()).toBe("hello");
    expect(await limitRequestBody(chunked("x".repeat(50)), 10)).toBeNull();
  });
});
