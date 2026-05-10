import "dotenv/config";
import Groq from "groq-sdk";
import fs from "fs";
import path from "path";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * Carrega a configuração do prompt do arquivo JSON.
 * @returns {Object|null}
 */
const loadPromptConfig = () => {
  try {
    return JSON.parse(fs.readFileSync(path.resolve("./prompt.json"), "utf-8"));
  } catch (error) {
    console.error("Erro ao carregar prompt.json:", error.message);
    return null;
  }
};

/**
 * Monta o system prompt baseado na configuração.
 * @param {Object} config - Configurações do prompt.
 * @returns {string}
 */
const buildSystemPrompt = (config) => {
  const { sistema, instrucoes } = config;
  return `Você é um ${sistema.role}.
Objetivo: ${sistema.objetivo}
Tom: ${sistema.tom} | Linguagem: ${sistema.linguagem}

INSTRUÇÕES:
- Estrutura: ${instrucoes.estrutura.join(" → ")}
- Incluir: ${instrucoes.incluir.join(", ")}
- Evitar: ${instrucoes.evitar.join(", ")}`;
};

/**
 * Solicita a geração de texto para a API do Groq.
 * @async
 * @returns {Promise<Object>}
 */
export async function getGroqChatCompletion() {
  const config = loadPromptConfig();
  if (!config) throw new Error("Configuração de prompt não encontrada.");

  return groq.chat.completions.create({
    messages: [
      { role: "system", content: buildSystemPrompt(config) },
      { role: "user", content: config.instrucoes_para_api.parametro_prompt },
    ],
    model: "llama-3.3-70b-versatile",
    response_format: { type: "json_object" }, // Garante retorno em formato JSON
  });
}
