import * as core from "@actions/core";
import { setupServer } from "msw/node";
import { v4 as uuidv4 } from "uuid";
import { afterAll, afterEach, beforeAll, describe, it, vi } from "vitest";
import {
  edgeApiGetCredentialsHandler,
  edgeApiGetCredentialsHandlerResponse400,
  edgeApiGetCredentialsHandlerResponse500,
} from "../gen";
import { getCredential, setOutputs } from "../src/credential";

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
  serverPort: 443,
};

describe("getCredential", () => {
  beforeAll(() => server.listen());
  afterEach(() => {
    server.resetHandlers();
    vi.clearAllMocks();
  });
  afterAll(() => server.close());

  it("returns ApiKey credentials when called with valid data", async ({
    expect,
  }) => {
    vi.mocked(core.info).mockImplementation(() => {});

    server.use(
      edgeApiGetCredentialsHandler({
        credentialType: "ApiKey",
        expiresAt: "2024-12-31T23:59:59Z",
        data: {
          apiKey: "test-api-key-67890",
        },
      }),
    );

    const result = await getCredential(
      "ApiKey",
      reqBody.clientId,
      reqBody.identityToken,
      reqBody.accessToken,
      reqBody.domain,
      reqBody.serverHost,
      reqBody.serverPort,
    );

    expect(result).toEqual({
      credentialType: "ApiKey",
      expiresAt: "2024-12-31T23:59:59Z",
      data: {
        apiKey: "test-api-key-67890",
      },
    });
    expect(core.info).toHaveBeenCalledWith(
      "Fetch Credential (url): https://a12345.ec.aembit.io/edge/v1/credentials",
    );
    expect(core.info).toHaveBeenCalledWith("Response status: 200");
  });

  it("returns UsernamePassword credentials when called with valid data", async ({
    expect,
  }) => {
    vi.mocked(core.info).mockImplementation(() => {});

    server.use(
      edgeApiGetCredentialsHandler({
        credentialType: "UsernamePassword",
        expiresAt: null,
        data: {
          username: "test-user",
          password: "test-password",
        },
      }),
    );

    const result = await getCredential(
      "UsernamePassword",
      reqBody.clientId,
      reqBody.identityToken,
      reqBody.accessToken,
      reqBody.domain,
      reqBody.serverHost,
      reqBody.serverPort,
    );

    expect(result).toEqual({
      credentialType: "UsernamePassword",
      expiresAt: null,
      data: {
        username: "test-user",
        password: "test-password",
      },
    });
  });

  it("returns OAuthToken credentials when called with valid data", async ({
    expect,
  }) => {
    vi.mocked(core.info).mockImplementation(() => {});

    server.use(
      edgeApiGetCredentialsHandler({
        credentialType: "OAuthToken",
        expiresAt: "2024-12-31T23:59:59Z",
        data: {
          token: "test-oauth-token",
        },
      }),
    );

    const result = await getCredential(
      "OAuthToken",
      reqBody.clientId,
      reqBody.identityToken,
      reqBody.accessToken,
      reqBody.domain,
      reqBody.serverHost,
      reqBody.serverPort,
    );

    expect(result.credentialType).toBe("OAuthToken");
    expect(result.data?.token).toBe("test-oauth-token");
  });

  it("returns GoogleWorkloadIdentityFederation credentials when called with valid data", async ({
    expect,
  }) => {
    vi.mocked(core.info).mockImplementation(() => {});

    server.use(
      edgeApiGetCredentialsHandler({
        credentialType: "GoogleWorkloadIdentityFederation",
        expiresAt: "2024-12-31T23:59:59Z",
        data: {
          token: "test-gcp-token",
        },
      }),
    );

    const result = await getCredential(
      "GoogleWorkloadIdentityFederation",
      reqBody.clientId,
      reqBody.identityToken,
      reqBody.accessToken,
      reqBody.domain,
      reqBody.serverHost,
      reqBody.serverPort,
    );

    expect(result.credentialType).toBe("GoogleWorkloadIdentityFederation");
    expect(result.data?.token).toBe("test-gcp-token");
  });

  it("returns AwsStsFederation credentials when called with valid data", async ({
    expect,
  }) => {
    vi.mocked(core.info).mockImplementation(() => {});

    server.use(
      edgeApiGetCredentialsHandler({
        credentialType: "AwsStsFederation",
        expiresAt: "2024-12-31T23:59:59Z",
        data: {
          awsAccessKeyId: "AKIAIOSFODNN7EXAMPLE",
          awsSecretAccessKey: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
          awsSessionToken: "test-session-token",
        },
      }),
    );

    const result = await getCredential(
      "AwsStsFederation",
      reqBody.clientId,
      reqBody.identityToken,
      reqBody.accessToken,
      reqBody.domain,
      reqBody.serverHost,
      reqBody.serverPort,
    );

    expect(result.credentialType).toBe("AwsStsFederation");
    expect(result.data?.awsAccessKeyId).toBe("AKIAIOSFODNN7EXAMPLE");
    expect(result.data?.awsSecretAccessKey).toBe(
      "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
    );
    expect(result.data?.awsSessionToken).toBe("test-session-token");
  });

  it("throws an error when receiving a 400 response", async ({ expect }) => {
    vi.mocked(core.info).mockImplementation(() => {});

    server.use(
      edgeApiGetCredentialsHandler(edgeApiGetCredentialsHandlerResponse400),
    );

    await expect(
      getCredential(
        "ApiKey",
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
      getCredential(
        "ApiKey",
        reqBody.clientId,
        reqBody.identityToken,
        reqBody.accessToken,
        reqBody.domain,
        reqBody.serverHost,
        reqBody.serverPort,
      ),
    ).rejects.toThrowError(/Failed to fetch access token/);
  });

  it("throws an error when credentialType is invalid", async ({ expect }) => {
    vi.mocked(core.info).mockImplementation(() => {});

    server.use(
      edgeApiGetCredentialsHandler({
        credentialType: "InvalidType",
        expiresAt: null,
        data: {
          apiKey: "test-api-key-67890",
        },
      }),
    );

    await expect(
      getCredential(
        "ApiKey",
        reqBody.clientId,
        reqBody.identityToken,
        reqBody.accessToken,
        reqBody.domain,
        reqBody.serverHost,
        reqBody.serverPort,
      ),
    ).rejects.toThrowError(/Invalid or currently unsupported credential type/);
  });

  it("throws an error when credentialType is missing", async ({ expect }) => {
    vi.mocked(core.info).mockImplementation(() => {});

    server.use(
      edgeApiGetCredentialsHandler({
        expiresAt: null,
        data: {
          apiKey: "test-api-key-67890",
        },
      }),
    );

    await expect(
      getCredential(
        "ApiKey",
        reqBody.clientId,
        reqBody.identityToken,
        reqBody.accessToken,
        reqBody.domain,
        reqBody.serverHost,
        reqBody.serverPort,
      ),
    ).rejects.toThrowError(/Invalid or currently unsupported credential type/);
  });

  it("throws an error when data is missing from response", async ({
    expect,
  }) => {
    vi.mocked(core.info).mockImplementation(() => {});

    server.use(
      edgeApiGetCredentialsHandler({
        credentialType: "ApiKey",
        expiresAt: null,
      }),
    );

    await expect(
      getCredential(
        "ApiKey",
        reqBody.clientId,
        reqBody.identityToken,
        reqBody.accessToken,
        reqBody.domain,
        reqBody.serverHost,
        reqBody.serverPort,
      ),
    ).rejects.toThrowError(
      /No credential values were included in the server response/,
    );
  });

  it("sends correct request body", async ({ expect }) => {
    vi.mocked(core.info).mockImplementation(() => {});

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

    await getCredential(
      "ApiKey",
      reqBody.clientId,
      reqBody.identityToken,
      reqBody.accessToken,
      reqBody.domain,
      reqBody.serverHost,
      reqBody.serverPort,
    );

    expect(capturedBody).toEqual({
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

    await getCredential(
      "ApiKey",
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

  it("sends Content-Type: application/json header", async ({ expect }) => {
    vi.mocked(core.info).mockImplementation(() => {});

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

    await getCredential(
      "ApiKey",
      reqBody.clientId,
      reqBody.identityToken,
      reqBody.accessToken,
      reqBody.domain,
      reqBody.serverHost,
      reqBody.serverPort,
    );

    expect(capturedHeaders?.get("Content-Type")).toBe("application/json");
  });
});

describe("setOutputs", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("ApiKey", () => {
    it("sets API key output and masks it", ({ expect }) => {
      vi.mocked(core.setSecret).mockImplementation(() => {});
      vi.mocked(core.setOutput).mockImplementation(() => {});

      const credential = {
        apiKey: "test-api-key-12345",
      };

      setOutputs("ApiKey", credential);

      expect(core.setSecret).toHaveBeenCalledWith("test-api-key-12345");
      expect(core.setOutput).toHaveBeenCalledWith(
        "api-key",
        "test-api-key-12345",
      );
      expect(core.setSecret).toHaveBeenCalledTimes(1);
      expect(core.setOutput).toHaveBeenCalledTimes(1);
    });

    it("throws an error when API key is missing", ({ expect }) => {
      const credential = {};

      expect(() => setOutputs("ApiKey", credential)).toThrowError(
        "API key was missing in response from server.",
      );
    });

    it("throws an error when API key is null", ({ expect }) => {
      const credential = {
        apiKey: null,
      };

      expect(() => setOutputs("ApiKey", credential)).toThrowError(
        "API key was missing in response from server.",
      );
    });
  });

  describe("OAuthToken", () => {
    it("sets OAuth token output and masks it", ({ expect }) => {
      vi.mocked(core.setSecret).mockImplementation(() => {});
      vi.mocked(core.setOutput).mockImplementation(() => {});

      const credential = {
        token: "test-oauth-token-12345",
      };

      setOutputs("OAuthToken", credential);

      expect(core.setSecret).toHaveBeenCalledWith("test-oauth-token-12345");
      expect(core.setOutput).toHaveBeenCalledWith(
        "token",
        "test-oauth-token-12345",
      );
      expect(core.setSecret).toHaveBeenCalledTimes(1);
      expect(core.setOutput).toHaveBeenCalledTimes(1);
    });

    it("throws an error when OAuth token is missing", ({ expect }) => {
      const credential = {};

      expect(() => setOutputs("OAuthToken", credential)).toThrowError(
        "OAuthToken was missing in response from server.",
      );
    });
  });

  describe("GoogleWorkloadIdentityFederation", () => {
    it("sets Google token output and masks it", ({ expect }) => {
      vi.mocked(core.setSecret).mockImplementation(() => {});
      vi.mocked(core.setOutput).mockImplementation(() => {});

      const credential = {
        token: "test-gcp-token-12345",
      };

      setOutputs("GoogleWorkloadIdentityFederation", credential);

      expect(core.setSecret).toHaveBeenCalledWith("test-gcp-token-12345");
      expect(core.setOutput).toHaveBeenCalledWith(
        "token",
        "test-gcp-token-12345",
      );
      expect(core.setSecret).toHaveBeenCalledTimes(1);
      expect(core.setOutput).toHaveBeenCalledTimes(1);
    });

    it("throws an error when Google token is missing", ({ expect }) => {
      const credential = {};

      expect(() =>
        setOutputs("GoogleWorkloadIdentityFederation", credential),
      ).toThrowError(
        "Google Workload Identity Federation token was missing in response from server.",
      );
    });
  });

  describe("UsernamePassword", () => {
    it("sets username and password outputs and masks them", ({ expect }) => {
      vi.mocked(core.setSecret).mockImplementation(() => {});
      vi.mocked(core.setOutput).mockImplementation(() => {});

      const credential = {
        username: "test-user",
        password: "test-password",
      };

      setOutputs("UsernamePassword", credential);

      expect(core.setSecret).toHaveBeenCalledWith("test-user");
      expect(core.setSecret).toHaveBeenCalledWith("test-password");
      expect(core.setOutput).toHaveBeenCalledWith("username", "test-user");
      expect(core.setOutput).toHaveBeenCalledWith("password", "test-password");
      expect(core.setSecret).toHaveBeenCalledTimes(2);
      expect(core.setOutput).toHaveBeenCalledTimes(2);
    });

    it("throws an error when username is missing", ({ expect }) => {
      const credential = {
        password: "test-password",
      };

      expect(() => setOutputs("UsernamePassword", credential)).toThrowError(
        "Username or password was missing in response from server.",
      );
    });

    it("throws an error when password is missing", ({ expect }) => {
      const credential = {
        username: "test-user",
      };

      expect(() => setOutputs("UsernamePassword", credential)).toThrowError(
        "Username or password was missing in response from server.",
      );
    });

    it("throws an error when both username and password are missing", ({
      expect,
    }) => {
      const credential = {};

      expect(() => setOutputs("UsernamePassword", credential)).toThrowError(
        "Username or password was missing in response from server.",
      );
    });
  });

  describe("AwsStsFederation", () => {
    it("sets AWS credentials outputs and masks them", ({ expect }) => {
      vi.mocked(core.setSecret).mockImplementation(() => {});
      vi.mocked(core.setOutput).mockImplementation(() => {});

      const credential = {
        awsAccessKeyId: "AKIAIOSFODNN7EXAMPLE",
        awsSecretAccessKey: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
        awsSessionToken: "test-session-token",
      };

      setOutputs("AwsStsFederation", credential);

      expect(core.setSecret).toHaveBeenCalledWith("AKIAIOSFODNN7EXAMPLE");
      expect(core.setSecret).toHaveBeenCalledWith(
        "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
      );
      expect(core.setSecret).toHaveBeenCalledWith("test-session-token");
      expect(core.setOutput).toHaveBeenCalledWith(
        "aws-access-key-id",
        "AKIAIOSFODNN7EXAMPLE",
      );
      expect(core.setOutput).toHaveBeenCalledWith(
        "aws-secret-access-key",
        "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
      );
      expect(core.setOutput).toHaveBeenCalledWith(
        "aws-session-token",
        "test-session-token",
      );
      expect(core.setSecret).toHaveBeenCalledTimes(3);
      expect(core.setOutput).toHaveBeenCalledTimes(3);
    });

    it("throws an error when awsAccessKeyId is missing", ({ expect }) => {
      const credential = {
        awsSecretAccessKey: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
        awsSessionToken: "test-session-token",
      };

      expect(() => setOutputs("AwsStsFederation", credential)).toThrowError(
        "AWS credentials were missing in response from server.",
      );
    });

    it("throws an error when awsSecretAccessKey is missing", ({ expect }) => {
      const credential = {
        awsAccessKeyId: "AKIAIOSFODNN7EXAMPLE",
        awsSessionToken: "test-session-token",
      };

      expect(() => setOutputs("AwsStsFederation", credential)).toThrowError(
        "AWS credentials were missing in response from server.",
      );
    });

    it("throws an error when awsSessionToken is missing", ({ expect }) => {
      const credential = {
        awsAccessKeyId: "AKIAIOSFODNN7EXAMPLE",
        awsSecretAccessKey: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
      };

      expect(() => setOutputs("AwsStsFederation", credential)).toThrowError(
        "AWS credentials were missing in response from server.",
      );
    });

    it("throws an error when all AWS credentials are missing", ({ expect }) => {
      const credential = {};

      expect(() => setOutputs("AwsStsFederation", credential)).toThrowError(
        "AWS credentials were missing in response from server.",
      );
    });
  });

  describe("Invalid credential type", () => {
    it("throws an error for unsupported credential type", ({ expect }) => {
      const credential = {
        someValue: "test",
      };

      expect(() => setOutputs("UnsupportedType", credential)).toThrowError(
        "Invalid or currently unsupported credential type: UnsupportedType",
      );
    });

    it("throws an error for Unknown credential type", ({ expect }) => {
      const credential = {
        someValue: "test",
      };

      expect(() => setOutputs("Unknown", credential)).toThrowError(
        "Invalid or currently unsupported credential type: Unknown",
      );
    });
  });
});
