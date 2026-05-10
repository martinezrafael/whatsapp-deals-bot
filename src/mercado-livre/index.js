import "dotenv/config";
import qrcode from "qrcode-terminal";
import { Client } from "whatsapp-web.js";
import { mlAuthConfig, mlSearchConfig, mlTokenConfig } from "./config/mlConfig";
import { searchResources } from "./resources/searchResources";
import {
  authenticateAndSave,
  getAllOffersWithProducts,
  LogsAiContent,
  markOfferAsSent,
  saveAiContent,
  saveAuthToken,
  saveOffersToDb,
  saveProductsToDb,
} from "../database/databaseService";
import { prepareProductUrls } from "./resources/prepareProductUrls";
import { generateAffiliateLinks } from "./resources/generateAffiliateLinks";
import { sendMessage } from "../services/sendMessage";

export const run = async () => {
  /*CONFIG WHATSAPP*/
  try {
    const whatsappClient = new Client();

    whatsappClient.on("qr", (qr) => {
      qrcode.generate(qr, { small: true });
    });

    whatsappClient.initialize();
  } catch (error) {
    console.log({ message: error.message });
  }

  /*AUTENTICAÇÃO*/
  try {
    await authenticateAndSave(mlAuthConfig, mlTokenConfig);
  } catch (error) {
    console.log({ message: error.message });
  }

  /*BUSCAR E SALVAR PRODUTOS*/
  try {
    const products = await searchResources(mlSearchConfig);
    if (products) {
      await saveProductsToDb(products);
    }
  } catch (error) {
    console.log({ message: error.message });
  }

  /*BUSCA OS PRODUTOS NO BANCO E CRIA OFERTAS*/
  try {
    const { urls, productsMap } = await prepareProductUrls();
    if (urls && productsMap) {
      const affiliateLinksGenerated = await generateAffiliateLinks(urls);
      await saveOffersToDb(affiliateLinksGenerated);
    }
  } catch (error) {
    console.log({ message: error.message });
  }

  /*CRIA E SALVA OS CONTEÚDOS GERADOS POR IA*/
  try {
    const createdContent = createContent();
    await saveAiContent(createdContent.content, createdContent.theme);
  } catch (error) {
    console.log({ message: error.message });
  }

  /*ENVIA O CONTEUDO GERADO PELA IA E AS OFERTAS VIA WHATSAPP*/
  const groupId = process.env.GROUP_ID;
  const groupName = process.env.GROUP_NAME;
  try {
    const messageSent = await sendMessage(
      whatsappClient,
      groupId,
      createdContent,
      await getAllOffersWithProducts(),
    );
    await markOfferAsSent(createdContent.id);
    await LogsAiContent(createdContent.id, groupId, groupName);
  } catch (error) {
    console.log({ message: error.message });
  }
};
