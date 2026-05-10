/**
 * @file index.js
 * @description Ponto de entrada da aplicação. Gerencia o fluxo de autenticação no Mercado Livre,
 * busca de produtos, geração de links de afiliados, criação de conteúdo via IA e envio para o WhatsApp.
 */

import "dotenv/config";
import qrcode from "qrcode-terminal";
import { Client } from "whatsapp-web.js";

// Configurações
import {
  mlAuthConfig,
  mlSearchConfig,
  mlTokenConfig,
} from "./config/mlConfig.js";

// Recursos e Serviços
import { searchResources } from "./resources/searchResources.js";
import { prepareProductUrls } from "./resources/prepareProductUrls.js";
import { generateAffiliateLinks } from "./resources/generateAffiliateLinks.js";
import { sendMessage } from "../services/sendMessage.js";
import { createContent } from "../services/createContent.js";

// Banco de Dados
import {
  authenticateAndSave,
  getAllOffersWithProducts,
  getLastAiContent,
  getLastToken,
  LogsAiContent,
  markOfferAsSent,
  saveAiContent,
  saveOffersToDb,
  saveProductsToDb,
  saveThemeAiContent,
} from "../database/databaseService.js";

/** @type {string} ID do grupo de destino do WhatsApp */
const groupId = process.env.GROUP_ID;

/** @type {string} Nome do grupo de destino para logs */
const groupName = process.env.GROUP_NAME;

/**
 * Executa o fluxo principal da aplicação.
 *
 * Passos:
 * 1. Inicializa o cliente WhatsApp e aguarda conexão via QR Code.
 * 2. Autentica na API do Mercado Livre.
 * 3. Busca produtos baseados em um termo definido.
 * 4. Gera links de afiliado para os produtos encontrados.
 * 5. Cria conteúdo textual via IA.
 * 6. Formata e envia a mensagem para o grupo do WhatsApp.
 *
 * @async
 * @function run
 * @throws {Error} Caso ocorra falha na autenticação ou conexão.
 * @returns {Promise<void>}
 */
export const run = async () => {
  console.log("[Fluxo] Iniciando aplicação...");

  const whatsappClient = new Client();

  /**
   * Promessa que resolve quando o cliente WhatsApp está autenticado e pronto.
   * @type {Promise<void>}
   */
  const waitForWhatsApp = new Promise((resolve) => {
    whatsappClient.on("qr", (qr) => {
      console.log("[WhatsApp] QR Code gerado. Escaneie para continuar:");
      qrcode.generate(qr, { small: true });
    });

    whatsappClient.on("ready", () => {
      console.log("[WhatsApp] Cliente pronto e conectado!");
      resolve();
    });
  });

  whatsappClient.initialize();
  await waitForWhatsApp;

  try {
    // --- 2. Autenticação e Token ---
    console.log("[ML] Autenticando e atualizando tokens...");
    await authenticateAndSave(mlAuthConfig, mlTokenConfig);

    const accessToken = await getLastToken();
    if (!accessToken) {
      throw new Error("Falha ao recuperar accessToken.");
    }

    // --- 3. Busca e Salvamento de Produtos ---
    const queryParams = {
      ...mlSearchConfig.defaultParams,
      q: process.env.TERMO_DE_BUSCA || "ofertas",
    };

    console.log(`[ML] Buscando produtos: "${queryParams.q}"...`);
    const products = await searchResources(
      mlSearchConfig.baseUrl,
      accessToken,
      queryParams,
    );

    if (products) {
      console.log(
        `[Banco] Salvando ${products.results?.length || 0} produtos...`,
      );
      await saveProductsToDb(products);
    }

    // --- 4. Preparação de URLs e Links de Afiliados ---
    console.log("[Fluxo] Preparando URLs dos produtos...");
    const { urls, productsMap } = await prepareProductUrls();

    if (urls && urls.length > 0) {
      console.log(`[ML] Gerando links de afiliado para ${urls.length} URLs...`);
      const affiliateLinksGenerated = await generateAffiliateLinks(urls);

      console.log("[Banco] Salvando ofertas geradas...");
      await saveOffersToDb(affiliateLinksGenerated, productsMap);
    }

    // --- 5. Geração de Conteúdo IA ---
    console.log("[IA] Solicitando criação de conteúdo...");
    const createdContent = await createContent();
    if (createdContent) {
      console.log("[Banco] Salvando conteúdo gerado pela IA...");
      await saveAiContent(createdContent.content, createdContent.theme);
    }

    // --- 6. Envio das Mensagens ---
    console.log("[Banco] Recuperando ofertas e conteúdo para envio...");
    const offers = await getAllOffersWithProducts();
    const lastAiContent = await getLastAiContent();

    if (lastAiContent && offers && offers.length > 0) {
      console.log(`[WhatsApp] Enviando para o grupo: ${groupName}...`);

      await sendMessage(whatsappClient, groupId, lastAiContent.content, offers);

      // Finalização e logs de envio
      await markOfferAsSent(offers[0].product_id);
      await LogsAiContent(lastAiContent.id, groupId, groupName);

      if (lastAiContent.theme) {
        await saveThemeAiContent(lastAiContent.theme, lastAiContent.id);
      }

      console.log("[Fluxo] Ciclo finalizado.");
    } else {
      console.warn("[Fluxo] Nada a enviar (Sem ofertas ou conteúdo).");
    }
  } catch (error) {
    console.error("[Fluxo] Erro no processo:", error.message);
  }
};

// Inicialização do Script
run().catch((err) => {
  console.error("[Fluxo] Erro fatal:", err);
});
