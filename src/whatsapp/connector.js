import { formatter } from "./formatter.js";

/**
 * Envia uma mensagem formatada via WhatsApp.
 * @async
 * @param {Object} client - Instância do cliente.
 * @param {string} chatId - ID do chat/grupo.
 * @param {string} content - Texto base.
 * @param {Array<Object>} offers - Lista de ofertas.
 * @param {string} [offersTitle] - Título da seção de ofertas.
 * @returns {Promise<Object>} Objeto da mensagem enviada.
 */
export const sendMessage = async (
  client,
  chatId,
  content,
  offers,
  offersTitle,
) => {
  const sentMessage = await client.sendMessage(
    chatId,
    formatter(content, offers, offersTitle),
  );

  if (sentMessage) {
    const info = await sentMessage.getInfo();
    console.log(
      "[WhatsApp] Mensagem entregue. Info:",
      info?.deliveryScore || "OK",
    );
  }

  return sentMessage;
};
