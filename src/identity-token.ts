import * as core from "@actions/core";
import { validateOidcToken } from "./validate";

async function getIdentityToken(
  clientId: string,
  domain: string,
): Promise<string> {
  const tenantId: string = clientId.split(":")[2];
  const url = `https://${tenantId}.id.${domain}`;

  core.info(`Fetching token ID for ${url}`);

  // Request an OpenID Connect (OIDC) token from GitHub's OIDC provider
  const metadata = await core.getIDToken(url);
  const identityToken = Buffer.from(metadata).toString("utf-8");

  // Validate that the token is a valid JWT format
  validateOidcToken(identityToken);

  return identityToken;
}

export { getIdentityToken };
