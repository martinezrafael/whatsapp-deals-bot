import { fetchService } from "../../services/fetchService.js";
import { createSearchParams } from "../../services/createSearchParams.js";

/**
 * Função genérica para trocar dados de autorização por um token de acesso (access token).
 *
 * @async
 * @function generateAccessToken
 * @param {string} url - A URL do endpoint de token.
 * @param {object} headers - Cabeçalhos necessários (ex: Content-Type).
 * @param {object} params - Objeto contendo grant_type, client_id, code, etc.
 * @param {string} params.code - O código de autorização obrigatório.
 * @returns {Promise<string|null>} Retorna o access token em caso de sucesso ou null em caso de falha.
 */
export const generateAccessToken = async (url, headers, params) => {
  try {
    // 1. Validação básica de presença do código
    if (!params?.code) {
      console.error(
        "[GenerateAccessToken] Missing authorization code in params.",
      );
      return null;
    }

    // 2. Convertemos o objeto simples para URLSearchParams
    // Isso gera o formato: grant_type=authorization_code&client_id=...
    const bodyPayload = createSearchParams(params);

    // 3. Chamada ao fetchService
    // A ordem dos argumentos no fetchService deve ser: (url, headers, body, method)
    const response = await fetchService(url, headers, bodyPayload, "POST");

    const data = await response.json();

    if (data?.access_token) {
      return data.access_token;
    }

    console.error("[GenerateAccessToken] API error response:", data);
    return null;
  } catch (error) {
    console.error("[GenerateAccessToken] Request failed:", error.message);
    return null;
  }
};
