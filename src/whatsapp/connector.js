import { formatter } from "./formatter.js";

/**
 * Envia uma mensagem formatada e profissional via WhatsApp.
 * * @async
 * @function sendMessage
 * @param {Object} client - Instância do cliente whatsapp-web.js.
 * @param {string} chatId - ID único do chat ou grupo de destino.
 * @param {string} content - O conteúdo textual educativo/venda gerado pela IA.
 * @param {Array<Object>} offers - Lista de objetos de oferta contendo nome e url.
 * @param {string} [offersTitle] - Título opcional (se omitido, usa o padrão do formatter).
 * @returns {Promise<Object>} O objeto da mensagem enviada.
 */
export const sendMessage = async (
  client,
  chatId,
  content,
  offers,
  offersTitle,
) => {
  const formattedMessage = formatter(content, offers, offersTitle);

  const sentMessage = await client.sendMessage(chatId, formattedMessage, {
    linkPreview: false,
  });

  if (sentMessage) {
    const info = await sentMessage.getInfo();
    console.log(
      "[WhatsApp] Mensagem profissional enviada com sucesso sem preview de link.",
    );
  }

  return sentMessage;
};
