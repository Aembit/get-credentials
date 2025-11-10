import * as core from "@actions/core";

async function getApiKey(
  clientId: string,
  identityToken: string,
  accessToken: string,
  domain: string,
  serverHost: string,
  serverPort: string,
): Promise<string> {
  const tenantId: string = clientId.split(":")[2];
  const url: string = `https://${tenantId}.ec.${domain}/edge/v1/credentials`;

  core.info(`Fetch API Key (url): ${url}`);

  // Request an API key from Credential Provider
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      clientId: clientId,
      client: {
        github: {
          identityToken: identityToken,
        },
      },
      server: {
        host: serverHost,
        port: serverPort,
      },
      credentialType: "ApiKey",
    }),
    redirect: "follow",
  });

  core.info(`Response status: ${response.status}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch access token: ${response.statusText}`);
  }

  const result = (await response.json()) as {
    credentialType: string;
    expiresAt: string;
    data: {
      apiKey: string;
    };
  };

  if (result.credentialType !== "ApiKey") {
    throw new Error(`Invalid credentials type: ${result.credentialType}`);
  }

  // Masking API key.
  core.setSecret(result.data.apiKey);

  return result.data.apiKey;
}

export { getApiKey };
