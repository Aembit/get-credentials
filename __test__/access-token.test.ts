import * as core from "@actions/core";
import { HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { v4 as uuidv4 } from "uuid";
import { afterAll, afterEach, beforeAll, describe, it, vi } from "vitest";
import {
  edgeApiAuthHandler,
  edgeApiGetCredentialsHandlerResponse400,
  edgeApiGetCredentialsHandlerResponse500,
} from "../gen";
import { getAccessToken } from "../src/access-token";

vi.mock("@actions/core");

const server = setupServer(edgeApiAuthHandler());

// We validate these values in other functions prior to this call in main, so assume they are correct in these tests.
const reqBody = {
  clientId: `aembit:useast2:a12345:identity:github_idtoken:${uuidv4()}`,
  idToken:
    "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZXN0dXNlcjAxIiwiYXVkIjpbIjEyODk4ODg0NTk2ODYzIl0sImlzcyI6Imh0dHBzOi8vYXV0aGxldGUuY29tIiwiZXhwIjoxNTU5MTA2ODE1LCJpYXQiOjE1NTkwMjA0MTUsIm5vbmNlIjoibi0wUzZfV3pBMk1qIn0.5uSFMTGnubyvtiExHc9l7HT9UsF8a_Qb0STtWzyclBk",
  domain: "aembit.io",
};

describe("getAccessToken", () => {
  beforeAll(() => server.listen());
  afterEach(() => {
    server.resetHandlers();
    vi.clearAllMocks();
  });
  afterAll(() => server.close());

  it("returns a token when called with valid data", async ({ expect }) => {
    server.use(edgeApiAuthHandler({ accessToken: "abcde12345" }));
    const token = await getAccessToken(
      reqBody.clientId,
      reqBody.idToken,
      reqBody.domain,
      "",
    );
    expect(token).toBe("abcde12345");
  });

  it("throws an error when receiving a 400 response", async ({ expect }) => {
    server.use(edgeApiAuthHandler(edgeApiGetCredentialsHandlerResponse400));
    await expect(
      getAccessToken(reqBody.clientId, reqBody.idToken, reqBody.domain, ""),
    ).rejects.toThrowError();
  });

  it("throws an error when receiving a 500 response", async ({ expect }) => {
    server.use(
      edgeApiAuthHandler(() => edgeApiGetCredentialsHandlerResponse500({})),
    );
    await expect(
      getAccessToken(reqBody.clientId, reqBody.idToken, reqBody.domain, ""),
    ).rejects.toThrowError();
  });

  it("throws an error when receiving a response lacking an accessToken", async ({
    expect,
  }) => {
    server.use(edgeApiAuthHandler({ accessToken: undefined }));
    await expect(
      getAccessToken(reqBody.clientId, reqBody.idToken, reqBody.domain, ""),
    ).rejects.toThrowError();
  });

  it("sends Content-Type: application/json header", async ({ expect }) => {
    let capturedHeaders: Headers | null = null;

    server.use(
      edgeApiAuthHandler(async (info) => {
        capturedHeaders = info.request.headers;
        return new Response(
          JSON.stringify({
            accessToken: "test-token-12345",
          }),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json",
            },
          },
        );
      }),
    );

    await getAccessToken(reqBody.clientId, reqBody.idToken, reqBody.domain, "");

    expect((capturedHeaders as unknown as Headers).get("Content-Type")).toBe(
      "application/json",
    );
  });

  it("sends X-Aembit-ResourceSet header when resourceSetId is provided", async ({
    expect,
  }) => {
    let capturedHeaders: Headers | null = null;
    const customResourceSetId = uuidv4();

    server.use(
      edgeApiAuthHandler(async (info) => {
        capturedHeaders = info.request.headers;
        return new Response(
          JSON.stringify({
            accessToken: "test-token-12345",
          }),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json",
            },
          },
        );
      }),
    );

    await getAccessToken(
      reqBody.clientId,
      reqBody.idToken,
      reqBody.domain,
      customResourceSetId,
    );

    expect(
      (capturedHeaders as unknown as Headers).get("X-Aembit-ResourceSet"),
    ).toBe(customResourceSetId);
  });

  it(
    "retries and succeeds when the first attempt throws a network error",
    { timeout: 10000 },
    async ({ expect }) => {
      vi.mocked(core.debug).mockImplementation(() => {});

      let attempt = 0;
      server.use(
        edgeApiAuthHandler(() => {
          attempt++;
          if (attempt === 1) {
            return HttpResponse.error();
          }
          return new Response(
            JSON.stringify({ accessToken: "retried-token" }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          );
        }),
      );

      const token = await getAccessToken(
        reqBody.clientId,
        reqBody.idToken,
        reqBody.domain,
        "",
      );

      expect(token).toBe("retried-token");
      expect(attempt).toBe(2);
    },
  );

  it(
    "throws after exhausting all retry attempts on persistent network errors",
    { timeout: 10000 },
    async ({ expect }) => {
      vi.mocked(core.debug).mockImplementation(() => {});

      server.use(edgeApiAuthHandler(() => HttpResponse.error()));

      await expect(
        getAccessToken(reqBody.clientId, reqBody.idToken, reqBody.domain, ""),
      ).rejects.toThrowError(/Failed to fetch access token after 3 attempts/);
    },
  );
});
