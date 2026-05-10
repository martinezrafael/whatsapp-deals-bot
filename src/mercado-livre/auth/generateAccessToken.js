import { fetchService } from "../../shared/fetchService.js";
import { createSearchParams } from "../../shared/createSearchParams.js";

/**
 * Troca dados de autorização (como um authorization code) por um token de acesso (access token).
 *
 * @async
 * @function generateAccessToken
 * @param {string} url - A URL do endpoint de token do provedor.
 * @param {object} headers - Cabeçalhos HTTP necessários para a requisição.
 * @param {object} params - Objeto contendo os parâmetros da requisição (grant_type, code, client_id, etc).
 * @returns {Promise<string|null>} Retorna o access token em caso de sucesso ou null em caso de falha.
 */
export const generateAccessToken = async (url, headers, params) => {
  if (!params?.code) return null;

  try {
    const bodyPayload = createSearchParams(params);
    const response = await fetchService(url, headers, bodyPayload, "POST");
    const data = await response.json();

    return data?.access_token || null;
  } catch (error) {
    return null;
  }
};
