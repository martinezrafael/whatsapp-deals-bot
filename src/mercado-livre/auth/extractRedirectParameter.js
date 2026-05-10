import { fetchService } from "../../shared/fetchService.js";

/**
 * Extrai um parâmetro específico de uma URL após o processamento de redirecionamentos.
 *
 * @async
 * @function extractRedirectParameter
 * @param {string} url - A URL inicial da requisição.
 * @param {object} headers - Os cabeçalhos da requisição.
 * @param {string} [paramName="code"] - O nome do parâmetro a ser extraído da query string.
 * @returns {Promise<string|null>} O valor do parâmetro encontrado ou null caso não exista.
 */
export const extractRedirectParameter = async (
  url,
  headers,
  paramName = "code",
) => {
  const response = await fetchService(url, headers, null, "GET");

  const urlObj = new URL(response.url);
  return urlObj.searchParams.get(paramName);
};
