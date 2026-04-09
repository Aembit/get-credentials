import * as core from "@actions/core";
import { getAccessToken } from "./access-token";
import { getCredential, setOutputs } from "./credential";
import { getIdentityToken } from "./identity-token";
import {
  validateClientId,
  validateCredentialType,
  validateServerPort,
} from "./validate";

async function run(): Promise<void> {
  try {
    // Read inputs for action (defined in action.yml file)
    const clientId: string = core.getInput("client-id", {
      required: true,
      trimWhitespace: true,
    });
    const domain: string = core.getInput("domain");
    const serverHost: string = core.getInput("server-host");
    const serverPort: string = core.getInput("server-port");
    const credentialType: string = core.getInput("credential-type", {
      required: true,
    });

    core.debug(
      `Inputs: domain=${domain}, serverHost=${serverHost}, serverPort=${serverPort}, credentialType=${credentialType}`,
    );

    validateClientId(clientId);
    core.info("Client ID is valid ✅");

    // Validate Credential Type
    validateCredentialType(credentialType);
    core.info(`${credentialType} is a valid credential type ✅`);

    const serverPortNum = validateServerPort(serverPort);

    // Get Identity Token
    const identityToken: string = await getIdentityToken(clientId, domain);
    core.info("Identity token obtained ✅");

    // Get Access Token
    const accessToken: string = await getAccessToken(
      clientId,
      identityToken,
      domain,
    );
    core.info("Access token obtained ✅");

    const credentialData = await getCredential(
      credentialType,
      clientId,
      identityToken,
      accessToken,
      domain,
      serverHost,
      serverPortNum,
    );
    setOutputs(credentialData.credentialType, credentialData.data);
    core.info("Credential outputs set ✅");
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    core.debug(`Action failed with error: ${message}`);
    core.setFailed(message);
  }
}

// for testing
export { run };

run();
