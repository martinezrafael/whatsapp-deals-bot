import pkg from "pg";
import { scrapePrice } from "./scraper.js";
const { Pool } = pkg;

const pool = new Pool();

export async function monitorProducts(whatsappClient, groupId) {
  // 1. Busca produtos ativos no seu banco
  const { rows: products } = await pool.query(
    "SELECT product_id, product_name FROM products",
  );

  for (const product of products) {
    const currentData = await scrapePrice(product.product_id);
    if (!currentData) continue;

    // 2. Busca o último preço registrado na nova tabela
    const { rows: lastPriceRow } = await pool.query(
      "SELECT price FROM product_prices WHERE product_id = $1 ORDER BY captured_at DESC LIMIT 1",
      [product.product_id],
    );

    const lastPrice = lastPriceRow[0]?.price;

    // 3. Lógica de Alerta: Preço atual é menor que o último salvo?
    if (!lastPrice || currentData.price < lastPrice) {
      // Salva novo registro de preço
      await pool.query(
        "INSERT INTO product_prices (product_id, price, seller_name) VALUES ($1, $2, $3)",
        [product.product_id, currentData.price, currentData.seller],
      );

      // Se for uma queda real, avisa no WhatsApp
      if (lastPrice && currentData.price < lastPrice) {
        const discount = (
          ((lastPrice - currentData.price) / lastPrice) *
          100
        ).toFixed(0);
        await whatsappClient.sendMessage(
          groupId,
          `📉 *QUEDA DE PREÇO (${discount}%)!* \n\n` +
            `📦 ${product.product_name}\n` +
            `💰 De: ~R$ ${lastPrice}~\n` +
            `✅ Por: *R$ ${currentData.price}*\n\n` +
            `🔗 https://www.mercadolivre.com.br/p/${product.product_id}`,
        );
      }
    }
  }
}
