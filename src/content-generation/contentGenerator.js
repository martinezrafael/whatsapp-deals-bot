import { getGroqChatCompletion } from "./providers/groq.js";

/**
 * Cria conteúdo utilizando a API do Groq e processa a resposta como JSON.
 *
 * @async
 * @function contentGenerator
 * @returns {Promise<object>} O conteúdo gerado e convertido em objeto JavaScript.
 * @throws {Error} Caso nenhum conteúdo seja gerado pela IA ou ocorra erro no processamento do JSON.
 */
export const contentGenerator = async () => {
  try {
    const chatCompletion = await getGroqChatCompletion();
    const content = chatCompletion.choices[0]?.message?.content || "";

    if (!content) {
      throw new Error("Nenhum conteúdo foi gerado pela IA");
    }

    // Tenta converter a string retornada em um objeto JSON válido
    const parsed = JSON.parse(content);

    return parsed;
  } catch (error) {
    console.error("Erro ao criar conteúdo:", error);
    throw error;
  }
};
