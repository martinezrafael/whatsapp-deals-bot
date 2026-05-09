import { formatter } from "./formatter.js";

export const sendMessage = async (
  client,
  chatId,
  content,
  offers,
  offersTitle,
) => {
  await client.sendMessage(chatId, formatter(content, offers, offersTitle));
};
