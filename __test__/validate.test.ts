import { v4 as uuidv4, v6 as uuidv6 } from "uuid";
import { describe, it } from "vitest";
import { validateClientId, validateCredentialType } from "../src/validate";

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
      /^Invalid or supported credential type\. Valid credential types are:.*/,
    );
  });
});
