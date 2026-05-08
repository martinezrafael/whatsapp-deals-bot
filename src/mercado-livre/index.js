import "dotenv/config";
import pool from "../database/database.js";
import {
  saveToDb,
  getLastToken,
  saveProductsToDb,
  getProductsFromDb,
  saveAffiliateLinksToDb, // Certifique-se de exportar esta nova função
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

async function runFlow() {
  try {
    console.log("🚀 Iniciando fluxo de integração Mercado Livre...");

    // 1. Autenticação e Atualização de Token
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

    // 2. Busca de Produtos (API Oficial)
    const termoDeBusca = "Café Especial";
    const queryParams = { ...mlSearchConfig.defaultParams, q: termoDeBusca };

    const searchData = await searchResources(
      mlSearchConfig.baseUrl,
      currentToken,
      queryParams,
    );

    if (!searchData.results || searchData.results.length === 0) {
      console.log(`[Busca] Nenhum produto encontrado para: "${termoDeBusca}"`);
      return;
    }

    // 3. Persistência dos produtos brutos para referência
    await saveProductsToDb(pool, searchData.results);
    const produtosParaLink = await getProductsFromDb(pool);

    // 4. Preparação das URLs para o Link Builder
    const baseUrlML = "https://www.mercadolivre.com.br";
    const urlsOriginais = generateResourceUrls(
      produtosParaLink,
      baseUrlML,
      (item) => {
        const slug = gerarSlug(item.name);
        return `${slug}/p/${item.ml_id}`;
      },
    );

    // 5. Geração de Links de Afiliado (API Interna/Builder)
    const linksAfiliados = await generateAffiliateLinks(urlsOriginais);

    // 6. Salvamento das Ofertas Finais no Banco de Dados
    if (linksAfiliados?.urls?.length > 0) {
      console.log(
        `[Affiliate] ${linksAfiliados.total_success} links gerados. Salvando ofertas...`,
      );

      await saveAffiliateLinksToDb(pool, linksAfiliados);

      console.log("✅ Fluxo finalizado: Ofertas prontas para postagem.");
    } else {
      console.warn(
        "⚠️ O lote de afiliados não retornou links válidos para salvar.",
      );
    }
  } catch (error) {
    console.error("❌ Erro crítico no fluxo:", error.message);
    process.exit(1);
  } finally {
    // Encerra a conexão com o banco de dados
    await pool.end();
    console.log("🔌 Conexão com o banco encerrada.");
  }
}

// Execução do fluxo
await runFlow();
