import "dotenv/config";
import qrcode from "qrcode-terminal";
import pkg from "whatsapp-web.js";
const { Client, LocalAuth } = pkg;

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

/**
 * Gerencia o processo de autenticação com a API do Mercado Livre.
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
 * Função principal que executa o ciclo de vida da aplicação (Bot PromoCoffe).
 * @async
 * @function run
 * @returns {Promise<Client>} Retorna o cliente WhatsApp ativo para o app.js.
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

  try {
    console.log("[ML] Autenticando e sincronizando banco...");
    await handleAuthentication();

    const accessToken = await getLastToken();
    if (!accessToken) throw new Error("AccessToken não encontrado no banco.");

    /** @type {string[]} Lista de termos para variação de busca */
    const termos = [
      "café especial grãos",
      "café especial moído",
      "moedor café manual",
      "prensa francesa inox",
      "café matas de minas",
      "kit café especial",
    ];

    const termoAleatorio = termos[Math.floor(Math.random() * termos.length)];
    const limit = mlSearchConfig.defaultParams.limit || 20;

    // Busca o offset persistido para este termo específico
    const offset = await getAndIncrementOffset(termoAleatorio, limit);

    const queryParams = {
      ...mlSearchConfig.defaultParams,
      q: termoAleatorio,
      limit: limit,
      offset: offset,
    };

    console.log(`[Busca] Termo: ${termoAleatorio} | Offset: ${offset}`);

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

    // Geração de conteúdo criativo pela IA
    const createdContent = await contentGenerator();
    if (createdContent)
      await saveAiContent(createdContent.content, createdContent.theme);

    // Recupera todas as ofertas não enviadas do banco
    const allOffers = await getAllOffersWithProducts();

    /** @type {object[]} Seleciona apenas as 4 primeiras ofertas */
    const offersToSend = allOffers.slice(0, 4);
    const lastAiContent = await getLastAiContent();

    if (lastAiContent && offersToSend.length > 0) {
      await sendMessage(
        whatsappClient,
        groupId,
        lastAiContent.content,
        offersToSend,
      );

      // Atualiza o status das ofertas no banco
      await Promise.all(offersToSend.map((o) => markOfferAsSent(o.product_id)));

      // Logs de auditoria
      await LogsAiContent(lastAiContent.id, groupId, groupName);
      if (lastAiContent.theme)
        await saveThemeAiContent(lastAiContent.theme, lastAiContent.id);

      console.log(
        `[Fluxo] Ciclo finalizado. ${offersToSend.length} ofertas enviadas.`,
      );
    }

    return whatsappClient;
  } catch (error) {
    console.error("[Fluxo] Erro crítico capturado:", error.message);

    // Anexa o cliente ao erro para que o app.js possa enviar o alerta via WhatsApp
    error.client = whatsappClient;
    throw error;
  }
};
