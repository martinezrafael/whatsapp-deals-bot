import "dotenv/config";
import pool from "../database/database.js";
import {
  saveToDb,
  getLastToken,
  saveProductsToDb,
  getProductsFromDb,
  saveAffiliateLinksToDb,
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

import { getGroqChatCompletion } from "../ai-engine/groq.js";

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

    // 3. Persistência e Recuperação dos dados do Banco
    await saveProductsToDb(pool, searchData.results);
    const produtosParaLink = await getProductsFromDb(pool);

    console.log(produtosParaLink);

    // 4. Preparação das URLs e Criação do Mapa de Referência
    const baseUrlML = "https://www.mercadolivre.com.br";
    const productsMap = {};

    const urlsOriginais = generateResourceUrls(
      produtosParaLink,
      baseUrlML,
      (item) => {
        const slug = gerarSlug(item.name);
        const path = `${slug}/p/${item.ml_id}`;

        // Montamos a URL completa exatamente como a generateResourceUrls fará
        // para usá-la como chave no Mapa
        const fullUrl = `${baseUrlML}/${path}`;
        productsMap[fullUrl] = item;

        return path;
      },
    );

    console.log(`🔗 ${urlsOriginais.length} URLs preparadas para conversão.`);

    // 5. Geração de Links de Afiliado (Chamada à API de Link Builder)
    const linksAfiliados = await generateAffiliateLinks(urlsOriginais);

    // 6. Salvamento das Ofertas com dados enriquecidos
    if (linksAfiliados?.urls?.length > 0) {
      console.log(
        `[Affiliate] ${linksAfiliados.total_success} links convertidos com sucesso.`,
      );

      // Enviamos o Mapa para que o dbService saiba preencher name, image_url, etc.
      await saveAffiliateLinksToDb(pool, linksAfiliados, productsMap);

      console.log("✅ Fluxo finalizado: Ofertas e metadados salvos.");
    } else {
      console.warn("⚠️ Nenhuma oferta válida foi gerada para salvar no banco.");
    }
  } catch (error) {
    console.error("❌ Erro crítico no fluxo:", error.message);
    process.exit(1);
  } finally {
    await pool.end();
    console.log("🔌 Conexão com o banco encerrada.");
  }
}

// Execução do fluxo
await runFlow();
