import * as core from "@actions/core";

async function getAccessToken(
  clientId: string,
  identityToken: string,
  domain: string,
): Promise<string> {
  const tenantId: string = clientId.split(":")[2];
  const url: string = `https://${tenantId}.ec.${domain}/edge/v1/auth`;

  core.info(`Fetch access token (url): ${url}`);

  // Request an access token from Aembit Edge server
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      clientId: clientId,
      client: {
        github: {
          identityToken: identityToken,
        },
      },
    }),
  });

  core.info(`Response status: ${response.status}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch access token: ${response.statusText}`);
  }

  const data = (await response.json()) as { accessToken?: string };
  if (!data || typeof data.accessToken !== "string") {
    throw new Error("Invalid response: missing accessToken");
  }
  return data.accessToken;
}

export { getAccessToken };
