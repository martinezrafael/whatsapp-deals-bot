import { createSearchParams } from "../../services/createSearchParams.js";
import { fetchService } from "../../services/fetchService.js";
import { getLastToken } from "../db/dbActions.js"; // Ajuste o caminho conforme sua estrutura

/**
 * Função de busca genérica para recursos protegidos da API.
 * @param {string} baseUrl - O endpoint base (ex: https://api.mercadolibre.com/products/search).
 * @param {string} accessToken - O token Bearer para autenticação.
 * @param {object} queryParams - Objeto contendo os filtros de busca (q, limit, status, etc.).
 * @returns {Promise<object>} - A resposta JSON processada.
 */
export const searchResources = async (
  baseUrl,
  accessToken,
  queryParams = {},
) => {
  try {
    if (!accessToken) {
      throw new Error("O token de acesso é obrigatório para realizar a busca.");
    }

    const queryString = createSearchParams(queryParams).toString();
    const url = `${baseUrl}?${queryString}`;

    const headers = {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    };

    const response = await fetchService(url, headers, null, "GET");

    return await response.json();
  } catch (error) {
    console.error(`[SearchResources] Erro em ${baseUrl}:`, error.message);
    throw error;
  }
};

/**
 * Orquestra a busca de produtos utilizando o último token disponível e o termo de busca do ambiente.
 *
 * @async
 * @function fetchSearchData
 * @param {object} config - Configuração de busca (baseUrl e defaultParams).
 * @returns {Promise<object>} - Os dados retornados pela API do Mercado Livre.
 * @throws {Error} - Caso o token não seja encontrado ou a busca falhe.
 */
export const fetchSearchData = async (config) => {
  try {
    // 1. Recupera o token mais recente do banco
    const currentToken = await getLastToken();

    if (!currentToken) {
      throw new Error("Nenhum token de acesso encontrado no banco de dados.");
    }

    // 2. Prepara os parâmetros de busca
    const termoDeBusca = process.env.TERMO_DE_BUSCA;
    const queryParams = {
      ...config.defaultParams,
      q: termoDeBusca,
    };

    // 3. Executa a busca utilizando a função genérica acima
    return await searchResources(config.baseUrl, currentToken, queryParams);
  } catch (error) {
    console.error(
      "[SearchOrchestrator] Erro ao executar fluxo de busca:",
      error.message,
    );
    throw error;
  }
};
