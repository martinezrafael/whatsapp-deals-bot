import "dotenv/config";
import Groq from "groq-sdk";
import fs from "fs";
import path from "path";

/**
 * Instância do cliente Groq utilizando a chave de API proveniente das variáveis de ambiente.
 * @type {Groq}
 */
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * Carrega e interpreta o arquivo de configuração do prompt (prompt.json).
 *
 * @function loadPromptConfig
 * @returns {Object|null} Retorna o objeto de configuração parseado ou null em caso de erro.
 */
function loadPromptConfig() {
  try {
    const configPath = path.resolve("./prompt.json");
    const data = fs.readFileSync(configPath, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Erro ao carregar prompt.json:", error);
    return null;
  }
}

/**
 * Constrói a string de prompt do sistema baseada nas configurações fornecidas.
 *
 * @function buildSystemPrompt
 * @param {Object} config - Objeto contendo as configurações de sistema e instruções.
 * @returns {string} String formatada para ser utilizada como system prompt na API.
 */
function buildSystemPrompt(config) {
  const { sistema, instrucoes } = config;
  return `Você é um ${sistema.role}.
Objetivo: ${sistema.objetivo}
Tom: ${sistema.tom}
Linguagem: ${sistema.linguagem}
Público: ${sistema.público}
INSTRUÇÕES:
- Formato: ${instrucoes.formato}
- Comprimento: ${instrucoes.comprimento}
- Estrutura: ${instrucoes.estrutura.join(" → ")}
TEMAS A INCLUIR:
${instrucoes.incluir.map((item) => `• ${item}`).join("\n")}
TEMAS A EVITAR:
${instrucoes.evitar.map((item) => `• ${item}`).join("\n")}
ELEMENTOS OPCIONAIS:
${instrucoes.elementos_opcionais.map((item) => `• ${item}`).join("\n")}
TEMAS SUGERIDOS PARA INSPIRAÇÃO:
${config.temas_sugeridos.map((tema) => `• ${tema}`).join("\n")}
`;
}

/**
 * Solicita uma completude de chat à API do Groq utilizando as configurações do prompt.json.
 *
 * @async
 * @function getGroqChatCompletion
 * @throws {Error} Lança um erro caso o arquivo prompt.json não possa ser carregado.
 * @returns {Promise<Object>} Retorna a promessa com a resposta da API do Groq.
 */
export async function getGroqChatCompletion() {
  const config = loadPromptConfig();
  if (!config) {
    throw new Error(
      "Não foi possível carregar o arquivo prompt.json. Verifique se ele existe.",
    );
  }

  const systemPrompt = buildSystemPrompt(config);

  return groq.chat.completions.create({
    messages: [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: config.instrucoes_para_api.parametro_prompt,
      },
    ],
    model: "openai/gpt-oss-20b",
  });
}
