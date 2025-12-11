import { v4 as uuidv4, v6 as uuidv6 } from "uuid";
import { describe, it } from "vitest";
import {
  validateClientId,
  validateCredentialType,
  validateOidcToken,
  validateServerPort,
} from "../src/validate";

describe("validateClientId", () => {
  it("should call with no error for a valid UUID client-id", () => {
    validateClientId(
      `aembit:useast2:a12345:identity:github_idtoken:${uuidv4()}`,
    );
  });

  it("should throw an error with non-aembit prefix", async ({ expect }) => {
    expect(() =>
      validateClientId(
        `badprefix:useast2:a12345:identity:github_idtoken:${uuidv4()}`,
      ),
    ).toThrowError("Client ID should start with aembit.");
  });
  it("should throw an error with no prefix", async ({ expect }) => {
    expect(() =>
      validateClientId(`:useast2:a12345:identity:github_idtoken:${uuidv4()}`),
    ).toThrowError("Client ID should start with aembit.");
  });

  it("should throw an error with long tenant ID", async ({ expect }) => {
    expect(() =>
      validateClientId(
        `aembit:useast2:a123456:identity:github_idtoken:${uuidv4()}`,
      ),
    ).toThrowError("Client ID contains invalid tenant ID.");
  });
  it("should throw an error with short tenant ID", async ({ expect }) => {
    expect(() =>
      validateClientId(
        `aembit:useast2:a1234:identity:github_idtoken:${uuidv4()}`,
      ),
    ).toThrowError("Client ID contains invalid tenant ID.");
  });
  it("should throw an error with tenant ID with invalid characters", async ({
    expect,
  }) => {
    expect(() =>
      validateClientId(
        `aembit:useast2:a123-5:identity:github_idtoken:${uuidv4()}`,
      ),
    ).toThrowError("Client ID contains invalid tenant ID.");
  });
  it("should throw an error with missing tenant ID", async ({ expect }) => {
    expect(() =>
      validateClientId(`aembit:useast2::identity:github_idtoken:${uuidv4()}`),
    ).toThrowError("Client ID contains invalid tenant ID.");
  });

  it("should throw an error with missing identity field", async ({
    expect,
  }) => {
    expect(() =>
      validateClientId(`aembit:useast2:a12345::github_idtoken:${uuidv4()}`),
    ).toThrowError("Client ID does not appear to be for type identity.");
  });
  it("should throw an error with invalid identity field", async ({
    expect,
  }) => {
    expect(() =>
      validateClientId(
        `aembit:useast2:a12345:credential:github_idtoken:${uuidv4()}`,
      ),
    ).toThrowError("Client ID does not appear to be for type identity.");
  });

  it("should throw an error with missing token type", async ({ expect }) => {
    expect(() =>
      validateClientId(`aembit:useast2:a12345:identity::${uuidv4()}`),
    ).toThrowError("Client ID does not appear to be of type GitHub ID token.");
  });
  it("should throw an error with invalid token type", async ({ expect }) => {
    expect(() =>
      validateClientId(
        `aembit:useast2:a12345:identity:gitlab_idtoken:${uuidv4()}`,
      ),
    ).toThrowError("Client ID does not appear to be of type GitHub ID token.");
  });

  it("should throw an error with missing uuid", async ({ expect }) => {
    expect(() =>
      validateClientId(`aembit:useast2:a12345:identity:github_idtoken:`),
    ).toThrowError("Not a valid token.");
  });
  it("should throw an error with id that is not uuid", async ({ expect }) => {
    expect(() =>
      validateClientId(`aembit:useast2:a12345:identity:github_idtoken:12345`),
    ).toThrowError("Not a valid token.");
  });
  it("should throw an error with non v4 uuid", async ({ expect }) => {
    expect(() =>
      validateClientId(
        `aembit:useast2:a12345:identity:github_idtoken:${uuidv6()}`,
      ),
    ).toThrowError("Not a valid token.");
  });
});

describe("validateCredentialType", () => {
  it("should call with no error for value ApiKey", () => {
    validateCredentialType("ApiKey");
  });

  it("should throw an error with invalid credential type", async ({
    expect,
  }) => {
    expect(() => validateCredentialType("GitLab")).toThrowError(
      /^Invalid or currently unsupported credential type\. Valid credential types are:.*/,
    );
  });
});

describe("validateOidcToken", () => {
  const validToken =
    "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZXN0dXNlcjAxIiwiYXVkIjpbIjEyODk4ODg0NTk2ODYzIl0sImlzcyI6Imh0dHBzOi8vYXV0aGxldGUuY29tIiwiZXhwIjoxNTU5MTA2ODE1LCJpYXQiOjE1NTkwMjA0MTUsIm5vbmNlIjoibi0wUzZfV3pBMk1qIn0.5uSFMTGnubyvtiExHc9l7HT9UsF8a_Qb0STtWzyclBk";

  it("should call with no error for a valid OIDC token", () => {
    validateOidcToken(validToken);
  });

  it("should accept tokens with hyphens and underscores", () => {
    validateOidcToken(
      "eyJ-bGciOiJ_UzI1NiJ9.eyJzdWIiOiJ0ZXN0In0.5uSFMTGnubyvti_xHc9l-HT9UsF8a_Qb0STtWzyclBk",
    );
  });

  it("should accept tokens with padding equals signs", () => {
    validateOidcToken(
      "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZXN0In0=.5uSFMTGnubyvtiExHc9l7HT9UsF8a_Qb0STtWzyclBk",
    );
  });

  it("should throw an error with empty string", async ({ expect }) => {
    expect(() => validateOidcToken("")).toThrowError("Identity token is empty");
  });

  it("should throw an error with whitespace only", async ({ expect }) => {
    expect(() => validateOidcToken("   ")).toThrowError(
      "Identity token is empty",
    );
  });

  it("should throw an error with only one part", async ({ expect }) => {
    expect(() => validateOidcToken("invalidtoken")).toThrowError(
      "Identity token is not in valid JWT format",
    );
  });

  it("should throw an error with only two parts", async ({ expect }) => {
    expect(() => validateOidcToken("header.payload")).toThrowError(
      "Identity token is not in valid JWT format",
    );
  });

  it("should throw an error with four parts", async ({ expect }) => {
    expect(() =>
      validateOidcToken("header.payload.signature.extra"),
    ).toThrowError("Identity token is not in valid JWT format");
  });

  it("should throw an error with invalid characters in header", async ({
    expect,
  }) => {
    expect(() =>
      validateOidcToken("invalid@chars.eyJzdWIiOiJ0ZXN0In0.signature"),
    ).toThrowError("Identity token contains invalid base64url encoding");
  });

  it("should throw an error with invalid characters in payload", async ({
    expect,
  }) => {
    expect(() =>
      validateOidcToken("eyJhbGciOiJIUzI1NiJ9.invalid!payload.signature"),
    ).toThrowError("Identity token contains invalid base64url encoding");
  });

  it("should throw an error with invalid characters in signature", async ({
    expect,
  }) => {
    expect(() =>
      validateOidcToken(
        "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZXN0In0.invalid$signature",
      ),
    ).toThrowError("Identity token contains invalid base64url encoding");
  });

  it("should throw an error with empty parts", async ({ expect }) => {
    expect(() => validateOidcToken("..signature")).toThrowError(
      "Identity token contains invalid base64url encoding",
    );
  });

  it("should throw an error with one empty part", async ({ expect }) => {
    expect(() =>
      validateOidcToken("eyJhbGciOiJIUzI1NiJ9..signature"),
    ).toThrowError("Identity token contains invalid base64url encoding");
  });
});

describe("validateServerPort", () => {
  // Valid port numbers
  it("should return a number for valid port in range", ({ expect }) => {
    const result = validateServerPort("443");
    expect(result).toBe(443);
    expect(typeof result).toBe("number");
  });

  it("should return 0 for minimum valid port", ({ expect }) => {
    const result = validateServerPort("0");
    expect(result).toBe(0);
  });

  it("should return 65535 for maximum valid port", ({ expect }) => {
    const result = validateServerPort("65535");
    expect(result).toBe(65535);
  });

  // Invalid: cannot convert to number
  it("should throw an error for empty string", ({ expect }) => {
    expect(() => validateServerPort("")).toThrowError(
      /Provided server port value cannot be converted to a number:/,
    );
  });

  it("should throw an error for non-numeric string", ({ expect }) => {
    expect(() => validateServerPort("abc")).toThrowError(
      /Provided server port value cannot be converted to a number:/,
    );
  });

  // Invalid: not an integer
  it("should throw an error for decimal numbers", ({ expect }) => {
    expect(() => validateServerPort("80.5")).toThrowError(
      /Provided server port value must be an integer:/,
    );
  });

  // Invalid: out of range
  it("should throw an error for negative port number", ({ expect }) => {
    expect(() => validateServerPort("-1")).toThrowError(
      /Provided server port value must be in range 0-65535:/,
    );
  });

  it("should throw an error for port above maximum", ({ expect }) => {
    expect(() => validateServerPort("65536")).toThrowError(
      /Provided server port value must be in range 0-65535:/,
    );
  });
});
