import * as core from "@actions/core";
import { edgeApiAuth } from "../gen/client/edgeApiAuth";

async function getAccessToken(
  clientId: string,
  identityToken: string,
  domain: string,
): Promise<string> {
  const tenantId: string = clientId.split(":")[2];
  const url: string = `https://${tenantId}.ec.${domain}`;

  core.info(`Fetch access token (url): ${url}/edge/v1/auth`);

  // Request an access token from Aembit Edge server
  const response = await edgeApiAuth(
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

  core.info(`Response status: ${response.status}`);
  if (response.status !== 200) {
    throw new Error(`Failed to fetch access token: ${response.statusText}`);
  }

  const data = response.data as { accessToken?: string };
  if (!data || typeof data.accessToken !== "string") {
    throw new Error("Invalid response: missing accessToken");
  }
  return data.accessToken;
}

export { getAccessToken };
