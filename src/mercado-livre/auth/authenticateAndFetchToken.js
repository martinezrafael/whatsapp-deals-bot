import { extractRedirectParameter } from "./extractRedirectParameter.js";
import { generateAccessToken } from "./generateAccessToken.js";

/**
 * Orquestrador genérico para gerenciar o fluxo completo de obtenção de código de autorização e troca por token OAuth2.
 *
 * @async
 * @function authenticateAndFetchToken
 * @param {object} authConfig - Configuração para extração do código.
 * @param {string} authConfig.authUrl - URL de autorização para extração do redirecionamento.
 * @param {object} authConfig.authHeaders - Cabeçalhos HTTP para a requisição de autorização.
 * @param {string} [authConfig.paramName="code"] - Nome do parâmetro de consulta que contém o código.
 * @param {object} tokenConfig - Configuração para troca do código pelo token de acesso.
 * @param {string} tokenConfig.tokenUrl - URL do endpoint de token do provedor.
 * @param {object} tokenConfig.tokenHeaders - Cabeçalhos HTTP para a requisição de token.
 * @param {object} tokenConfig.baseParams - Parâmetros base (client_id, client_secret, redirect_uri, etc.).
 * @returns {Promise<object|null>} Objeto contendo o código, o token de acesso e o timestamp, ou null em caso de falha.
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
    console.error("[authenticateAndFetchToken] Erro no fluxo:", error.message);
    return null;
  }
};
