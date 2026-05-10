import { formatter } from "./formatter.js";

/**
 * Envia uma mensagem formatada para um chat específico e recupera informações de entrega/leitura.
 *
 * @async
 * @function sendMessage
 * @param {object} client - Instância do cliente de mensagens.
 * @param {string} chatId - ID único do chat para onde a mensagem será enviada.
 * @param {string} content - O conteúdo textual base da mensagem.
 * @param {Array<object>} offers - Lista de ofertas a serem formatadas e incluídas.
 * @param {string} offersTitle - Título ou cabeçalho para a seção de ofertas.
 * @returns {Promise<object>} O objeto da mensagem enviada retornado pelo cliente.
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
    console.log("Informações de leitura:", info);
  }

  // Retorna o objeto da mensagem para quem chamou a função
  return sentMessage;
};
