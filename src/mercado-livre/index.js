import "dotenv/config";
import qrcode from "qrcode-terminal";
import { Client } from "whatsapp-web.js";
import { mlAuthConfig, mlSearchConfig, mlTokenConfig } from "./config/mlConfig";
import { searchResources } from "./resources/searchResources";
import {
  authenticateAndSave,
  saveAuthToken,
  saveProductsToDb,
} from "../database/databaseService";
import { prepareProductUrls } from "./resources/prepareProductUrls";
import { generateAffiliateLinks } from "./resources/generateAffiliateLinks";

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
      await generateAffiliateLinks(urls);
    }
  } catch (error) {}
};
