import { fetchService } from "../../services/fetchService";

/**
 * Generates affiliate links for a list of URLs.
 * @param {string[]} urls - List of original product URLs.
 * @param {string} endpoint - The affiliate API endpoint.
 * @param {object} headers - Required headers (tokens, cookies, origin, etc.).
 * @param {string} affiliateTag - The affiliate identifier/tag.
 * @returns {Promise<string[]>} - List of shortened affiliate URLs.
 */
export const generateAffiliateLinks = async (
  urls,
  endpoint,
  headers,
  affiliateTag,
) => {
  const shortLinks = [];

  for (const url of urls) {
    try {
      const payload = {
        urls: [url],
        tag: affiliateTag,
      };

      const response = await fetchService(endpoint, headers, payload, "POST");
      const data = await response.json();

      // ML structure: data.urls is an array of objects containing short_url
      const shortUrl = data?.urls?.[0]?.short_url;

      if (shortUrl) {
        shortLinks.push(shortUrl);
      }
    } catch (error) {
      console.warn(
        `[AffiliateGen] Failed to shorten URL: ${url}`,
        error.message,
      );
    }
  }

  return shortLinks;
};
