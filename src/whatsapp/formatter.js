/**
 * Formata uma mensagem contendo um conteúdo de texto principal e uma lista de ofertas de produtos.
 *
 * @function formatter
 * @param {string} content - O texto principal ou introdução da mensagem.
 * @param {Array<Object>} offers - Lista de objetos de oferta para formatar.
 * @param {string} [offers.product_name] - Nome do produto da oferta.
 * @param {string} [offers.product_affiliate_url] - URL de afiliado do produto.
 * @param {string} [offersTitle="📌 *Ofertas Especiais*"] - Título da seção de ofertas (opcional).
 * @returns {string} A mensagem completa formatada para envio.
 */
export const formatter = (
  content,
  offers,
  offersTitle = "📌 *Ofertas Especiais*",
) => {
  let message = `${content}\n\n━━━━━━━━━━━\n\n${offersTitle}\n\n`;

  offers.forEach((offer) => {
    const name = offer.product_name || "Produto sem nome";
    const url = offer.product_affiliate_url || "Link indisponível";

    message += `🛒 *${name}*\n🔗 ${url}\n\n`;
  });

  return message.trim();
};
