import { version as uuidVersion, validate as validateUUID } from "uuid";
import {
  type CredentialProviderTypes,
  credentialProviderTypesEnum,
} from "../gen";

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

  if (
    !validateUUID(clientIdComponents[5]) ||
    uuidVersion(clientIdComponents[5]) !== 4
  ) {
    throw new Error("Not a valid token.");
  }

  return;
}

function validateCredentialType(credentialType: string) {
  if (
    !Object.values(credentialProviderTypesEnum).includes(
      credentialType as CredentialProviderTypes,
    )
  ) {
    throw new Error(
      `Invalid or currently unsupported credential type. Valid credential types are: ${Object.values(credentialProviderTypesEnum).join(", ")}`,
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

function validateServerPort(port: string): number {
  if (port.trim() === "") {
    throw new Error(
      `Provided server port value cannot be converted to a number: ${port}`,
    );
  }

  const portNumber = Number(port);

  if (Number.isNaN(portNumber)) {
    throw new Error(
      `Provided server port value cannot be converted to a number: ${port}`,
    );
  }

  if (!Number.isInteger(portNumber)) {
    throw new Error(`Provided server port value must be an integer: ${port}`);
  }

  if (portNumber < 0 || portNumber > 65535) {
    throw new Error(
      `Provided server port value must be in range 0-65535: ${portNumber}`,
    );
  }

  return portNumber;
}

export {
  validateClientId,
  validateCredentialType,
  validateOidcToken,
  validateServerPort,
};
