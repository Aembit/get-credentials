import * as core from "@actions/core";

async function getIdentityToken(
  clientId: string,
  domain: string,
): Promise<string> {
  const tenantId: string = clientId.split(":")[2];
  const url = `https://${tenantId}.id.${domain}`;

  core.info(`Fetching token ID for ${url}`);

  // Request an OpenID Connect (OIDC) token from GitHub’s OIDC provider
  const metadata = await core.getIDToken(url);
  const identityToken = Buffer.from(metadata).toString("utf-8");

  return identityToken;
}

export { getIdentityToken };
