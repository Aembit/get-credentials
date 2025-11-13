import { validate as validateUUID } from "uuid";

function validateClientId(clientId: string): boolean {
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

  if (validateUUID(clientIdComponents[5])) {
    throw new Error("Not a valid token.");
  }

  return true;
}

export { validateClientId };

function validateCredentialType(credentialType: string): boolean {
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

  return true;
}

export { validateCredentialType };
