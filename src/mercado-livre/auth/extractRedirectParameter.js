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

//const url = `https://auth.mercadolivre.com.br/authorization?response_type=code&client_id=${process.env.ML_CLIENT_ID}&redirect_uri=${process.env.ML_REDIRECT_URI}`;

//const headers = {
//accept:
//"text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
//"accept-language": "pt-BR,pt;q=0.7",
//priority: "u=0, i",
//"sec-ch-ua": '"Brave";v="147", "Not.A/Brand";v="8", "Chromium";v="147"',
//"sec-ch-ua-mobile": "?0",
//"sec-ch-ua-model": '""',
//"sec-ch-ua-platform": '"Linux"',
//"sec-ch-ua-platform-version": '""',
//"sec-fetch-dest": "document",
//"sec-fetch-mode": "navigate",
//"sec-fetch-site": "none",
//"sec-fetch-user": "?1",
//"sec-gpc": "1",
//"upgrade-insecure-requests": "1",
//cookie: process.env.COOKIE_URL_GET_CODE,
//};

//const response = await fetchService(url, headers, null, "GET");

//const finalUrl = response.url;
//const urlObj = new URL(finalUrl);
//const codigo = urlObj.searchParams.get("code");
