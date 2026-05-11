/**
 * Formata a mensagem com foco em conversão e engajamento da comunidade.
 * * @param {string} content - Texto educativo/venda gerado pela IA.
 * @param {Array<Object>} [offers=[]] - Lista de produtos.
 * @param {string} [offersTitle="🔥 *OFERTAS EXCLUSIVAS DE HOJE* 🔥"]
 * @returns {string} Mensagem profissional com Call to Action no rodapé.
 */
export const formatter = (
  content,
  offers = [],
  offersTitle = "🔥 *OFERTAS EXCLUSIVAS DE HOJE* 🔥",
) => {
  // 1. Cabeçalho e Texto da IA
  let message = `☕ *CLUBE DO CAFÉ PROMOCOFFE* \n\n`;
  message += `${content}\n\n`;
  message += `👇 *Confira as seleções especiais abaixo:* \n`;
  message += `━━━━━━━━━━━━━━━━━━\n\n`;
  message += `${offersTitle}\n\n`;

  // 2. Loop de Ofertas (Cards)
  const body = offers
    .map((offer) => {
      const name = offer.product_name?.toUpperCase() || "CAFÉ ESPECIAL";
      const url = offer.product_affiliate_url || "Link indisponível";

      return `✅ *${name}*\n🥇 Qualidade Premium\n🛒 *Compre aqui:* ${url}`;
    })
    .join("\n\n───────────────\n\n");

  // 3. Rodapé Estruturado (Urgência + Engajamento + Lista de Desejos)
  const footer = `
\n━━━━━━━━━━━━━━━━━━
⚠️ *Atenção:* Os preços podem mudar a qualquer momento.

📌 *DICA DE OURO:*
Não encontrou o que queria? Nossa *LISTA DE DESEJOS* está fixada no topo do grupo! Deixe seu pedido lá e eu busco o melhor preço para você. 🎯

📢 *GOSTOU DAS OFERTAS?*
Convide um amigo apaixonado por café para economizar com a gente! Compartilhe o link do grupo:
👉 https://chat.whatsapp.com/CP57vSDnbeT6bkD3bl2LLZ`;

  return `${message}${body}${footer}`.trim();
};
