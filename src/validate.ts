import { version as uuidVersion, validate as validateUUID } from "uuid";

function validateClientId(clientId: string) {
  // Splitting client ID for validating each component
  const clientIdComponents: string[] = clientId.split(":");

  if (clientIdComponents[0] !== "aembit") {
    throw new Error("Client ID should start with aembit.");
  }

  if (!/^[0-9a-f]{6}$/.test(clientIdComponents[2])) {
    throw new Error("Client ID contains invalid tenant ID.");
  }

  if (clientIdComponents[3] !== "identity") {
    throw new Error("Client ID does not appear to be for type identity.");
  }

  if (clientIdComponents[4] !== "github_idtoken") {
    throw new Error("Client ID does not appear to be of type GitHub ID token.");
  }

  const id = clientIdComponents[5].trim();
  if (!validateUUID(id) || uuidVersion(id) !== 4) {
    throw new Error("Not a valid token.");
  }

  return;
}

function validateCredentialType(credentialType: string) {
  enum CredentialTypes {
    ApiKey = "ApiKey",
  }

  if (
    !Object.values(CredentialTypes).includes(credentialType as CredentialTypes)
  ) {
    throw new Error(
      `Invalid or supported credential type. Valid credential types are: ${Object.values(CredentialTypes).join(", ")}`,
    );
  }

  return;
}

function validateOidcToken(token: string) {
  // Validate that the token is not empty
  if (!token || token.trim() === "") {
    throw new Error("Identity token is empty");
  }

  // Validate that the token is a valid JWT format (3 parts separated by dots)
  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new Error("Identity token is not in valid JWT format");
  }

  // Validate each part is base64url encoded (only alphanumeric, -, _, and =)
  const base64UrlRegex = /^[A-Za-z0-9_-]+={0,2}$/;
  for (const part of parts) {
    if (!part || !base64UrlRegex.test(part)) {
      throw new Error("Identity token contains invalid base64url encoding");
    }
  }

  return;
}

export { validateClientId, validateCredentialType, validateOidcToken };
