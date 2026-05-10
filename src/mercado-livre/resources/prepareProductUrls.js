import "dotenv/config";
import pool from "../../database/config/pool.js";
import { getAllProducts } from "../../database/repositories/productRepository.js";

/**
 * Orquestra todo o processo de preparação de produtos: busca no banco,
 * gera slugs amigáveis e constrói as URLs completas do Mercado Livre.
 *
 * @async
 * @function prepareProductUrls
 * @returns {Promise<{urls: string[], productsMap: Object}>} Objeto contendo o array de URLs geradas e um mapa de referência (URL -> Produto).
 * @throws {Error} Lança um erro caso ocorra falha na busca ou no processamento dos produtos.
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
      /**
       * Lógica interna de geração de Slug:
       * - Normaliza caracteres (remove acentos)
       * - Converte para minúsculas
       * - Remove caracteres especiais
       * - Substitui espaços por hífens
       */
      const slug = (item.product_name || item.name || "produto")
        .toString()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim()
        .replace(/%/g, "")
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");

      // Construção do caminho e URL completa utilizando product_id ou ml_id
      const productId = item.product_id || item.ml_id;
      const path = `${slug}/p/${productId}`;

      // Garante que a base não termine com barra para evitar barras duplas
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
