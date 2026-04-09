import { setTimeout as sleep } from "node:timers/promises";
import * as core from "@actions/core";
import {
  type CredentialProviderTypes,
  credentialProviderTypesEnum,
  type EdgeCredentials,
  edgeApiGetCredentials,
} from "../gen";
import { validateCredentialType } from "./validate";

export type ValidatedApiCredentialsResponse = {
  credentialType: string;
  data: EdgeCredentials;
  expiresAt: string | null;
};

const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1000;

function isJsonParseError(error: unknown): error is SyntaxError {
  return (
    error instanceof SyntaxError && error.message.toLowerCase().includes("json")
  );
}

async function getCredential(
  credentialType: string,
  clientId: string,
  identityToken: string,
  accessToken: string,
  domain: string,
  serverHost: string,
  serverPort: number,
): Promise<ValidatedApiCredentialsResponse> {
  const tenantId: string = clientId.split(":")[2];
  const url: string = `https://${tenantId}.ec.${domain}`;

  core.info(`Fetching credential from ${url}/edge/v1/credentials`);
  core.debug(
    `Credential request: credentialType=${credentialType}, serverHost=${serverHost}, serverPort=${serverPort}`,
  );

  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    if (attempt > 1) {
      core.debug(
        `Retrying credential fetch (attempt ${attempt}/${MAX_ATTEMPTS}) after ${RETRY_DELAY_MS}ms`,
      );
      await sleep(RETRY_DELAY_MS);
    }

    const result = await edgeApiGetCredentials(
      {
        client: {
          github: {
            identityToken: identityToken,
          },
        },
        server: {
          host: serverHost,
          port: serverPort,
        },
        credentialType: credentialType as CredentialProviderTypes,
      },
      undefined,
      {
        baseURL: url,
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      },
    ).then(
      (res) => ({ ok: true as const, response: res }),
      (err: unknown) => {
        if (!isJsonParseError(err)) throw err;
        return { ok: false as const, error: err };
      },
    );

    if (!result.ok) {
      core.debug(
        `Attempt ${attempt}/${MAX_ATTEMPTS}: received a JSON parse error from the credential endpoint. The response body may be empty or malformed. Error: ${result.error.message}`,
      );
      lastError = result.error;
      continue;
    }

    const response = result.response;
    core.info(`Credential response status: ${response.status}`);
    core.debug(`Credential response statusText: ${response.statusText}`);

    if (response.status !== 200) {
      throw new Error(`Failed to fetch credential: ${response.statusText}`);
    }

    const credentialData = response.data;
    core.debug(
      `Credential response credentialType: ${credentialData.credentialType}`,
    );

    validateCredentialType(credentialData.credentialType || "");

    if (!credentialData.data) {
      throw new Error(
        `No credential values were included in the server response.`,
      );
    }

    core.debug("Credential data received and validated successfully");
    return credentialData as ValidatedApiCredentialsResponse;
  }

  throw new Error(
    `Failed to parse the credential response after ${MAX_ATTEMPTS} attempts: received an empty or malformed JSON body. Last error: ${lastError instanceof Error ? lastError.message : String(lastError)}`,
  );
}

function setOutputs(credentialType: string, credential: EdgeCredentials) {
  switch (credentialType) {
    case credentialProviderTypesEnum.ApiKey:
      if (credential.apiKey) {
        core.setSecret(credential.apiKey);
        core.setOutput("api-key", credential.apiKey);
      } else {
        throw new Error("API key was missing in response from server.");
      }
      return;
    case credentialProviderTypesEnum.OAuthToken:
      if (credential.token) {
        core.setSecret(credential.token);
        core.setOutput("token", credential.token);
      } else {
        throw new Error("OAuthToken was missing in response from server.");
      }
      return;
    case credentialProviderTypesEnum.GoogleWorkloadIdentityFederation:
      if (credential.token) {
        core.setSecret(credential.token);
        core.setOutput("token", credential.token);
      } else {
        throw new Error(
          "Google Workload Identity Federation token was missing in response from server.",
        );
      }
      return;
    case credentialProviderTypesEnum.UsernamePassword:
      if (credential.username && credential.password) {
        core.setSecret(credential.username);
        core.setSecret(credential.password);
        core.setOutput("username", credential.username);
        core.setOutput("password", credential.password);
      } else {
        throw new Error(
          "Username or password was missing in response from server.",
        );
      }
      return;
    case credentialProviderTypesEnum.AwsStsFederation:
      if (
        credential.awsAccessKeyId &&
        credential.awsSecretAccessKey &&
        credential.awsSessionToken
      ) {
        core.setSecret(credential.awsAccessKeyId);
        core.setSecret(credential.awsSecretAccessKey);
        core.setSecret(credential.awsSessionToken);
        core.setOutput("aws-access-key-id", credential.awsAccessKeyId);
        core.setOutput("aws-secret-access-key", credential.awsSecretAccessKey);
        core.setOutput("aws-session-token", credential.awsSessionToken);
      } else {
        throw new Error(
          "AWS credentials were missing in response from server.",
        );
      }
      return;
    default:
      throw new Error(
        `Invalid or currently unsupported credential type: ${credentialType}`,
      );
  }
}

export { getCredential, setOutputs };
