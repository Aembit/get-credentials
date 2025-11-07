import * as core from "@actions/core";

import { getIdentityToken } from "./identity-token";

async function run(): Promise<void> {
  try {
    // Read inputs for action (defined in action.yml file)
    const clientId: string = core.getInput("client-id");
    const domain: string = core.getInput("domain");

    const identityToken = await getIdentityToken(clientId, domain);
  } catch (error) {
    core.setFailed(`${(error as any)?.message ?? error}`);
  }
}

run();
