/**
 * Generic service to handle fetch requests.
 * @param {string} url - The target URL.
 * @param {object} headers - Custom headers.
 * @param {object|URLSearchParams|null} body - The data to be sent.
 * @param {string} method - The HTTP method (GET, POST, etc.).
 * @returns {Promise<Response>} - The fetch response object.
 */
export const fetchService = async (
  url,
  headers = {},
  body = null,
  method = "GET",
) => {
  const config = {
    method,
    headers: { ...headers },
  };

  // 1. Verificação inteligente do corpo da requisição
  if (body && !["GET", "HEAD"].includes(method.toUpperCase())) {
    if (body instanceof URLSearchParams) {
      // Se for URLSearchParams, o fetch define o Content-Type de formulário automaticamente
      config.body = body;
    } else {
      // Se for um objeto comum, envia como JSON
      config.headers["Content-Type"] = "application/json";
      config.body = JSON.stringify(body);
    }
  }

  const response = await fetch(url, config);

  // 2. Debug de erro aprimorado
  if (!response.ok) {
    // Tenta capturar o JSON de erro da API (ex: o que o ML diz que está errado)
    const errorBody = await response.json().catch(() => null);

    if (errorBody) {
      console.error(
        "DEBUG - API Error Response:",
        JSON.stringify(errorBody, null, 2),
      );
    }

    throw new Error(`Request error: ${response.status} ${response.statusText}`);
  }

  return response;
};
