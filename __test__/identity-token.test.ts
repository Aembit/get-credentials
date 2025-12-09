import * as core from "@actions/core";
import { v4 as uuidv4 } from "uuid";
import { afterEach, beforeEach, describe, it, vi } from "vitest";
import { getIdentityToken } from "../src/identity-token";
import * as validate from "../src/validate";

// Mock @actions/core module
vi.mock("@actions/core");
vi.mock("../src/validate");

describe("getIdentityToken", () => {
  const validClientId = `aembit:useast2:a12345:identity:github_idtoken:${uuidv4()}`;
  const domain = "aembit.io";
  // Valid JWT token format: header.payload.signature
  const mockValidToken =
    "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZXN0dXNlcjAxIiwiYXVkIjpbIjEyODk4ODg0NTk2ODYzIl0sImlzcyI6Imh0dHBzOi8vYXV0aGxldGUuY29tIiwiZXhwIjoxNTU5MTA2ODE1LCJpYXQiOjE1NTkwMjA0MTUsIm5vbmNlIjoibi0wUzZfV3pBMk1qIn0.5uSFMTGnubyvtiExHc9l7HT9UsF8a_Qb0STtWzyclBk";

  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock for validateOidcToken to pass
    vi.mocked(validate.validateOidcToken).mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns an identity token when called with valid data", async ({
    expect,
  }) => {
    vi.mocked(core.getIDToken).mockResolvedValue(mockValidToken);
    vi.mocked(core.info).mockImplementation(() => {});

    const token = await getIdentityToken(validClientId, domain);

    expect(token).toBe(mockValidToken);
    expect(core.getIDToken).toHaveBeenCalledWith("https://a12345.id.aembit.io");
    expect(core.info).toHaveBeenCalledWith(
      "Fetching token ID for https://a12345.id.aembit.io",
    );
    expect(validate.validateOidcToken).toHaveBeenCalledWith(mockValidToken);
  });

  it("extracts tenantId correctly from clientId", async ({ expect }) => {
    const clientIdWithDifferentTenant = `aembit:uswest1:z99999:identity:github_idtoken:${uuidv4()}`;
    vi.mocked(core.getIDToken).mockResolvedValue(mockValidToken);
    vi.mocked(core.info).mockImplementation(() => {});

    await getIdentityToken(clientIdWithDifferentTenant, domain);

    expect(core.getIDToken).toHaveBeenCalledWith("https://z99999.id.aembit.io");
  });

  it("constructs URL correctly with different domains", async ({ expect }) => {
    const customDomain = "custom.example.com";
    vi.mocked(core.getIDToken).mockResolvedValue(mockValidToken);
    vi.mocked(core.info).mockImplementation(() => {});

    await getIdentityToken(validClientId, customDomain);

    expect(core.getIDToken).toHaveBeenCalledWith(
      "https://a12345.id.custom.example.com",
    );
  });

  it("throws an error when getIDToken fails", async ({ expect }) => {
    vi.mocked(core.getIDToken).mockRejectedValue(
      new Error("Failed to get ID token from GitHub"),
    );
    vi.mocked(core.info).mockImplementation(() => {});

    await expect(getIdentityToken(validClientId, domain)).rejects.toThrowError(
      "Failed to get ID token from GitHub",
    );
  });

  it("throws an error when validateOidcToken fails", async ({ expect }) => {
    vi.mocked(core.getIDToken).mockResolvedValue("invalid.token");
    vi.mocked(core.info).mockImplementation(() => {});
    vi.mocked(validate.validateOidcToken).mockImplementation(() => {
      throw new Error("Identity token is not in valid JWT format");
    });

    await expect(getIdentityToken(validClientId, domain)).rejects.toThrowError(
      "Identity token is not in valid JWT format",
    );
  });

  it("converts buffer to UTF-8 string correctly", async ({ expect }) => {
    const bufferData = mockValidToken;
    vi.mocked(core.getIDToken).mockResolvedValue(bufferData);
    vi.mocked(core.info).mockImplementation(() => {});

    const token = await getIdentityToken(validClientId, domain);

    expect(token).toBe(bufferData);
    expect(validate.validateOidcToken).toHaveBeenCalledWith(bufferData);
  });
});
