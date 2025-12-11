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

  core.info(`Fetch Credential (url): ${url}/edge/v1/credentials`);

  const response = await edgeApiGetCredentials(
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
  );

  core.info(`Response status: ${response.status}`);
  if (response.status !== 200) {
    throw new Error(`Failed to fetch access token: ${response.statusText}`);
  }

  const credentialData = response.data;

  validateCredentialType(credentialData.credentialType || "");

  if (!credentialData.data) {
    throw new Error(
      `No credential values were included in the server response.`,
    );
  }

  return credentialData as ValidatedApiCredentialsResponse;
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
