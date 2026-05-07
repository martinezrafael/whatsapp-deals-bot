/**
 * Generates formatted URLs for a list of resources.
 * @param {Array} items - The list of objects (e.g., products).
 * @param {string} baseUrl - The domain or path (e.g., https://site.com).
 * @param {Function} formatFn - A callback to define the path structure.
 * @returns {Array<string>} - A list of generated URLs.
 */
export const generateResourceUrls = (items, baseUrl, formatFn) => {
  if (!Array.isArray(items)) return [];

  return items.map((item) => {
    // We pass the item to the formatFn so the user can decide
    // which fields to use (slug, id, category, etc.)
    const path = formatFn(item);

    // Ensures there are no double slashes if baseUrl ends with /
    const cleanBase = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
    const cleanPath = path.startsWith("/") ? path : `/${path}`;

    return `${cleanBase}${cleanPath}`;
  });
};
