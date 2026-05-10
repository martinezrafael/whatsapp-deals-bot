import { fetchService } from "../../services/fetchService.js";

/**
 * Extrai um parâmetro específico de uma URL após o processamento de redirecionamentos.
 *
 * @async
 * @function extractRedirectParameter
 * @param {string} url - A URL inicial da requisição.
 * @param {object} headers - Os cabeçalhos da requisição.
 * @param {string} [paramName="code"] - O nome do parâmetro a ser extraído (ex: 'code').
 * @returns {Promise<string|null>} O valor do parâmetro encontrado ou null caso não exista.
 * @throws {Error} Caso ocorra uma falha na requisição ou no processamento da URL.
 */
export const extractRedirectParameter = async (
  url,
  headers,
  paramName = "code",
) => {
  try {
    // Realiza a requisição utilizando o serviço genérico de busca
    const response = await fetchService(url, headers, null, "GET");

    // Obtém a URL final após todos os redirecionamentos processados pelo fetch
    const finalUrl = response.url;
    const urlObj = new URL(finalUrl);

    // Recupera o valor do parâmetro específico da query string
    const value = urlObj.searchParams.get(paramName);

    return value;
  } catch (error) {
    console.error(
      `[ExtractParameter] Erro ao buscar "${paramName}":`,
      error.message,
    );
    throw error;
  }
};
