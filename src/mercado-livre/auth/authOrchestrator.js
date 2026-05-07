import { extractRedirectParameter } from "./extractRedirectParameter.js";
import { generateAccessToken } from "./generateAccessToken.js";

/**
 * Generic orchestrator to handle the full OAuth2 authorization code flow.
 * @param {object} authConfig - Config for extracting the code (url, headers, paramName).
 * @param {object} tokenConfig - Config for exchanging code for token (url, headers, baseParams).
 * @returns {Promise<object|null>} - Object containing the code and the resulting access token.
 */
export const authenticateAndFetchToken = async (authConfig, tokenConfig) => {
  try {
    const { authUrl, authHeaders, paramName = "code" } = authConfig;

    const { tokenUrl, tokenHeaders, baseParams } = tokenConfig;

    // 1. Step: Extract the authorization code
    const code = await extractRedirectParameter(
      authUrl,
      authHeaders,
      paramName,
    );

    if (!code) {
      throw new Error(`Failed to extract "${paramName}" from redirection.`);
    }

    // 2. Step: Prepare parameters and exchange for access token
    // We merge the extracted code into the base parameters (client_id, secret, etc.)
    const fullTokenParams = {
      ...baseParams,
      [paramName]: code,
    };

    const accessToken = await generateAccessToken(
      tokenUrl,
      tokenHeaders,
      fullTokenParams,
    );

    if (!accessToken) {
      throw new Error("Failed to retrieve access token from the provider.");
    }

    // 3. Return a generic payload
    return {
      code,
      accessToken,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error("[AuthOrchestrator] Flow error:", error.message);
    return null;
  }
};
