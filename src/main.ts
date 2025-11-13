import * as core from "@actions/core";

import { getIdentityToken } from "./identity-token";
import { getAccessToken } from "./access-token";
import { getApiKey } from "./api-key";
import { validateClientId, validateCredentialType } from "./validate";

async function run(): Promise<void> {
  try {
    // Read inputs for action (defined in action.yml file)
    const clientId: string = core.getInput("client-id");
    const domain: string = core.getInput("domain");
    const serverHost: string = core.getInput("server-host");
    const serverPort: string = core.getInput("server-port");
    const credentialType: string = core.getInput("credential-type");

    // Validate Client ID
    const isClientIdValid: boolean = validateClientId(clientId);
    if (isClientIdValid) {
      core.info("Client ID is valid ✅");
    }

    // Validate Credential Type
    const isCredentialTypeValid: boolean =
      validateCredentialType(credentialType);
    if (isCredentialTypeValid) {
      core.info(`${credentialType} is a valid credential type ✅`);
    }

    // Get Identity Token
    const identityToken: string = await getIdentityToken(clientId, domain);

    // Get Access Token
    const accessToken: string = await getAccessToken(
      clientId,
      identityToken,
      domain,
    );

    switch (credentialType) {
      case "ApiKey":
        // Get API key
        const apiKey: string = await getApiKey(
          clientId,
          identityToken,
          accessToken,
          domain,
          serverHost,
          serverPort,
        );

        core.setOutput("api-key", apiKey);
        break;
      default:
        throw new Error("Something went wrong ⚠️");
        break;
    }
  } catch (error) {
    core.setFailed(`${(error as any)?.message ?? error}`);
  }
}

run();
