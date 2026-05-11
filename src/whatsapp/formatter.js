/**
 * Formata a mensagem final para o WhatsApp com foco em conversão e transparência de preços.
 * OTIMIZAÇÃO: Filtra inconsistências de scrapper e melhora a legibilidade dos cards.
 * * @param {string} content - Conteúdo textual gerado pela IA.
 * @param {Array<Object>} [offers=[]] - Objetos com dados de preço (current, original, discount).
 * @param {string} [offersTitle="🔥 *OFERTAS EXCLUSIVAS DE HOJE* 🔥"]
 * @returns {string} Mensagem formatada.
 */
export const formatter = (
  content,
  offers = [],
  offersTitle = "🔥 *OFERTAS EXCLUSIVAS DE HOJE* 🔥",
) => {
  // 1. Cabeçalho Dinâmico
  let message = `☕ *CLUBE DO CAFÉ PROMOCOFFE* \n\n`;
  message += `${content}\n\n`;
  message += `👇 *Confira as seleções especiais abaixo:* \n`;
  message += `━━━━━━━━━━━━━━━━━━\n\n`;
  message += `${offersTitle}\n\n`;

  // 2. Renderização de Cards de Oferta
  const body = offers
    .map((offer) => {
      // Normalização de Nome e Link
      const name = offer.product_name?.toUpperCase().trim() || "CAFÉ ESPECIAL";
      const url = offer.product_affiliate_url || "Link indisponível";

      // Formatação Monetária (Helper interno)
      const toBRL = (val) =>
        val
          ? parseFloat(val).toLocaleString("pt-BR", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })
          : null;

      const currentStr = toBRL(offer.current_price);
      const originalStr = toBRL(offer.original_price);
      const discount = parseInt(offer.discount_percentage);

      /**
       * PROTEÇÃO CONTRA FALSAS PROMOÇÕES:
       * Só exibe o preço riscado se o desconto for matematicamente real e vantajoso.
       * Isso ignora erros de scrapper que pegam preços de 'Kits' de 1kg para produtos de 250g.
       */
      const isPromoValid =
        offer.original_price &&
        offer.current_price &&
        parseFloat(offer.original_price) > parseFloat(offer.current_price) &&
        discount > 0;

      let priceInfo = "";

      if (isPromoValid) {
        // Layout "De / Por" com destaque visual
        priceInfo = `❌ De: ~~R$ ${originalStr}~~\n✅ *Por: R$ ${currentStr}* 📉 (-${discount}% OFF)`;
      } else if (currentStr) {
        // Layout de Preço Único (Preço limpo/justo)
        priceInfo = `💰 *Preço: R$ ${currentStr}*`;
      } else {
        // Fallback de segurança
        priceInfo = `💰 *Preço: Consulte no site*`;
      }

      return `✅ *${name}*\n${priceInfo}\n🛒 *Compre aqui:* ${url}`;
    })
    .join("\n\n───────────────\n\n");

  // 3. Rodapé e Chamada para Ação (CTA)
  const footer = `
\n━━━━━━━━━━━━━━━━━━
⚠️ *Atenção:* Os preços podem mudar a qualquer momento conforme as regras do Mercado Livre.

📌 *DICA DE OURO:*
Não encontrou o que queria? Nossa *LISTA DE DESEJOS* está fixada no topo do grupo! Peça lá e eu monitoro o preço para você. 🎯

📢 *GOSTOU DAS OFERTAS?*
Convide um amigo apaixonado por café!
👉 https://chat.whatsapp.com/CP57vSDnbeT6bkD3bl2LLZ`;

  return `${message}${body}${footer}`.trim();
};
