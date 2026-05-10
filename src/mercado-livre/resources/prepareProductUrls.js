import "dotenv/config";
import pool from "../../database/database.js";
import { getAllProducts } from "../../database/databaseService.js";
import { getProductsFromDb } from "../db/dbActions.js";

/**
 * Orquestra todo o processo de preparação de produtos: busca no banco,
 * gera slugs amigáveis e constrói as URLs completas do Mercado Livre.
 *
 * @async
 * @function prepareProductUrls
 * @returns {Promise<{urls: string[], productsMap: object}>} URLs geradas e mapa de referência dos produtos.
 */
export const prepareProductUrls = async () => {
  try {
    const productsMap = {};
    const baseUrlML = process.env.BASE_URL_ML;

    // 1. Busca os produtos diretamente do banco de dados
    const produtos = await getAllProducts();

    if (!produtos || produtos.length === 0) {
      return { urls: [], productsMap: {} };
    }

    // 2. Processa os produtos para gerar as URLs e o mapa
    const urls = produtos.map((item) => {
      // Lógica interna de geração de Slug
      const slug = item.name
        .toString()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim()
        .replace(/%/g, "")
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");

      // Construção do caminho e URL completa
      const path = `${slug}/p/${item.ml_id}`;
      const cleanBase = baseUrlML.endsWith("/")
        ? baseUrlML.slice(0, -1)
        : baseUrlML;
      const fullUrl = `${cleanBase}/${path}`;

      // Popula o mapa de referência (URL -> Objeto do Produto)
      productsMap[fullUrl] = item;

      return fullUrl;
    });

    return { urls, productsMap };
  } catch (error) {
    console.error("[PrepareUrls] Erro ao processar produtos:", error.message);
    throw error;
  }
};
