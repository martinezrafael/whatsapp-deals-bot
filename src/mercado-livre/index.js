import "dotenv/config";
import pool from "../database/database.js";
import {
  saveToDb,
  getLastToken,
  saveProductsToDb,
  getProductsFromDb,
  saveAffiliateLinksToDb,
  saveCafeContent,
  getAffiliateLinksToDb,
  getPendingCafeContent,
  markCafeContentAsSent,
  logCafeContentSend,
  recordCafeThemeUsed,
  getCafeContentHistory,
  getCafeContentStats,
} from "../database/dbService.js";
import { authenticateAndFetchToken } from "./auth/authOrchestrator.js";
import { searchResources } from "./resources/searchResources.js";
import { gerarSlug } from "./utils/stringUtils.js";
import { generateResourceUrls } from "./resources/generateResourceUrls.js";
import { generateAffiliateLinks } from "./resources/generateAffiliateLinks.js";
import {
  mlAuthConfig,
  mlTokenConfig,
  mlSearchConfig,
} from "./config/mlConfig.js";
import { createContent } from "../services/createContent.js";
import { sendMessage } from "../services/sendMessage.js";
import { Client } from "whatsapp-web.js";
import qrcode from "qrcode-terminal";

const client = new Client();

client.on("qr", (qr) => {
  qrcode.generate(qr, { small: true });
});

client.on("ready", async () => {
  console.log("Client is ready!");
  await runFlow();
});

client.initialize();

async function runFlow() {
  try {
    const authPayload = await authenticateAndFetchToken(
      mlAuthConfig,
      mlTokenConfig,
    );
    await saveToDb(pool, "auth_tokens", {
      code: authPayload.code,
      access_token: authPayload.accessToken,
    });

    const currentToken = await getLastToken(pool);
    const termoDeBusca = process.env.TERMO_DE_BUSCA;
    const queryParams = { ...mlSearchConfig.defaultParams, q: termoDeBusca };
    const searchData = await searchResources(
      mlSearchConfig.baseUrl,
      currentToken,
      queryParams,
    );

    if (!searchData.results) {
      return;
    }

    await saveProductsToDb(pool, searchData.results);
    const produtosParaLink = await getProductsFromDb(pool);
    const baseUrlML = process.env.BASE_URL_ML;
    const productsMap = {};
    const urlsOriginais = generateResourceUrls(
      produtosParaLink,
      baseUrlML,
      (item) => {
        const slug = gerarSlug(item.name);
        const path = `${slug}/p/${item.ml_id}`;
        const fullUrl = `${baseUrlML}/${path}`;
        productsMap[fullUrl] = item;
        return path;
      },
    );

    const linksAfiliados = await generateAffiliateLinks(urlsOriginais);
    if (linksAfiliados?.urls?.length > 0) {
      await saveAffiliateLinksToDb(pool, linksAfiliados, productsMap);

      const content = await createContent();
      await saveCafeContent(pool, content.conteudo, content.tema);

      const conteudoGerado = await getPendingCafeContent(pool);
      const offers = await getAffiliateLinksToDb(pool);

      const sentMsg = await sendMessage(
        client,
        process.env.GROUP_ID,
        conteudoGerado,
        offers,
      );

      if (sentMsg) {
        const info = await sentMsg.getInfo();
        console.log("Informações de leitura:", info);
      }

      await markCafeContentAsSent(pool, conteudoGerado.id);

      await logCafeContentSend(
        pool,
        conteudoGerado.id,
        process.env.GROUP_ID,
        process.env.GROUP_NAME,
      );

      await recordCafeThemeUsed(pool, content.tema, conteudoGerado.id);

      await getCafeContentHistory(pool);

      await getCafeContentStats(pool);
    }
  } catch (error) {
    console.error({ message: error.message });
    process.exit(1);
  } finally {
    await pool.end();
  }
}
