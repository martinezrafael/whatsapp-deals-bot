import "dotenv/config";
import qrcode from "qrcode-terminal";
import { Client } from "whatsapp-web.js";

// Configurações
import {
  mlAuthConfig,
  mlSearchConfig,
  mlTokenConfig,
} from "./mercado-livre/config/constants.js";

// Serviços de API
import { searchResources } from "./mercado-livre/resources/searchResources.js";
import { prepareProductUrls } from "./mercado-livre/resources/prepareProductUrls.js";
import { generateAffiliateLinks } from "./mercado-livre/resources/generateAffiliateLinks.js";
import { authenticateAndFetchToken } from "./mercado-livre/auth/authenticateAndFetchToken.js";

// Serviços de WhatsApp e Conteúdo
import { sendMessage } from "./whatsapp/connector.js";
import { contentGenerator } from "./content-generation/contentGenerator.js";

// Repositories
import {
  saveAuthToken,
  getLastToken,
} from "./database/repositories/authRepository.js";
import {
  saveProductsToDb,
  saveOffersToDb,
  getAllOffersWithProducts,
  markOfferAsSent,
} from "./database/repositories/productRepository.js";
import {
  saveAiContent,
  getLastAiContent,
  LogsAiContent,
  saveThemeAiContent,
} from "./database/repositories/contentRepository.js";

const groupId = process.env.GROUP_ID;
const groupName = process.env.GROUP_NAME;

/**
 * Orquestra o fluxo de autenticação: busca dados na API e persiste no Banco de Dados.
 *
 * @async
 * @function handleAuthentication
 * @returns {Promise<object>} O registro de autenticação salvo.
 * @throws {Error} Caso a API não retorne os dados necessários.
 */
const handleAuthentication = async () => {
  const authPayload = await authenticateAndFetchToken(
    mlAuthConfig,
    mlTokenConfig,
  );
  if (!authPayload) throw new Error("Falha ao obter tokens da API.");
  return await saveAuthToken(authPayload.code, authPayload.accessToken);
};

/**
 * Executa o ciclo principal do bot (Autenticação -> Busca -> IA -> WhatsApp).
 *
 * @async
 * @function run
 * @returns {Promise<void>}
 */
export const run = async () => {
  console.log("[Fluxo] Iniciando aplicação...");
  const whatsappClient = new Client();

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

  try {
    console.log("[ML] Autenticando e sincronizando banco...");
    await handleAuthentication();

    const accessToken = await getLastToken();
    if (!accessToken) throw new Error("AccessToken não encontrado no banco.");

    const queryParams = {
      ...mlSearchConfig.defaultParams,
      q: process.env.TERMO_DE_BUSCA || "ofertas",
    };

    const products = await searchResources(
      mlSearchConfig.baseUrl,
      accessToken,
      queryParams,
    );
    if (products) await saveProductsToDb(products);

    const { urls, productsMap } = await prepareProductUrls();
    if (urls?.length > 0) {
      const links = await generateAffiliateLinks(urls);
      await saveOffersToDb(links, productsMap);
    }

    const createdContent = await contentGenerator();
    if (createdContent)
      await saveAiContent(createdContent.content, createdContent.theme);

    const offers = await getAllOffersWithProducts();
    const lastAiContent = await getLastAiContent();

    if (lastAiContent && offers?.length > 0) {
      await sendMessage(whatsappClient, groupId, lastAiContent.content, offers);
      await markOfferAsSent(offers[0].product_id);
      await LogsAiContent(lastAiContent.id, groupId, groupName);
      if (lastAiContent.theme)
        await saveThemeAiContent(lastAiContent.theme, lastAiContent.id);
      console.log("[Fluxo] Ciclo finalizado com sucesso.");
    }
  } catch (error) {
    console.error("[Fluxo] Erro crítico:", error.message);
  }
};
