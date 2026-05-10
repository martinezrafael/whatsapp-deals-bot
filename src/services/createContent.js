import { getGroqChatCompletion } from "../ai-engine/groq.js";

export const createContent = async () => {
  try {
    const chatCompletion = await getGroqChatCompletion();
    const content = chatCompletion.choices[0]?.message?.content || "";

    if (!content) {
      throw new Error("Nenhum conteúdo foi gerado pela IA");
    }

    const parsed = JSON.parse(content);

    return parsed;
  } catch (error) {
    console.error("Erro ao criar conteúdo:", error);
    throw error;
  }
};
