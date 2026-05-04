module.exports = {
  formatOffer(offer) {
    return (
      `🔥 *${offer.titulo}*\n\n` +
      `💰 *R$ ${offer.preco}*\n\n` +
      `🛒 Link: ${offer.link_afiliado}\n\n` +
      `📅 Oferta de hoje!`
    );
  },
};
