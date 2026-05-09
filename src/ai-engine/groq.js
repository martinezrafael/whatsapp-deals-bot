import "dotenv/config";
import Groq from "groq-sdk";
import fs from "fs";
import path from "path";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

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
        content:
          "Gere um conteúdo original e interessante sobre café especial para ser compartilhado em um grupo de WhatsApp.",
      },
    ],
    model: "openai/gpt-oss-20b",
  });
}
