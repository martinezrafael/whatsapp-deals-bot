/**
 * Formata a mensagem com foco em conversão e engajamento da comunidade.
 * * @param {string} content - Texto educativo/venda gerado pela IA.
 * @param {Array<Object>} [offers=[]] - Lista de produtos.
 * @param {string} [offersTitle="🔥 *OFERTAS EXCLUSIVAS DE HOJE* 🔥"]
 * @returns {string} Mensagem profissional com Call to Action no rodapé.
 */
/**
 * Formata a mensagem com foco em catálogo profissional e organizado.
 */
export const formatter = (
  content,
  offers = [],
  offersTitle = "🔥 *OFERTAS EXCLUSIVAS DE HOJE* 🔥",
) => {
  // 1. Cabeçalho com linha de preenchimento para garantir largura total
  // O uso de muitos símbolos iguais força o balão a abrir totalmente
  const separator = "━━━━━━━━━━━━━━━━━━━━━━━━━━━━";

  let message = `☕ *CLUBE DO CAFÉ PROMOCOFFE*\n`;
  message += `${separator}\n\n`;
  message += `${content}\n\n`;
  message += `👇 *Confira as seleções especiais abaixo:*\n`;
  message += `${separator}\n\n`;
  message += `${offersTitle}\n\n`;

  // 2. Loop de Ofertas (Estilo Card de Catálogo)
  const body = offers
    .map((offer) => {
      const name = offer.product_name?.toUpperCase() || "CAFÉ ESPECIAL";
      const url = offer.product_affiliate_url || "Link indisponível";

      // Adicionamos um espaço extra ou um ponto invisível se o link for muito curto
      return `✅ *${name}*\n🥇 Qualidade Premium\n🛒 *Compre aqui:* ${url}`;
    })
    .join("\n\n────────────────────────────\n\n"); // Divisória de itens

  // 3. Rodapé Estruturado
  const footer =
    `\n\n${separator}\n` +
    `⚠️ *Atenção:* Os preços podem mudar a qualquer momento.\n\n` +
    `📌 *DICA DE OURO:*\n` +
    `Não encontrou o que queria? Nossa *LISTA DE DESEJOS* está fixada no topo do grupo! Deixe seu pedido lá. 🎯\n\n` +
    `📢 *GOSTOU DAS OFERTAS?*\n` +
    `Convide um amigo apaixonado por café!\n` +
    `👉 https://chat.whatsapp.com/CP57vSDnbeT6bkD3bl2LLZ`;

  return `${message}${body}${footer}`.trim();
};
