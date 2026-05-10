import "dotenv/config";
import qrcode from "qrcode-terminal";
import pkg from "whatsapp-web.js";
const { Client, LocalAuth } = pkg;

// Configurações e Repositories (Imports mantidos...)
import {
  mlAuthConfig,
  mlSearchConfig,
  mlTokenConfig,
} from "./mercado-livre/config/constants.js";
import { searchResources } from "./mercado-livre/resources/searchResources.js";
import { prepareProductUrls } from "./mercado-livre/resources/prepareProductUrls.js";
import { generateAffiliateLinks } from "./mercado-livre/resources/generateAffiliateLinks.js";
import { authenticateAndFetchToken } from "./mercado-livre/auth/authenticateAndFetchToken.js";
import { sendMessage } from "./whatsapp/connector.js";
import { contentGenerator } from "./content-generation/contentGenerator.js";
import {
  saveAuthToken,
  getLastToken,
} from "./database/repositories/authRepository.js";
import {
  saveProductsToDb,
  saveOffersToDb,
  getAllOffersWithProducts,
  markOfferAsSent,
  getAndIncrementOffset,
} from "./database/repositories/productRepository.js";
import {
  saveAiContent,
  getLastAiContent,
  LogsAiContent,
  saveThemeAiContent,
} from "./database/repositories/contentRepository.js";

const groupId = process.env.GROUP_ID;
const groupName = process.env.GROUP_NAME;

const handleAuthentication = async () => {
  const authPayload = await authenticateAndFetchToken(
    mlAuthConfig,
    mlTokenConfig,
  );
  if (!authPayload) throw new Error("Falha ao obter tokens da API.");
  return await saveAuthToken(authPayload.code, authPayload.accessToken);
};

/**
 * Função principal (Bot PromoCoffe)
 * @returns {Promise<Client>} Retorna o cliente para o monitoramento no app.js
 */
export const run = async () => {
  console.log("[Fluxo] Iniciando aplicação...");

  const whatsappClient = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
      handleSIGINT: false,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    },
  });

  const waitForWhatsApp = new Promise((resolve) => {
    whatsappClient.on("qr", (qr) => {
      console.log("[WhatsApp] QR Code gerado:");
      qrcode.generate(qr, { small: true });
    });
    whatsappClient.on("ready", () => {
      console.log("[WhatsApp] Conectado!");
      resolve();
    });
  });

  whatsappClient.initialize();
  await waitForWhatsApp;

  // --- O SEGREDO DO TESTE ESTÁ AQUI ---
  // O erro deve ser lançado DENTRO de um try/catch que repassa o erro para o app.js
  // Mas a função PRECISA retornar o whatsappClient para o app.js poder enviar a mensagem.

  try {
    console.log("[Teste] Forçando erro de simulação...");
    throw new Error("Simulação de falha técnica no PromoCoffe!");

    // Todo o seu código de lógica aqui...
    // await handleAuthentication();
    // ...

    return whatsappClient; // Retorno em caso de sucesso total
  } catch (error) {
    console.error("[Fluxo] Erro capturado no index:", error.message);

    /**
     * IMPORTANTE:
     * Para que o app.js consiga enviar o alerta, ele precisa do objeto whatsappClient.
     * Nós o anexamos ao erro ou garantimos que o app.js tenha recebido a instância.
     */
    error.client = whatsappClient;
    throw error; // Repassa o erro "enriquecido" para o app.js
  }
};
