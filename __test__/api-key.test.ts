import * as core from "@actions/core";
import { setupServer } from "msw/node";
import { v4 as uuidv4 } from "uuid";
import { afterAll, afterEach, beforeAll, describe, it, vi } from "vitest";
import { getApiKey } from "../src/api-key";
import {
  edgeApiGetCredentialsHandler,
  edgeApiGetCredentialsHandlerResponse400,
  edgeApiGetCredentialsHandlerResponse500,
} from "./gen/handlers";

// Mock @actions/core module
vi.mock("@actions/core");

const server = setupServer(edgeApiGetCredentialsHandler());

// We validate these values in other functions prior to this call in main, so assume they are correct in these tests.
const reqBody = {
  clientId: `aembit:useast2:a12345:identity:github_idtoken:${uuidv4()}`,
  identityToken:
    "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZXN0dXNlcjAxIiwiYXVkIjpbIjEyODk4ODg0NTk2ODYzIl0sImlzcyI6Imh0dHBzOi8vYXV0aGxldGUuY29tIiwiZXhwIjoxNTU5MTA2ODE1LCJpYXQiOjE1NTkwMjA0MTUsIm5vbmNlIjoibi0wUzZfV3pBMk1qIn0.5uSFMTGnubyvtiExHc9l7HT9UsF8a_Qb0STtWzyclBk",
  accessToken: "test-access-token-12345",
  domain: "aembit.io",
  serverHost: "api.example.com",
  serverPort: "443",
};

describe("getApiKey", () => {
  beforeAll(() => server.listen());
  afterEach(() => {
    server.resetHandlers();
    vi.clearAllMocks();
  });
  afterAll(() => server.close());

  it("returns an API key when called with valid data", async ({ expect }) => {
    vi.mocked(core.info).mockImplementation(() => {});
    vi.mocked(core.setSecret).mockImplementation(() => {});

    server.use(
      edgeApiGetCredentialsHandler({
        credentialType: "ApiKey",
        expiresAt: "2024-12-31T23:59:59Z",
        data: {
          apiKey: "test-api-key-67890",
        },
      }),
    );

    const apiKey = await getApiKey(
      reqBody.clientId,
      reqBody.identityToken,
      reqBody.accessToken,
      reqBody.domain,
      reqBody.serverHost,
      reqBody.serverPort,
    );

    expect(apiKey).toBe("test-api-key-67890");
    expect(core.info).toHaveBeenCalledWith(
      "Fetch API Key (url): https://a12345.ec.aembit.io/edge/v1/credentials",
    );
    expect(core.info).toHaveBeenCalledWith("Response status: 200");
    expect(core.setSecret).toHaveBeenCalledWith("test-api-key-67890");
  });

  it("throws an error when receiving a 400 response", async ({ expect }) => {
    vi.mocked(core.info).mockImplementation(() => {});

    server.use(
      edgeApiGetCredentialsHandler(edgeApiGetCredentialsHandlerResponse400),
    );

    await expect(
      getApiKey(
        reqBody.clientId,
        reqBody.identityToken,
        reqBody.accessToken,
        reqBody.domain,
        reqBody.serverHost,
        reqBody.serverPort,
      ),
    ).rejects.toThrowError(/Failed to fetch access token/);
  });

  it("throws an error when receiving a 500 response", async ({ expect }) => {
    vi.mocked(core.info).mockImplementation(() => {});

    server.use(
      edgeApiGetCredentialsHandler(() =>
        edgeApiGetCredentialsHandlerResponse500({}),
      ),
    );

    await expect(
      getApiKey(
        reqBody.clientId,
        reqBody.identityToken,
        reqBody.accessToken,
        reqBody.domain,
        reqBody.serverHost,
        reqBody.serverPort,
      ),
    ).rejects.toThrowError(/Failed to fetch access token/);
  });

  it("throws an error when credentialType is not ApiKey", async ({
    expect,
  }) => {
    vi.mocked(core.info).mockImplementation(() => {});

    server.use(
      edgeApiGetCredentialsHandler({
        credentialType: "OAuthToken",
        expiresAt: "2024-12-31T23:59:59Z",
        data: {
          apiKey: "test-api-key-67890",
        },
      }),
    );

    await expect(
      getApiKey(
        reqBody.clientId,
        reqBody.identityToken,
        reqBody.accessToken,
        reqBody.domain,
        reqBody.serverHost,
        reqBody.serverPort,
      ),
    ).rejects.toThrowError("Invalid credentials type: OAuthToken");
  });

  it("sends correct request body", async ({ expect }) => {
    vi.mocked(core.info).mockImplementation(() => {});
    vi.mocked(core.setSecret).mockImplementation(() => {});

    let capturedBody: unknown = null;

    server.use(
      edgeApiGetCredentialsHandler(async (info) => {
        capturedBody = await info.request.json();
        return new Response(
          JSON.stringify({
            credentialType: "ApiKey",
            expiresAt: "2024-12-31T23:59:59Z",
            data: {
              apiKey: "test-api-key-67890",
            },
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

    await getApiKey(
      reqBody.clientId,
      reqBody.identityToken,
      reqBody.accessToken,
      reqBody.domain,
      reqBody.serverHost,
      reqBody.serverPort,
    );

    expect(capturedBody).toEqual({
      clientId: reqBody.clientId,
      client: {
        github: {
          identityToken: reqBody.identityToken,
        },
      },
      server: {
        host: reqBody.serverHost,
        port: reqBody.serverPort,
      },
      credentialType: "ApiKey",
    });
  });

  it("sends correct Authorization header", async ({ expect }) => {
    vi.mocked(core.info).mockImplementation(() => {});
    vi.mocked(core.setSecret).mockImplementation(() => {});

    let capturedHeaders: Headers | null = null;

    server.use(
      edgeApiGetCredentialsHandler(async (info) => {
        capturedHeaders = info.request.headers;
        return new Response(
          JSON.stringify({
            credentialType: "ApiKey",
            expiresAt: "2024-12-31T23:59:59Z",
            data: {
              apiKey: "test-api-key-67890",
            },
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

    await getApiKey(
      reqBody.clientId,
      reqBody.identityToken,
      reqBody.accessToken,
      reqBody.domain,
      reqBody.serverHost,
      reqBody.serverPort,
    );

    expect(capturedHeaders?.get("Authorization")).toBe(
      `Bearer ${reqBody.accessToken}`,
    );
  });

  it("masks the API key by calling setSecret", async ({ expect }) => {
    vi.mocked(core.info).mockImplementation(() => {});
    vi.mocked(core.setSecret).mockImplementation(() => {});

    const testApiKey = "super-secret-api-key-12345";

    server.use(
      edgeApiGetCredentialsHandler({
        credentialType: "ApiKey",
        expiresAt: "2024-12-31T23:59:59Z",
        data: {
          apiKey: testApiKey,
        },
      }),
    );

    await getApiKey(
      reqBody.clientId,
      reqBody.identityToken,
      reqBody.accessToken,
      reqBody.domain,
      reqBody.serverHost,
      reqBody.serverPort,
    );

    expect(core.setSecret).toHaveBeenCalledWith(testApiKey);
    expect(core.setSecret).toHaveBeenCalledTimes(1);
  });
});
