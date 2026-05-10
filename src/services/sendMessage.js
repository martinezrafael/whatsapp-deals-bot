import { formatter } from "./formatter.js";

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

  // Retorna o objeto da mensagem para quem chamou a função
  return sentMessage;
};
