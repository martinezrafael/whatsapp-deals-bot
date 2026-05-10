import "dotenv/config";
import { getAllProducts } from "../../database/repositories/productRepository.js";
import { slugify } from "../../shared/utils.js";

/**
 * Prepara as URLs amigáveis para cada produto e gera um mapa de correlação.
 * @async
 * @returns {Promise<{urls: string[], productsMap: Object}>} URLs brutas e mapa para vinculação posterior.
 */
export const prepareProductUrls = async () => {
  const produtos = await getAllProducts();
  if (!produtos?.length) return { urls: [], productsMap: {} };

  const baseUrlML = (process.env.BASE_URL_ML || "").replace(/\/$/, "");
  const productsMap = {};

  const urls = produtos.map((item) => {
    const slug = slugify(item.product_name);
    const fullUrl = `${baseUrlML}/${slug}/p/${item.product_id}`;
    productsMap[fullUrl] = item;
    return fullUrl;
  });

  return { urls, productsMap };
};
