export const formatCoffeeOffer = (o) => {
  return `☕ *PROMOCOFFE | Oferta Selecionada*
            \n${o.subtitulo || ""}
            ${o.descricao_curta || ""} 🌋
            \n🏆 *Pontuação:* ${o.pontuacao || "N/A"}
            ✨ *Perfil:* ${o.perfil || ""}
            🍋 *Acidez:* ${o.acidez || ""}
            🗓️ *Torra:* ${o.torra || "Artesanal e fresca"}
            ⚖️ *Peso:* ${o.peso || "1kg"}
            \n🛒 *COMO COMPRAR:*
            🔍 Copie e cole no buscador do Mercado Livre:
            *${o.sku_ml || ""}*
            \n🔗 Ou acesse o link direto:
            ${o.link_afiliado}
    `;
};
