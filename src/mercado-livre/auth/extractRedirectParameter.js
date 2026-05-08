import { fetchService } from "../../services/fetchService.js";

/**
 * Extracts a specific parameter from a URL after redirection.
 * @param {string} url - The initial request URL.
 * @param {object} headers - The request headers.
 * @param {string} paramName - The name of the parameter to extract (e.g., 'code').
 * @returns {Promise<string|null>} - The parameter value or null if not found.
 */
export const extractRedirectParameter = async (
  url,
  headers,
  paramName = "code",
) => {
  try {
    // Reuses your generic fetchService
    const response = await fetchService(url, headers, null, "GET");

    // Get the final URL after all redirects
    const finalUrl = response.url;
    const urlObj = new URL(finalUrl);

    // Retrieve the specific parameter value
    const value = urlObj.searchParams.get(paramName);

    return value;
  } catch (error) {
    console.error(
      `[ExtractParameter] Error fetching "${paramName}":`,
      error.message,
    );
    throw error;
  }
};
