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
