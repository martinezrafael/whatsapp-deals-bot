/**
 * Formata a estrutura final da mensagem para o WhatsApp.
 * @param {string} content - Introdução/Conteúdo IA.
 * @param {Array<Object>} [offers=[]] - Lista de ofertas de produtos.
 * @param {string} [offersTitle="📌 *Ofertas Especiais*"] - Cabeçalho das ofertas.
 * @returns {string} Mensagem completa formatada.
 */
export const formatter = (
  content,
  offers = [],
  offersTitle = "📌 *Ofertas Especiais*",
) => {
  const header = `${content}\n\n━━━━━━━━━━━\n\n${offersTitle}\n\n`;

  const body = offers
    .map((offer) => {
      const name = offer.product_name || "Produto";
      const url = offer.product_affiliate_url || "Link indisponível";
      return `🛒 *${name}*\n🔗 ${url}`;
    })
    .join("\n\n");

  return `${header}${body}`.trim();
};
