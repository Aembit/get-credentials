import * as core from "@actions/core";
import { v4 as uuidv4 } from "uuid";
import { afterEach, beforeEach, describe, it, vi } from "vitest";
import * as accessToken from "../src/access-token";
import * as credential from "../src/credential";
import * as identityToken from "../src/identity-token";
import { run } from "../src/main";
import * as validate from "../src/validate";

// Mock all dependencies
vi.mock("@actions/core");
vi.mock("../src/validate");
vi.mock("../src/identity-token");
vi.mock("../src/access-token");
vi.mock("../src/credential");

describe("run", () => {
  const validClientId = `aembit:useast2:a12345:identity:github_idtoken:${uuidv4()}`;
  const mockIdentityToken =
    "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZXN0dXNlcjAxIiwiYXVkIjpbIjEyODk4ODg0NTk2ODYzIl0sImlzcyI6Imh0dHBzOi8vYXV0aGxldGUuY29tIiwiZXhwIjoxNTU5MTA2ODE1LCJpYXQiOjE1NTkwMjA0MTUsIm5vbmNlIjoibi0wUzZfV3pBMk1qIn0.5uSFMTGnubyvtiExHc9l7HT9UsF8a_Qb0STtWzyclBk";
  const mockAccessToken = "test-access-token-12345";
  const mockServerPort = 443;
  const mockApiKey = "test-api-key-67890";

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default successful mocks
    vi.mocked(core.getInput).mockImplementation((name: string) => {
      const inputs: Record<string, string> = {
        "client-id": validClientId,
        domain: "aembit.io",
        "server-host": "api.example.com",
        "server-port": "443",
        "credential-type": "ApiKey",
      };
      return inputs[name] || "";
    });

    vi.mocked(core.info).mockImplementation(() => {});
    vi.mocked(core.setOutput).mockImplementation(() => {});
    vi.mocked(core.setFailed).mockImplementation(() => {});

    vi.mocked(validate.validateClientId).mockImplementation(() => {});
    vi.mocked(validate.validateCredentialType).mockImplementation(() => {});
    vi.mocked(validate.validateServerPort).mockImplementation(
      (port: string) => {
        return Number(port);
      },
    );

    vi.mocked(identityToken.getIdentityToken).mockResolvedValue(
      mockIdentityToken,
    );
    vi.mocked(accessToken.getAccessToken).mockResolvedValue(mockAccessToken);
    vi.mocked(credential.getCredential).mockResolvedValue({
      credentialType: "ApiKey",
      expiresAt: null,
      data: { apiKey: mockApiKey },
    });
    vi.mocked(credential.setOutputs).mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("completes successfully with valid inputs for ApiKey", async ({
    expect,
  }) => {
    await run();

    // Verify inputs are read
    expect(core.getInput).toHaveBeenCalledWith("client-id", {
      required: true,
      trimWhitespace: true,
    });
    expect(core.getInput).toHaveBeenCalledWith("domain");
    expect(core.getInput).toHaveBeenCalledWith("server-host");
    expect(core.getInput).toHaveBeenCalledWith("server-port");
    expect(core.getInput).toHaveBeenCalledWith("credential-type", {
      required: true,
    });

    // Verify validations are called
    expect(validate.validateClientId).toHaveBeenCalledWith(validClientId);
    expect(validate.validateCredentialType).toHaveBeenCalledWith("ApiKey");

    // Verify info messages
    expect(core.info).toHaveBeenCalledWith("Client ID is valid ✅");
    expect(core.info).toHaveBeenCalledWith(
      "ApiKey is a valid credential type ✅",
    );

    // Verify functions are called in correct order with correct arguments
    expect(identityToken.getIdentityToken).toHaveBeenCalledWith(
      validClientId,
      "aembit.io",
    );
    expect(accessToken.getAccessToken).toHaveBeenCalledWith(
      validClientId,
      mockIdentityToken,
      "aembit.io",
    );
    expect(credential.getCredential).toHaveBeenCalledWith(
      "ApiKey",
      validClientId,
      mockIdentityToken,
      mockAccessToken,
      "aembit.io",
      "api.example.com",
      443,
    );

    // Verify setOutputs is called
    expect(credential.setOutputs).toHaveBeenCalledWith("ApiKey", {
      apiKey: mockApiKey,
    });

    // Verify no failure
    expect(core.setFailed).not.toHaveBeenCalled();
  });

  it("calls setFailed when validateClientId throws an error", async ({
    expect,
  }) => {
    vi.mocked(validate.validateClientId).mockImplementation(() => {
      throw new Error("Client ID should start with aembit.");
    });

    await run();

    expect(validate.validateClientId).toHaveBeenCalled();
    expect(core.setFailed).toHaveBeenCalledWith(
      "Client ID should start with aembit.",
    );

    // Verify subsequent functions are not called
    expect(validate.validateCredentialType).not.toHaveBeenCalled();
    expect(identityToken.getIdentityToken).not.toHaveBeenCalled();
    expect(accessToken.getAccessToken).not.toHaveBeenCalled();
    expect(credential.getCredential).not.toHaveBeenCalled();
    expect(credential.setOutputs).not.toHaveBeenCalled();
  });

  it("calls setFailed when validateCredentialType throws an error", async ({
    expect,
  }) => {
    vi.mocked(validate.validateCredentialType).mockImplementation(() => {
      throw new Error("Invalid or currently unsupported credential type.");
    });

    await run();

    expect(validate.validateClientId).toHaveBeenCalled();
    expect(validate.validateCredentialType).toHaveBeenCalled();
    expect(core.setFailed).toHaveBeenCalledWith(
      "Invalid or currently unsupported credential type.",
    );

    // Verify subsequent functions are not called
    expect(identityToken.getIdentityToken).not.toHaveBeenCalled();
    expect(accessToken.getAccessToken).not.toHaveBeenCalled();
    expect(credential.getCredential).not.toHaveBeenCalled();
    expect(credential.setOutputs).not.toHaveBeenCalled();
  });

  it("calls setFailed when getIdentityToken throws an error", async ({
    expect,
  }) => {
    vi.mocked(identityToken.getIdentityToken).mockRejectedValue(
      new Error("Failed to get identity token"),
    );

    await run();

    expect(validate.validateClientId).toHaveBeenCalled();
    expect(validate.validateCredentialType).toHaveBeenCalled();
    expect(identityToken.getIdentityToken).toHaveBeenCalled();
    expect(core.setFailed).toHaveBeenCalledWith("Failed to get identity token");

    // Verify subsequent functions are not called
    expect(accessToken.getAccessToken).not.toHaveBeenCalled();
    expect(credential.getCredential).not.toHaveBeenCalled();
    expect(credential.setOutputs).not.toHaveBeenCalled();
  });

  it("calls setFailed when getAccessToken throws an error", async ({
    expect,
  }) => {
    vi.mocked(accessToken.getAccessToken).mockRejectedValue(
      new Error("Failed to fetch access token"),
    );

    await run();

    expect(validate.validateClientId).toHaveBeenCalled();
    expect(validate.validateCredentialType).toHaveBeenCalled();
    expect(identityToken.getIdentityToken).toHaveBeenCalled();
    expect(accessToken.getAccessToken).toHaveBeenCalled();
    expect(core.setFailed).toHaveBeenCalledWith("Failed to fetch access token");

    // Verify subsequent functions are not called
    expect(credential.getCredential).not.toHaveBeenCalled();
    expect(credential.setOutputs).not.toHaveBeenCalled();
  });

  it("calls setFailed when getCredential throws an error", async ({
    expect,
  }) => {
    vi.mocked(credential.getCredential).mockRejectedValue(
      new Error("Failed to fetch API key"),
    );

    await run();

    expect(validate.validateClientId).toHaveBeenCalled();
    expect(validate.validateCredentialType).toHaveBeenCalled();
    expect(identityToken.getIdentityToken).toHaveBeenCalled();
    expect(accessToken.getAccessToken).toHaveBeenCalled();
    expect(credential.getCredential).toHaveBeenCalled();
    expect(core.setFailed).toHaveBeenCalledWith("Failed to fetch API key");

    // Verify setOutputs is not called
    expect(credential.setOutputs).not.toHaveBeenCalled();
  });

  it("handles non-Error types by converting to string", async ({ expect }) => {
    vi.mocked(validate.validateClientId).mockImplementation(() => {
      throw "String error";
    });

    await run();

    expect(core.setFailed).toHaveBeenCalledWith("String error");
  });

  it("handles Error objects by extracting message", async ({ expect }) => {
    const errorMessage = "This is an error message";
    vi.mocked(validate.validateClientId).mockImplementation(() => {
      throw new Error(errorMessage);
    });

    await run();

    expect(core.setFailed).toHaveBeenCalledWith(errorMessage);
  });

  it("handles numeric errors by converting to string", async ({ expect }) => {
    vi.mocked(validate.validateClientId).mockImplementation(() => {
      throw 404;
    });

    await run();

    expect(core.setFailed).toHaveBeenCalledWith("404");
  });

  it("handles object errors by converting to string", async ({ expect }) => {
    vi.mocked(validate.validateClientId).mockImplementation(() => {
      throw { code: "ERROR_CODE", details: "Some details" };
    });

    await run();

    expect(core.setFailed).toHaveBeenCalledWith("[object Object]");
  });

  it("passes correct inputs to all functions", async ({ expect }) => {
    const customClientId = `aembit:uswest1:b67890:identity:github_idtoken:${uuidv4()}`;
    const customDomain = "custom.example.com";
    const customHost = "server.example.com";
    const customPort = "8080";

    vi.mocked(validate.validateServerPort).mockImplementation(() => {
      return Number(customPort);
    });

    vi.mocked(core.getInput).mockImplementation((name: string) => {
      const inputs: Record<string, string> = {
        "client-id": customClientId,
        domain: customDomain,
        "server-host": customHost,
        "server-port": customPort,
        "credential-type": "ApiKey",
      };
      return inputs[name] || "";
    });

    await run();

    expect(validate.validateClientId).toHaveBeenCalledWith(customClientId);
    expect(identityToken.getIdentityToken).toHaveBeenCalledWith(
      customClientId,
      customDomain,
    );
    expect(accessToken.getAccessToken).toHaveBeenCalledWith(
      customClientId,
      mockIdentityToken,
      customDomain,
    );
    expect(credential.getCredential).toHaveBeenCalledWith(
      "ApiKey",
      customClientId,
      mockIdentityToken,
      mockAccessToken,
      customDomain,
      customHost,
      Number(customPort),
    );
  });

  it("calls functions in the correct sequence", async ({ expect }) => {
    const callOrder: string[] = [];

    vi.mocked(validate.validateClientId).mockImplementation(() => {
      callOrder.push("validateClientId");
    });
    vi.mocked(validate.validateCredentialType).mockImplementation(() => {
      callOrder.push("validateCredentialType");
    });
    vi.mocked(validate.validateServerPort).mockImplementation(() => {
      callOrder.push("validateServerPort");
      return mockServerPort;
    });
    vi.mocked(identityToken.getIdentityToken).mockImplementation(async () => {
      callOrder.push("getIdentityToken");
      return mockIdentityToken;
    });
    vi.mocked(accessToken.getAccessToken).mockImplementation(async () => {
      callOrder.push("getAccessToken");
      return mockAccessToken;
    });
    vi.mocked(credential.getCredential).mockImplementation(async () => {
      callOrder.push("getCredential");
      return {
        credentialType: "ApiKey",
        expiresAt: null,
        data: {
          apiKey: mockApiKey,
        },
      };
    });
    vi.mocked(credential.setOutputs).mockImplementation(() => {
      callOrder.push("setOutputs");
    });

    await run();

    expect(callOrder).toEqual([
      "validateClientId",
      "validateCredentialType",
      "validateServerPort",
      "getIdentityToken",
      "getAccessToken",
      "getCredential",
      "setOutputs",
    ]);
  });

  it("completes successfully with UsernamePassword credentials", async ({
    expect,
  }) => {
    vi.mocked(core.getInput).mockImplementation((name: string) => {
      const inputs: Record<string, string> = {
        "client-id": validClientId,
        domain: "aembit.io",
        "server-host": "api.example.com",
        "server-port": "443",
        "credential-type": "UsernamePassword",
      };
      return inputs[name] || "";
    });

    vi.mocked(credential.getCredential).mockResolvedValue({
      credentialType: "UsernamePassword",
      expiresAt: null,
      data: {
        username: "test-user",
        password: "test-password",
      },
    });

    await run();

    expect(validate.validateCredentialType).toHaveBeenCalledWith(
      "UsernamePassword",
    );
    expect(credential.getCredential).toHaveBeenCalledWith(
      "UsernamePassword",
      validClientId,
      mockIdentityToken,
      mockAccessToken,
      "aembit.io",
      "api.example.com",
      443,
    );
    expect(credential.setOutputs).toHaveBeenCalledWith("UsernamePassword", {
      username: "test-user",
      password: "test-password",
    });
    expect(core.setFailed).not.toHaveBeenCalled();
  });

  it("completes successfully with OAuthToken credentials", async ({
    expect,
  }) => {
    vi.mocked(core.getInput).mockImplementation((name: string) => {
      const inputs: Record<string, string> = {
        "client-id": validClientId,
        domain: "aembit.io",
        "server-host": "api.example.com",
        "server-port": "443",
        "credential-type": "OAuthToken",
      };
      return inputs[name] || "";
    });

    vi.mocked(credential.getCredential).mockResolvedValue({
      credentialType: "OAuthToken",
      expiresAt: "2024-12-31T23:59:59Z",
      data: {
        token: "test-oauth-token",
      },
    });

    await run();

    expect(validate.validateCredentialType).toHaveBeenCalledWith("OAuthToken");
    expect(credential.setOutputs).toHaveBeenCalledWith("OAuthToken", {
      token: "test-oauth-token",
    });
    expect(core.setFailed).not.toHaveBeenCalled();
  });

  it("completes successfully with AwsStsFederation credentials", async ({
    expect,
  }) => {
    vi.mocked(core.getInput).mockImplementation((name: string) => {
      const inputs: Record<string, string> = {
        "client-id": validClientId,
        domain: "aembit.io",
        "server-host": "api.example.com",
        "server-port": "443",
        "credential-type": "AwsStsFederation",
      };
      return inputs[name] || "";
    });

    vi.mocked(credential.getCredential).mockResolvedValue({
      credentialType: "AwsStsFederation",
      expiresAt: "2024-12-31T23:59:59Z",
      data: {
        awsAccessKeyId: "AKIAIOSFODNN7EXAMPLE",
        awsSecretAccessKey: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
        awsSessionToken: "test-session-token",
      },
    });

    await run();

    expect(validate.validateCredentialType).toHaveBeenCalledWith(
      "AwsStsFederation",
    );
    expect(credential.setOutputs).toHaveBeenCalledWith("AwsStsFederation", {
      awsAccessKeyId: "AKIAIOSFODNN7EXAMPLE",
      awsSecretAccessKey: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
      awsSessionToken: "test-session-token",
    });
    expect(core.setFailed).not.toHaveBeenCalled();
  });

  it("calls setFailed when setOutputs throws an error", async ({ expect }) => {
    vi.mocked(credential.setOutputs).mockImplementation(() => {
      throw new Error("API key was missing in response from server.");
    });

    await run();

    expect(credential.getCredential).toHaveBeenCalled();
    expect(credential.setOutputs).toHaveBeenCalled();
    expect(core.setFailed).toHaveBeenCalledWith(
      "API key was missing in response from server.",
    );
  });
});
