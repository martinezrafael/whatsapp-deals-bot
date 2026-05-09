import "dotenv/config";
import pool from "../database/database.js";
import {
  saveToDb,
  getLastToken,
  saveProductsToDb,
  getProductsFromDb,
  saveAffiliateLinksToDb,
  saveCafeContent,
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

async function runFlow() {
  try {
    const authPayload = await authenticateAndFetchToken(
      mlAuthConfig,
      mlTokenConfig,
    );

    if (!authPayload?.accessToken) {
      throw new Error("O provedor não retornou um token válido.");
    }

    await saveToDb(pool, "auth_tokens", {
      code: authPayload.code,
      access_token: authPayload.accessToken,
    });

    const currentToken = await getLastToken(pool);
    if (!currentToken) throw new Error("Falha ao recuperar o token do banco.");

    const termoDeBusca = "Café Especial";
    const queryParams = { ...mlSearchConfig.defaultParams, q: termoDeBusca };

    const searchData = await searchResources(
      mlSearchConfig.baseUrl,
      currentToken,
      queryParams,
    );

    if (!searchData.results || searchData.results.length === 0) {
      return;
    }

    await saveProductsToDb(pool, searchData.results);
    const produtosParaLink = await getProductsFromDb(pool);

    const baseUrlML = "https://www.mercadolivre.com.br";
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
      await saveCafeContent(pool, content);
    }
  } catch (error) {
    console.error({ message: error.message });
    process.exit(1);
  } finally {
    await pool.end();
  }
}

await runFlow();
