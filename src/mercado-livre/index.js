import "dotenv/config";
import qrcode from "qrcode-terminal";
import { Client } from "whatsapp-web.js";
import { mlAuthConfig, mlSearchConfig, mlTokenConfig } from "./config/mlConfig";
import { searchResources } from "./resources/searchResources";
import {
  authenticateAndSave,
  saveAuthToken,
} from "../database/databaseService";

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

  /*BUSCA DE PRODUTOS*/
  try {
    const products = await searchResources(mlSearchConfig);
  } catch (error) {
    console.log({ message: error.message });
  }
};
