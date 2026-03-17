import * as core from "@actions/core";
import { validateOidcToken } from "./validate";

async function getIdentityToken(
  clientId: string,
  domain: string,
): Promise<string> {
  const tenantId: string = clientId.split(":")[2];
  const url = `https://${tenantId}.id.${domain}`;

  core.info(`Fetching identity token for ${url}`);
  core.debug(`Identity token audience: ${url}`);

  // Request an OpenID Connect (OIDC) token from GitHub's OIDC provider
  const metadata = await core.getIDToken(url);
  const identityToken = Buffer.from(metadata).toString("utf-8");

  // Validate that the token is a valid JWT format
  validateOidcToken(identityToken);

  core.debug("Identity token received and validated successfully");
  return identityToken;
}

export { getIdentityToken };
