import { extractRedirectParameter } from "./extractRedirectParameter.js";
import { generateAccessToken } from "./generateAccessToken.js";

/**
 * Orquestrador para gerenciar o fluxo de obtenção de código e troca por token via API.
 *
 * @async
 * @function authenticateAndFetchToken
 * @param {object} authConfig - Configurações para extração do código de autorização.
 * @param {object} tokenConfig - Configurações para a troca do código pelo token de acesso.
 * @returns {Promise<{code: string, accessToken: string}|null>} Objeto com code e accessToken, ou null.
 */
export const authenticateAndFetchToken = async (authConfig, tokenConfig) => {
  try {
    const code = await extractRedirectParameter(
      authConfig.authUrl,
      authConfig.authHeaders,
      authConfig.paramName,
    );

    if (!code) throw new Error("Falha ao extrair código.");

    const accessToken = await generateAccessToken(
      tokenConfig.tokenUrl,
      tokenConfig.tokenHeaders,
      { ...tokenConfig.baseParams, code },
    );

    return accessToken ? { code, accessToken } : null;
  } catch (error) {
    console.error("[AuthFlow] Erro no fluxo de API:", error.message);
    return null;
  }
};
