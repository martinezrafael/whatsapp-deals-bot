/**
 * Transforma uma string em um slug amigável para URLs.
 * Remove acentos, caracteres especiais e substitui espaços por hífens.
 *
 * @function slugify
 * @param {string|number} text - O texto original (ex: nome do produto).
 * @returns {string} O texto formatado como slug ou "produto" como fallback.
 */
export const slugify = (text) => {
  if (!text) return "produto";
  return text
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
};
