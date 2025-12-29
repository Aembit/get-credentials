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

    validateClientId(clientId);
    core.info("Client ID is valid ✅");

    // Validate Credential Type
    validateCredentialType(credentialType);
    core.info(`${credentialType} is a valid credential type ✅`);

    const serverPortNum = validateServerPort(serverPort);

    // Get Identity Token
    const identityToken: string = await getIdentityToken(clientId, domain);

    // Get Access Token
    const accessToken: string = await getAccessToken(
      clientId,
      identityToken,
      domain,
    );

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
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    core.setFailed(message);
  }
}

// for testing
export { run };

run();
