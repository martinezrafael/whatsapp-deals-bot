import { fetchService } from "../../services/fetchService.js";
import { createSearchParams } from "../../services/createSearchParams.js";

/**
 * Generic function to exchange authorization data for an access token.
 * @param {string} url - The token endpoint URL.
 * @param {object} headers - Required headers (e.g., Content-Type).
 * @param {object} params - Object containing grant_type, client_id, code, etc.
 * @returns {Promise<string|null>} - The access token or null on failure.
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
    // Certifique-se de que a ordem dos argumentos no seu fetchService seja:
    // (url, headers, body, method)
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
