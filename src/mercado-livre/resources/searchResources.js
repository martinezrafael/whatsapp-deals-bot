import { createSearchParams } from "../../services/createSearchParams.js";
import { fetchService } from "../../services/fetchService.js";

/**
 * Generic search function for protected API resources.
 * @param {string} baseUrl - The base endpoint (e.g., https://api.mercadolibre.com/products/search).
 * @param {string} accessToken - The Bearer token for authentication.
 * @param {object} queryParams - Object containing search filters (q, limit, status, etc.).
 * @returns {Promise<object>} - The parsed JSON response.
 */
export const searchResources = async (
  baseUrl,
  accessToken,
  queryParams = {},
) => {
  try {
    if (!accessToken) {
      throw new Error("Access token is required for searching.");
    }

    // Convert query object to string: { q: "Café", limit: 10 } -> "q=Café&limit=10"
    const queryString = createSearchParams(queryParams).toString();
    const url = `${baseUrl}?${queryString}`;

    const headers = {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    };

    // Reusing our motor: fetchService
    const response = await fetchService(url, headers, null, "GET");

    return await response.json();
  } catch (error) {
    console.error(`[SearchResources] Error at ${baseUrl}:`, error.message);
    throw error;
  }
};
