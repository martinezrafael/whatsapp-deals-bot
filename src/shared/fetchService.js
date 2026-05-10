/**
 * Serviço genérico para lidar com requisições HTTP utilizando a API fetch.
 *
 * @async
 * @function fetchService
 * @param {string} url - A URL de destino da requisição.
 * @param {object} [headers={}] - Cabeçalhos personalizados para a requisição.
 * @param {object|URLSearchParams|null} [body=null] - Os dados a serem enviados no corpo da requisição.
 * @param {string} [method="GET"] - O método HTTP (GET, POST, PUT, DELETE, etc.).
 * @returns {Promise<Response>} O objeto de resposta (Response) do fetch.
 * @throws {Error} Lança um erro se a resposta não for bem-sucedida (status fora do intervalo 200-299).
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

  // Configuração do corpo da requisição para métodos que permitem payload
  if (body && !["GET", "HEAD"].includes(method.toUpperCase())) {
    if (body instanceof URLSearchParams) {
      config.body = body;
    } else {
      config.headers["Content-Type"] = "application/json";
      config.body = JSON.stringify(body);
    }
  }

  const response = await fetch(url, config);

  if (!response.ok) {
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
