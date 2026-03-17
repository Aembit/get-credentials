import { setTimeout as sleep } from "node:timers/promises";
import * as core from "@actions/core";
import type { ResponseConfig } from "@kubb/plugin-client/clients/fetch";
import type { EdgeApiAuthMutationResponse } from "../gen";
import { edgeApiAuth } from "../gen";

const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1000;

async function getAccessToken(
  clientId: string,
  identityToken: string,
  domain: string,
): Promise<string> {
  const tenantId: string = clientId.split(":")[2];
  const url: string = `https://${tenantId}.ec.${domain}`;

  core.info(`Fetching access token from ${url}/edge/v1/auth`);
  core.debug(`Access token request: clientId=${clientId}`);

  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    if (attempt > 1) {
      core.debug(
        `Retrying access token fetch (attempt ${attempt}/${MAX_ATTEMPTS}) after ${RETRY_DELAY_MS}ms`,
      );
      await sleep(RETRY_DELAY_MS);
    }

    let response: ResponseConfig<EdgeApiAuthMutationResponse>;
    try {
      response = await edgeApiAuth(
        {
          clientId: clientId,
          client: {
            github: {
              identityToken: identityToken,
            },
          },
        },
        undefined,
        {
          baseURL: url,
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
    } catch (err) {
      core.debug(
        `Attempt ${attempt}/${MAX_ATTEMPTS}: error fetching access token. Error: ${err instanceof Error ? err.message : String(err)}`,
      );
      lastError = err;
      continue;
    }

    core.info(`Access token response status: ${response.status}`);
    core.debug(`Access token response statusText: ${response.statusText}`);

    if (response.status !== 200) {
      throw new Error(`Failed to fetch access token: ${response.statusText}`);
    }

    const data = response.data as { accessToken?: string };
    if (!data || typeof data.accessToken !== "string") {
      throw new Error("Invalid response: missing accessToken");
    }

    core.debug("Access token received successfully");
    return data.accessToken;
  }

  throw new Error(
    `Failed to fetch access token after ${MAX_ATTEMPTS} attempts. Last error: ${lastError instanceof Error ? lastError.message : String(lastError)}`,
  );
}

export { getAccessToken };
