export const formatter = (
  content,
  offers,
  offersTitle = "📌 *Ofertas Especiais*",
) => {
  const formattedOffers = offers
    .map((offer) => {
      return `🛒 ${offer.name}\n${offer.short_url}`;
    })
    .join("\n\n");

  return `${content.content}\n\n━━━━━━━━━━━\n\n${offersTitle}\n\n${formattedOffers}`;
};
