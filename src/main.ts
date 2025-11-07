import * as core from "@actions/core";

import { getIdentityToken } from "./identity-token";
import { getAccessToken } from "./access-token";
import { getApiKey } from "./api-key";

async function run(): Promise<void> {
  try {
    // Read inputs for action (defined in action.yml file)
    const clientId: string = core.getInput("client-id");
    const domain: string = core.getInput("domain");
    const serverHost: string = core.getInput("server-host");
    const serverPort: string = core.getInput("server-port");

    // Get Identity Token
    const identityToken: string = await getIdentityToken(clientId, domain);

    // Get Access Token
    const accessToken: string = await getAccessToken(
      clientId,
      identityToken,
      domain,
    );

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
  } catch (error) {
    core.setFailed(`${(error as any)?.message ?? error}`);
  }
}

run();
