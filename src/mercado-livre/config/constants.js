import "dotenv/config";

/**
 * @file constants.js
 * @description Configurações para integração com a API do Mercado Livre, incluindo fluxos de autenticação, geração de tokens e busca de produtos.
 */

/**
 * Configurações para a etapa de extração do código de autorização (Auth Code).
 *
 * @type {object}
 * @property {string} authUrl - URL completa para iniciar o fluxo de autorização.
 * @property {object} authHeaders - Cabeçalhos HTTP necessários para simular a requisição de autorização.
 * @property {string} paramName - Nome do parâmetro retornado na URL após o redirecionamento.
 */
export const mlAuthConfig = {
  authUrl: `https://auth.mercadolivre.com.br/authorization?response_type=code&client_id=${process.env.ML_CLIENT_ID}&redirect_uri=${process.env.ML_REDIRECT_URI}`,
  authHeaders: {
    accept:
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
    "accept-language": "pt-BR,pt;q=0.7",
    priority: "u=0, i",
    "sec-ch-ua": '"Brave";v="147", "Not.A/Brand";v="8", "Chromium";v="147"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-model": '""',
    "sec-ch-ua-platform": '"Linux"',
    "sec-ch-ua-platform-version": '""',
    "sec-fetch-dest": "document",
    "sec-fetch-mode": "navigate",
    "sec-fetch-site": "none",
    "sec-fetch-user": "?1",
    "sec-gpc": "1",
    "upgrade-insecure-requests": "1",
    "user-agent":
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    cookie: process.env.COOKIE_URL_GET_CODE,
  },
  paramName: "code",
};

/**
 * Configurações para a troca do código de autorização pelo token de acesso.
 *
 * @type {object}
 * @property {string} tokenUrl - Endpoint da API para geração de tokens OAuth.
 * @property {object} tokenHeaders - Cabeçalhos para a requisição de token.
 * @property {object} baseParams - Parâmetros obrigatórios para o grant_type "authorization_code".
 */
export const mlTokenConfig = {
  tokenUrl: "https://api.mercadolibre.com/oauth/token",
  tokenHeaders: {
    Accept: "application/json",
  },
  baseParams: {
    grant_type: "authorization_code",
    client_id: process.env.ML_CLIENT_ID,
    client_secret: process.env.ML_CLIENT_SECRET,
    redirect_uri: process.env.ML_REDIRECT_URI,
  },
};

/**
 * Configurações para a busca de produtos na API do Mercado Livre.
 *
 * @type {object}
 * @property {string} baseUrl - Endpoint base para pesquisa de produtos.
 * @property {object} headers - Cabeçalhos para requisições de busca.
 * @property {object} defaultParams - Parâmetros padrão (status, site, limite) para as consultas.
 */
export const mlSearchConfig = {
  baseUrl: "https://api.mercadolibre.com/products/search",
  headers: {
    Accept: "application/json",
  },
  defaultParams: {
    status: "active",
    site_id: "MLB",
    limit: 20,
  },
};
