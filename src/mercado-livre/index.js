import "dotenv/config";
import pool from "../database/database.js";
import {
  saveToDb,
  getLastToken,
  saveProductsToDb,
  getProductsFromDb,
} from "../database/dbService.js";
import { authenticateAndFetchToken } from "./auth/authOrchestrator.js";
import { searchResources } from "./resources/searchResources.js";
import { gerarSlug } from "./utils/stringUtils.js";
import { generateResourceUrls } from "./resources/generateResourceUrls.js";
import { generateAffiliateLinks } from "./resources/generateAffiliateLinks.js"; // Importe sua nova função
import {
  mlAuthConfig,
  mlTokenConfig,
  mlSearchConfig,
  mlAffiliateConfig,
} from "./config/mlConfig.js";

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

    if (searchData.results?.length > 0) {
      await saveProductsToDb(pool, searchData.results);

      const produtosParaLink = await getProductsFromDb(pool);
      const baseUrlML = "https://www.mercadolivre.com.br";

      const urlsOriginais = generateResourceUrls(
        produtosParaLink,
        baseUrlML,
        (item) => {
          const slug = gerarSlug(item.name);
          return `${slug}/p/${item.ml_id}`;
        },
      );

      const linksAfiliados = await generateAffiliateLinks(urlsOriginais);

      console.log(linksAfiliados);
    } else {
      console.log("Nenhum produto encontrado para o termo.");
    }
  } catch (error) {
    console.error("Erro crítico no fluxo:", error.message);
    process.exit(1);
  } finally {
    await pool.end();
    console.log("Conexão com o banco encerrada.");
  }
}

await runFlow();
