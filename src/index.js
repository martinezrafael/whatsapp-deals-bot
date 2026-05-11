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

// Scrapper
import { scrapePrice } from "./scrapper/scrapper.js";

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
  savePriceToDb,
} from "./database/repositories/productRepository.js";
import {
  saveAiContent,
  getLastAiContent,
  LogsAiContent,
  saveThemeAiContent,
} from "./database/repositories/contentRepository.js";

const groupId = process.env.GROUP_ID;
const groupName = process.env.GROUP_NAME;

const whatsappClient = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    handleSIGINT: false,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  },
});

export const initializeWhatsApp = async () => {
  return new Promise((resolve, reject) => {
    whatsappClient.on("qr", (qr) => {
      console.log("[WhatsApp] QR Code gerado:");
      qrcode.generate(qr, { small: true });
    });
    whatsappClient.on("ready", () => {
      console.log("[WhatsApp] Conectado e Pronto!");
      resolve(whatsappClient);
    });
    whatsappClient.on("auth_failure", (msg) => reject(new Error(msg)));
    whatsappClient.initialize().catch(reject);
  });
};

const handleAuthentication = async () => {
  const authPayload = await authenticateAndFetchToken(
    mlAuthConfig,
    mlTokenConfig,
  );
  if (!authPayload) throw new Error("Falha ao obter tokens da API.");
  return await saveAuthToken(authPayload.code, authPayload.accessToken);
};

/**
 * Função principal do ciclo de curadoria.
 */
export const run = async () => {
  try {
    console.log("[ML] Autenticando...");
    await handleAuthentication();

    const accessToken = await getLastToken();
    if (!accessToken) throw new Error("AccessToken não encontrado.");

    // 1. Busca de Produtos
    const termos = [
      "café especial grãos",
      "café especial moído",
      "moedor café manual",
      "prensa francesa inox",
    ];
    const termoAleatorio = termos[Math.floor(Math.random() * termos.length)];
    const limit = mlSearchConfig.defaultParams.limit || 50; // Aumentado para garantir mais opções
    const offset = await getAndIncrementOffset(termoAleatorio, limit);

    const queryParams = {
      ...mlSearchConfig.defaultParams,
      q: termoAleatorio,
      limit,
      offset,
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

    // 2. Geração de Conteúdo
    const createdContent = await contentGenerator();
    if (createdContent)
      await saveAiContent(createdContent.content, createdContent.theme);

    // 3. Processamento de Preços Reais (Scrapper)
    const allOffers = await getAllOffersWithProducts();

    // Pegamos um pool inicial, mas o filtro de isRealDiscount no formatter cuidará do resto
    const offersToSend = allOffers.slice(0, 4);

    if (offersToSend.length > 0) {
      console.log(
        `[Scrapper] Capturando preços reais de ${offersToSend.length} produtos...`,
      );

      for (let i = 0; i < offersToSend.length; i++) {
        try {
          const scrapData = await scrapePrice(offersToSend[i].product_id);

          if (scrapData) {
            const savedPrice = await savePriceToDb(
              offersToSend[i].product_id,
              scrapData,
            );

            // Atualização segura das propriedades para evitar "Assignment to constant variable"
            offersToSend[i].current_price = savedPrice.current_price;
            offersToSend[i].original_price = savedPrice.original_price;
            offersToSend[i].discount_percentage =
              savedPrice.discount_percentage;
          }
        } catch (error) {
          console.error(
            `[Scrapper] Erro no item ${offersToSend[i].product_id}:`,
            error.message,
          );
          // Se falhar, o item segue com os dados que já tem ou "Preço: Consulte no site"
        }
        await new Promise((r) => setTimeout(r, 2500));
      }

      const lastAiContent = await getLastAiContent();

      // 4. Envio
      if (lastAiContent) {
        await sendMessage(
          whatsappClient,
          groupId,
          lastAiContent.content,
          offersToSend,
        );

        // Marca como enviado apenas o que de fato tentamos enviar
        await Promise.all(
          offersToSend.map((o) => markOfferAsSent(o.product_id)),
        );

        await LogsAiContent(lastAiContent.id, groupId, groupName);
        if (lastAiContent.theme)
          await saveThemeAiContent(lastAiContent.theme, lastAiContent.id);

        console.log(`[Fluxo] Finalizado com ${offersToSend.length} ofertas.`);
      }
    }

    return whatsappClient;
  } catch (error) {
    console.error("[Fluxo] Erro crítico:", error.message);
    throw error;
  }
};
