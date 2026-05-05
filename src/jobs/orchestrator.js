import pool from "../config/database.js";
import { searchProduct, saveCatalogToDb } from "../database/catalog.js";
import { gerarLinkAfiliado } from "../services/mercadolivre.js";

export async function sincronizarNovasOfertas(termoBusca, accessToken) {
  try {
    const data = await searchProduct(termoBusca, accessToken);

    if (!data.results || data.results.length === 0) {
      return;
    }

    await saveCatalogToDb(data.results, pool);

    for (const prod of data.results) {
      // Gerar link de afiliado usando sua service (meli.la)
      const linkAfiliado = await gerarLinkAfiliado(prod.permalink);

      if (!linkAfiliado) {
        console.error(`Falha ao gerar link para ${prod.id}. Pulando...`);
        continue;
      }

      const notas =
        prod.attributes?.find((a) => a.id === "SENSORY_NOTES")?.value_name ||
        "";
      const marca =
        prod.attributes?.find((a) => a.id === "BRAND")?.value_name || "N/A";

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
  } catch (error) {
    console.error("Erro no orquestrador:", error.message);
  }
}
