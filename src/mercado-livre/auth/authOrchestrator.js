import { extractRedirectParameter } from "./extractRedirectParameter.js";
import { generateAccessToken } from "./generateAccessToken.js";

/**
 * Orquestrador genérico para gerenciar o fluxo completo de código de autorização OAuth2.
 * @param {object} authConfig - Configuração para extração do código (url, cabeçalhos, nome do parâmetro).
 * @param {object} tokenConfig - Configuração para troca do código pelo token (url, cabeçalhos, parâmetros base).
 * @returns {Promise<object|null>} - Objeto contendo o código e o token de acesso resultante.
 */
export const authenticateAndFetchToken = async (authConfig, tokenConfig) => {
  try {
    const { authUrl, authHeaders, paramName = "code" } = authConfig;

    const { tokenUrl, tokenHeaders, baseParams } = tokenConfig;

    // 1. Passo: Extrair o código de autorização
    const code = await extractRedirectParameter(
      authUrl,
      authHeaders,
      paramName,
    );

    if (!code) {
      throw new Error(`Falha ao extrair "${paramName}" do redirecionamento.`);
    }

    // 2. Passo: Preparar parâmetros e trocar pelo token de acesso
    // Mesclamos o código extraído aos parâmetros base (client_id, secret, etc.)
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
      throw new Error("Falha ao recuperar o token de acesso do provedor.");
    }

    // 3. Retornar um payload genérico
    return {
      code,
      accessToken,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error("[AuthOrchestrator] Erro no fluxo:", error.message);
    return null;
  }
};
