import pool from "../config/database.js";
import { searchProduct, saveCatalogToDb } from "../database/catalog.js";
import { gerarLinkAfiliado } from "../services/mercadolivre.js";

/**
 * Orquestra o fluxo: Busca -> Salva Catálogo -> Gera Link -> Salva Oferta
 */
export async function sincronizarNovasOfertas(termoBusca, accessToken) {
  try {
    // 1. Buscar dados na API do Mercado Livre
    console.log(`🔎 Iniciando busca por: "${termoBusca}"`);
    const data = await searchProduct(termoBusca, accessToken);

    if (!data.results || data.results.length === 0) {
      console.log("⚠️ Nenhum produto encontrado na API.");
      return;
    }

    // 2. Salvar/Atualizar no produtos_catalogo
    await saveCatalogToDb(data.results, pool);

    // 3. Processar cada produto para virar uma oferta
    for (const prod of data.results) {
      console.log(`⏳ Processando: ${prod.name}`);

      // Gerar link de afiliado usando sua service (meli.la)
      const linkAfiliado = await gerarLinkAfiliado(prod.permalink);

      if (!linkAfiliado) {
        console.error(`❌ Falha ao gerar link para ${prod.id}. Pulando...`);
        continue;
      }

      // Extração básica de dados técnicos para a tabela de ofertas
      // Você pode expandir isso pegando mais dados do 'prod.attributes'
      const notas =
        prod.attributes?.find((a) => a.id === "SENSORY_NOTES")?.value_name ||
        "";
      const marca =
        prod.attributes?.find((a) => a.id === "BRAND")?.value_name || "N/A";

      // 4. Salvar na tabela 'ofertas'
      // O ON CONFLICT evita duplicar se o link original for o mesmo
      await pool.query(
        `
        INSERT INTO ofertas (
          id_catalogo, 
          titulo_personalizado, 
          preco_oferta, 
          link_afiliado, 
          link_original
        )
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (link_original) DO NOTHING`,
        [prod.id, prod.name, prod.price || 0, linkAfiliado, prod.permalink],
      );
    }

    console.log("✅ Sincronização e geração de ofertas concluída!");
  } catch (error) {
    console.error("❌ Erro no orquestrador:", error.message);
  }
}
