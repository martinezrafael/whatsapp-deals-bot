import { getGroqChatCompletion } from "./providers/groq.js";

/**
 * Gera conteúdo via IA utilizando o provedor Groq e trata a resposta como um objeto JSON.
 * Limpa automaticamente marcações de bloco de código markdown (```json).
 * * @async
 * @function contentGenerator
 * @returns {Promise<Object>} Conteúdo e tema parseados da resposta da IA.
 * @throws {Error} Se a IA não retornar conteúdo ou se o JSON for inválido.
 */
export const contentGenerator = async () => {
  const chatCompletion = await getGroqChatCompletion();
  let rawContent = chatCompletion.choices[0]?.message?.content || "";

  if (!rawContent) {
    throw new Error("Nenhum conteúdo foi gerado pela IA");
  }

  /**
   * Limpa blocos de código markdown.
   * A Regex abaixo remove as tags iniciais (```json) e finais (```)
   * em uma única linha para evitar erros de compilação.
   */
  const cleanedContent = rawContent.replace(/```json|```/g, "").trim();

  try {
    return JSON.parse(cleanedContent);
  } catch (error) {
    console.error("[IA] Falha ao processar JSON. Conteúdo bruto:", rawContent);
    throw new Error("A resposta da IA não é um JSON válido");
  }
};
